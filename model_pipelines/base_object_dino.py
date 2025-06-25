import os
import json
import torch
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection

def load_labels(json_path: str) -> list[str]:
    """Load label list from JSON file."""
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_model(model_name="IDEA-Research/grounding-dino-base") -> tuple:
    """
    Return processor, model, and device for Hugging Face Grounding DINO.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    processor = AutoProcessor.from_pretrained(model_name)
    model = AutoModelForZeroShotObjectDetection.from_pretrained(model_name).to(device)
    model.eval()
    return processor, model, device

def process_image(
    image_path: str,
    labels: list[str],
    processor,
    model,
    device,
    box_threshold: float = 0.35,
    text_threshold: float = 0.25
) -> list[dict]:
    """
    Run one image through Grounding DINO with a list of labels.
    Returns a list of detections: {label, score, box}.
    """
    image = Image.open(image_path).convert("RGB")

    # Pass the label list directly (HF handles it)
    inputs = processor(images=image, text=labels, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    target_sizes = torch.tensor([image.size[::-1]], device=device)

    results = processor.post_process_grounded_object_detection(
        outputs=outputs,
        input_ids=inputs["input_ids"],
        target_sizes=target_sizes,
        box_threshold=box_threshold,
        text_threshold=text_threshold
    )[0]

    detections = []
    for box, score, label in zip(results["boxes"], results["scores"], results["labels"]):
        detections.append({
            "label": label,  # Already a string
            "score": float(score),
            "box": [round(x, 2) for x in box.tolist()]
        })

    return detections

def draw_boxes(image_path: str, detections: list[dict], save_to: str = None):
    """
    Draw bounding boxes and labels on the image.
    Optionally save to file and display.
    """
    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)

    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()

    for det in detections:
        label = det["label"]
        score = det["score"]
        box = det["box"]

        draw.rectangle(box, outline="red", width=2)
        draw.text((box[0], max(0, box[1] - 10)), f"{label} ({score:.2f})", fill="red", font=font)

    if save_to:
        os.makedirs(os.path.dirname(save_to), exist_ok=True)
        image.save(save_to)

    plt.figure(figsize=(8, 8))
    plt.imshow(image)
    plt.axis("off")
    plt.title(os.path.basename(image_path))
    plt.show()

def process_images_dir(
    images_dir: str,
    labels: list[str],
    processor,
    model,
    device,
    box_threshold: float = 0.35,
    text_threshold: float = 0.25,
    visualize: bool = False,
    save_dir: str = None
) -> dict[str, list[dict]]:
    """
    Run detection on all images in a directory.
    Optionally draw/save annotated images.
    """
    results = {}
    for fname in os.listdir(images_dir):
        if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        path = os.path.join(images_dir, fname)
        detections = process_image(path, labels, processor, model, device, box_threshold, text_threshold)
        results[fname] = detections

        if visualize:
            save_path = os.path.join(save_dir, fname) if save_dir else None
            draw_boxes(path, detections, save_to=save_path)

    return results

if __name__ == "__main__":
    # Load list of labels from a JSON file
    labels = load_labels("distinct_base_objects.json")  # e.g., ["pothole", "graffiti", "dumped trash"]

    # Load Grounding DINO model
    processor, model, device = load_model()

    # Run detection
    results = process_images_dir(
        images_dir="test_images",            # your image folder
        labels=labels,
        processor=processor,
        model=model,
        device=device,
        box_threshold=0.35,
        text_threshold=0.2,
        visualize=True,                # display + optionally save
        save_dir="output_annotated"    # where to save annotated images
    )

    # Save JSON results
    with open("detection_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("✅ Saved detection_results.json")
