import torch
from PIL import Image
from transformers import OwlViTProcessor, OwlViTForObjectDetection
from typing import List
from config import Config
from detection_models import grounding_dino, owlvit, yolo  # Add yolo import

# Load model and processor once globally
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_id = "google/owlvit-base-patch32"
processor = OwlViTProcessor.from_pretrained(model_id)
model = OwlViTForObjectDetection.from_pretrained(model_id).to(device)
print("Finished loading OWL-ViT")


def detect_objects(
    image_path: str,
    text_labels: List[str],
    threshold: float = 0.1,
    allowed_keywords: List[str] = Config.ALLOWED_KEYWORDS
):
    image = Image.open(image_path).convert("RGB")

    # Preprocess input
    inputs = processor(text=text_labels, images=image, return_tensors="pt").to(device)

    # Inference
    with torch.no_grad():
        outputs = model(**inputs)

    # Post-process
    target_sizes = torch.tensor([image.size[::-1]]).to(device)
    results = processor.post_process_object_detection(
        outputs=outputs,
        target_sizes=target_sizes,
        threshold=threshold
    )[0]

    boxes = results["boxes"]
    scores = results["scores"]
    label_indices = results["labels"]

    filtered_output = []

    # Loop over each detection
    for box, score, label_idx in zip(boxes, scores, label_indices):
        # Get the corresponding text label
        try:
            label_text = text_labels[label_idx]
        except IndexError:
            print(f"IndexError: label_idx {label_idx} is out of bounds for text_labels.")
            continue

        # DEBUG: Show what's being detected
        print(f"Detected: {label_text} (score: {score:.2f})")

        # Optional filtering by allowed keywords
        if allowed_keywords:
            if not any(keyword.lower() in label_text.lower() for keyword in allowed_keywords):
                continue

        # Format and append result
        x1, y1, x2, y2 = map(int, box.tolist())
        filtered_output.append({
            "box": [x1, y1, x2, y2],
            "label": label_text,
            "score": float(score)
        })

    detected = len(filtered_output) > 0
    return detected, filtered_output
