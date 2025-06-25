import torch
from PIL import Image
import numpy as np
from typing import List
from transformers import (
    AutoProcessor, AutoModelForZeroShotObjectDetection,
    BlipProcessor, BlipForConditionalGeneration
)
from config import Config

# ===== Check CUDA availability =====
if torch.cuda.is_available():
    print(f"Using GPU: {torch.cuda.get_device_name(0)}")
    device = torch.device("cuda")
else:
    print("CUDA not available, using CPU.")
    device = torch.device("cpu")

import torch.nn.functional as F
from sentence_transformers import CrossEncoder

# ========== Load Models ==========
# Grounding DINO
dino_model_id = "IDEA-Research/grounding-dino-base"
dino_processor = AutoProcessor.from_pretrained(dino_model_id)
dino_model = AutoModelForZeroShotObjectDetection.from_pretrained(dino_model_id).to(device)

# BLIP
blip_model_id = "Salesforce/blip-image-captioning-base"
blip_processor = BlipProcessor.from_pretrained(blip_model_id)
blip_model = BlipForConditionalGeneration.from_pretrained(blip_model_id).to(device)

print("Models loaded: DINO, BLIP, STSB-RoBERTa")

cross_encoder = CrossEncoder('cross-encoder/stsb-roberta-base')

def check_alignment(label: str, caption: str, threshold=0.4):
    score = cross_encoder.predict([(label, caption)])[0]
    print(f"Cross-Encoder score: {score:.3f}")
    return score > threshold


# ========== Main Detection Function ==========
def detect_objects(image_path: str,
                   text_labels: List[str],
                   threshold: float = 0.35,
                   text_threshold: float = 0.35,
                   allowed_keywords: List[str] = Config.ALLOWED_KEYWORDS):
    
    image = Image.open(image_path).convert("RGB")

    # Grounding DINO Detection
    inputs = dino_processor(images=image, text=text_labels, return_tensors="pt").to(device)
    outputs = dino_model(**inputs)
    target_size = torch.tensor([image.size[::-1]]).to(device)

    results = dino_processor.post_process_grounded_object_detection(
        outputs=outputs,
        input_ids=inputs["input_ids"],
        target_sizes=target_size,
        threshold=threshold,
        text_threshold=text_threshold
    )[0]

    boxes, labels, scores = results.get("boxes", []), results.get("labels", []), results.get("scores", [])

    filtered_output = []
    if boxes is not None:
        for box, label, score in zip(boxes, labels, scores):
            if any(keyword in label.lower() for keyword in allowed_keywords):
                x1, y1, x2, y2 = map(int, box)

                # BLIP Captioning
                object_crop = image.crop((x1, y1, x2, y2))
                blip_inputs = blip_processor(images=object_crop, return_tensors="pt").to(device)
                caption = blip_model.generate(**blip_inputs)
                caption_text = blip_processor.decode(caption[0], skip_special_tokens=True)
                print("label:", label)
                print("caption_text:", caption_text)

                # CLIP Alignment Check
                is_aligned = check_alignment(label, caption_text)  # now uses CLIP under the hood

                if is_aligned:
                    filtered_output.append({
                        "box": [x1, y1, x2, y2],
                        "label": label,
                        "score": float(score),
                        "caption": caption_text
                    })

    detected = len(filtered_output) > 0
    return detected, filtered_output
