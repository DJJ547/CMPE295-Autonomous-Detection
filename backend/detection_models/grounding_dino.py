import os, torch, time
import numpy as np
from PIL import Image
from typing import List
from transformers import (
    AutoProcessor, AutoModelForZeroShotObjectDetection,
    BlipProcessor, BlipForConditionalGeneration
)
from sentence_transformers import CrossEncoder

# ===== Device setup =====
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# ===== Models (loaded once) =====
dino_model_id = "IDEA-Research/grounding-dino-base"
dino_processor = AutoProcessor.from_pretrained(dino_model_id)
dino_model = AutoModelForZeroShotObjectDetection.from_pretrained(dino_model_id).to(device)
dino_model.eval()

blip_model_id = "Salesforce/blip-image-captioning-base"
blip_processor = BlipProcessor.from_pretrained(blip_model_id)
blip_model = BlipForConditionalGeneration.from_pretrained(blip_model_id).to(device)
blip_model.eval()

ce_model = "cross-encoder/stsb-roberta-base"
cross_encoder = CrossEncoder(ce_model)

# ===== Helpers =====
def tolist(x):
    return x if isinstance(x, list) else x.cpu().tolist()

def generate_caption(crop_img):
    """Generate BLIP caption for the cropped region."""
    inputs = blip_processor(images=crop_img, return_tensors="pt").to(device)
    with torch.no_grad():
        ids = blip_model.generate(**inputs)
    return blip_processor.decode(ids[0], skip_special_tokens=True)

def check_alignment(label, caption, ce_threshold=0.3):
    """Check if BLIP caption aligns with label using CrossEncoder."""
    score = cross_encoder.predict([(label, caption)])[0]
    print(f"CE Alignment: label={label}, caption='{caption}', score={score:.3f}")
    return score >= ce_threshold, score


# ===== Main Function =====
def detect_objects(image_path: str,
                   text_labels: List[str],
                   threshold: float = 0.4,
                   text_threshold: float = 0.3,
                   allowed_keywords: List[str] = None,
                   ce_threshold: float = 0.05,
                   pad_pct: float = 0.2):
    """
    Detect objects in an image using GroundingDINO + BLIP + CrossEncoder alignment.

    Returns:
        detected (bool): True if at least one detection passed CE filter.
        filtered_output (list): List of dicts {box, label, score, caption}.
    """
    if allowed_keywords is None:
        allowed_keywords = text_labels  # fallback: only use given labels

    image = Image.open(image_path).convert("RGB")
    w, h = image.size

    # ===== Run GroundingDINO =====
    inputs = dino_processor(images=image, text=text_labels, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = dino_model(**inputs)
    results = dino_processor.post_process_grounded_object_detection(
        outputs,
        inputs.input_ids,
        box_threshold=threshold,
        text_threshold=text_threshold,
        target_sizes=[(h, w)]
    )[0]

    boxes = tolist(results.get("boxes", []))
    labels = results.get("labels", [])
    scores = tolist(results.get("scores", []))

    filtered_output = []

    # ===== Filter detections =====
    for box, label, score in zip(boxes, labels, scores):
        if not any(keyword in label.lower() for keyword in allowed_keywords):
            continue

        # Expand crop for BLIP caption
        x1, y1, x2, y2 = map(int, box)
        bw, bh = x2 - x1, y2 - y1
        px, py = int(bw * pad_pct), int(bh * pad_pct)
        nx1, ny1 = max(0, x1 - px), max(0, y1 - py)
        nx2, ny2 = min(w, x2 + px), min(h, y2 + py)
        crop = image.crop((nx1, ny1, nx2, ny2))

        # Caption & CE Alignment
        caption = generate_caption(crop)
        aligned, ce_score = check_alignment(label, caption, ce_threshold)

        if aligned:
            filtered_output.append({
                "box": [x1, y1, x2, y2],
                "label": label,
                "score": float(score),
                "caption": caption,
                "ce_score": float(ce_score)
            })

    detected = len(filtered_output) > 0
    return detected, filtered_output
