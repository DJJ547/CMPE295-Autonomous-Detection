import os
import json
import torch
from PIL import Image, ImageDraw, ImageFont
import matplotlib.pyplot as plt
from torchvision.ops import box_iou
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


def process_image_with_batches(
    image_path: str,
    label_batches: list[list[str]],
    processor,
    model,
    device,
    box_threshold: float = 0.35,
    text_threshold: float = 0.25,
) -> list[dict]:
    image = Image.open(image_path).convert("RGB")
    all_detections = []

    for labels in label_batches:
        inputs = processor(images=image, text=labels, return_tensors="pt").to(device)
        with torch.no_grad():
            outputs = model(**inputs)

        target_sizes = torch.tensor([image.size[::-1]], device=device)
        results = processor.post_process_grounded_object_detection(
            outputs=outputs,
            input_ids=inputs["input_ids"],
            target_sizes=target_sizes,
            box_threshold=box_threshold,
            text_threshold=text_threshold,
        )[0]

        for box, score, label in zip(
            results["boxes"], results["scores"], results["labels"]
        ):
            all_detections.append(
                {
                    "label": label,
                    "score": float(score),
                    "box": [round(x, 2) for x in box.tolist()],
                }
            )

    return all_detections


def deduplicate_detections(detections: list[dict], iou_threshold=0.95) -> list[dict]:
    final_detections = []
    used = [False] * len(detections)

    for i, det1 in enumerate(detections):
        if used[i]:
            continue
        box1 = torch.tensor(det1["box"]).unsqueeze(0)
        duplicate_indices = [i]

        for j in range(i + 1, len(detections)):
            if used[j] or det1["label"] != detections[j]["label"]:
                continue
            box2 = torch.tensor(detections[j]["box"]).unsqueeze(0)
            iou = box_iou(box1, box2).item()
            if iou >= iou_threshold:
                duplicate_indices.append(j)

        best_idx = max(duplicate_indices, key=lambda idx: detections[idx]["score"])
        final_detections.append(detections[best_idx])
        for idx in duplicate_indices:
            used[idx] = True

    # Remove literal duplicates (label + rounded box)
    unique = []
    seen = set()
    for det in final_detections:
        key = (det["label"], tuple(round(x, 2) for x in det["box"]))
        if key not in seen:
            seen.add(key)
            unique.append(det)

    return unique


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
        draw.text(
            (box[0], max(0, box[1] - 10)),
            f"{label} ({score:.2f})",
            fill="red",
            font=font,
        )

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
    text_threshold: float = 0.4,
    visualize: bool = False,
    save_dir: str = None,
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
        raw_detections = process_image_with_batches(
            path, labels, processor, model, device, box_threshold, text_threshold
        )
        detections = deduplicate_detections(raw_detections, iou_threshold=0.85)

        results[fname] = detections

        if visualize:
            save_path = os.path.join(save_dir, fname) if save_dir else None
            draw_boxes(path, detections, save_to=save_path)

    return results


def load_json(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


import torch
from torchvision.ops import box_iou

def verify_and_extract_detections_with_iou(detection_results, parsed_labels, iou_threshold=0.5):
    verified_results = {}

    for image_name, detections in detection_results.items():
        matched_detections = []
        used_keys = set()

        for scenario in parsed_labels:
            base_labels = set(obj.strip().lower() for obj in scenario.get("base_objects", []))
            primary_labels = set(obj["object"].strip().lower() for obj in scenario.get("primary_objects", []))
            secondary_entries = scenario.get("secondary_objects", [])

            # Find all matching detection objects by label
            label_to_detections = {}
            for obj in detections:
                label = obj["label"].strip().lower()
                if label in base_labels:
                    label_to_detections.setdefault(label, []).append(obj)

            # Collect primary object boxes
            primary_boxes = []
            for label in primary_labels:
                primary_boxes.extend(label_to_detections.get(label, []))

            if primary_boxes:
                primary_tensors = torch.tensor([p["box"] for p in primary_boxes], dtype=torch.float32)
            else:
                primary_tensors = torch.empty((0, 4), dtype=torch.float32)

            # Include secondary detections only if they overlap with primary detections
            for sec_obj in secondary_entries:
                sec_label = sec_obj["object"].strip().lower()
                for sec_det in label_to_detections.get(sec_label, []):
                    sec_box_tensor = torch.tensor([sec_det["box"]], dtype=torch.float32)

                    if primary_tensors.shape[0] > 0:
                        ious = box_iou(sec_box_tensor, primary_tensors).squeeze(0)

                        print(f"🔍 IoUs between '{sec_det['label']}' box {sec_det['box']} and primary objects in {image_name}: {ious.tolist()}")

                        if torch.any(ious >= iou_threshold):
                            key = (sec_det["label"], tuple(round(x, 2) for x in sec_det["box"]))
                            if key not in used_keys:
                                matched_detections.append(sec_det)
                                used_keys.add(key)

            # Always include all primary detections
            for label in primary_labels:
                for prim_det in label_to_detections.get(label, []):
                    key = (prim_det["label"], tuple(round(x, 2) for x in prim_det["box"]))
                    if key not in used_keys:
                        matched_detections.append(prim_det)
                        used_keys.add(key)

        if matched_detections:
            verified_results[image_name] = matched_detections

    return verified_results



if __name__ == "__main__":
    # Load list of labels from a JSON file
    labels = load_labels(
        "distinct_base_objects.json"
    )  # e.g., ["pothole", "graffiti", "dumped trash"]

    # Load Grounding DINO model
    processor, model, device = load_model()

    # Run detection
    results = process_images_dir(
        images_dir="test_image",  # your image folder
        labels=labels,
        processor=processor,
        model=model,
        device=device,
        box_threshold=0.35,
        text_threshold=0.2,
        visualize=True,  # display + optionally save
        save_dir="output_annotated",  # where to save annotated images
    )

    # Save JSON results
    with open("detection_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print("✅ Saved detection_results.json")

    detection_results = load_json("detection_results.json")
    parsed_labels = load_json("parsed_labels.json")  # your scenario list

    verified_results = verify_and_extract_detections_with_iou(detection_results, parsed_labels)

    with open("verified_detection_results.json", "w", encoding="utf-8") as f:
        json.dump(verified_results, f, indent=2)

    print("✅ Saved verified_detection_results.json")
