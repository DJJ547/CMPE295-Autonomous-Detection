import os
import torch
from PIL import Image
from typing import List
from transformers import (
    OwlViTProcessor, OwlViTForObjectDetection,
    BlipProcessor, BlipForConditionalGeneration
)
from sentence_transformers import CrossEncoder
from config import Config

# ===== Device Setup =====
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ===== Load OWL-ViT =====
owlvit_model_id = "google/owlvit-base-patch32"
processor = OwlViTProcessor.from_pretrained(owlvit_model_id)
model = OwlViTForObjectDetection.from_pretrained(owlvit_model_id).to(device)
model.eval()

# ===== Load BLIP (Captioning) =====
blip_model_id = "Salesforce/blip-image-captioning-base"
blip_processor = BlipProcessor.from_pretrained(blip_model_id)
blip_model = BlipForConditionalGeneration.from_pretrained(blip_model_id).to(device)
blip_model.eval()

# ===== Load Cross-Encoder (Semantic Similarity) =====
ce_model_id = "cross-encoder/stsb-roberta-base"
cross_encoder = CrossEncoder(ce_model_id)


# ===== Helper: BLIP + CE Filter =====
def passes_ce(label: str, cropped_img: Image.Image, threshold: float = 0.3) -> bool:
    inputs = blip_processor(images=cropped_img, return_tensors="pt").to(device)
    ids = blip_model.generate(**inputs)
    caption = blip_processor.decode(ids[0], skip_special_tokens=True)
    score = cross_encoder.predict([(label, caption)])[0]
    print(f"  → BLIP Caption: \"{caption}\" | CE Score: {score:.2f}")
    return score >= threshold


# ===== Main Detection Function =====
def detect_objects(
    image_path: str,
    text_labels: List[str],
    threshold: float = 0.1,
    ce_threshold: float = 0.02,
    allowed_keywords: List[str] = Config.ALLOWED_KEYWORDS,
    pad_pct: float = 0.2,
):
    image = Image.open(image_path).convert("RGB")
    inputs = processor(text=text_labels, images=image, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)

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

    for box, score, label_idx in zip(boxes, scores, label_indices):
        try:
            label_text = text_labels[label_idx]
        except IndexError:
            print(f"IndexError: label_idx {label_idx} out of bounds for text_labels.")
            continue

        print(f"Detected: {label_text} (score: {score:.2f})")

        # Optional filtering by allowed keywords
        if allowed_keywords:
            if not any(keyword.lower() in label_text.lower() for keyword in allowed_keywords):
                print(f"  Skipped: '{label_text}' not in allowed keywords.")
                continue

        # Crop the image around the detection box with padding
        img_w, img_h = image.size
        x1, y1, x2, y2 = map(int, box.tolist())
        bw, bh = x2 - x1, y2 - y1
        px, py = int(bw * pad_pct), int(bh * pad_pct)

        # Clamp padded coordinates within image bounds
        nx1 = max(0, x1 - px)
        ny1 = max(0, y1 - py)
        nx2 = min(img_w, x2 + px)
        ny2 = min(img_h, y2 + py)

        crop = image.crop((nx1, ny1, nx2, ny2))

        # BLIP + CE filter
        if not passes_ce(label_text, crop, threshold=ce_threshold):
            print(f"  Discarded by CE: {label_text}")
            continue

        filtered_output.append({
            "box": [x1, y1, x2, y2],
            "label": label_text,
            "score": float(score)
        })

    detected = len(filtered_output) > 0
    return detected, filtered_output
