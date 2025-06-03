import torch
from PIL import Image
import numpy as np
import cv2
from typing import List
from transformers import (
    AutoProcessor, AutoModelForZeroShotObjectDetection,
    BlipProcessor, BlipForConditionalGeneration,
    AutoModelForCausalLM, AutoTokenizer
)
from segment_anything import sam_model_registry, SamPredictor
from config import Config

# ========== Load Models ==========
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Grounding DINO
dino_model_id = "IDEA-Research/grounding-dino-base"
dino_processor = AutoProcessor.from_pretrained(dino_model_id)
dino_model = AutoModelForZeroShotObjectDetection.from_pretrained(dino_model_id).to(device)

# SAM
sam_checkpoint = "sam_vit_h_4b8939.pth"  # Ensure this is the correct path
sam = sam_model_registry["vit_h"](checkpoint=sam_checkpoint).to(device)
sam_predictor = SamPredictor(sam)

# BLIP
blip_model_id = "Salesforce/blip-image-captioning-base"
blip_processor = BlipProcessor.from_pretrained(blip_model_id)
blip_model = BlipForConditionalGeneration.from_pretrained(blip_model_id).to(device)

# Phi-style LM (you can use "microsoft/phi-2" if you have the resources)
phi_model_id = "gpt2"  # lightweight alternative
phi_tokenizer = AutoTokenizer.from_pretrained(phi_model_id)
phi_model = AutoModelForCausalLM.from_pretrained(phi_model_id).to(device)

print("Models loaded: DINO, SAM, BLIP, Phi-style LLM")


# ========== Helper Function: Alignment Score ==========
def check_alignment(label: str, caption: str, threshold: float = 0.5) -> bool:
    """
    Returns True if the caption aligns with the label based on LM judgment.
    """
    prompt = f"Does the caption \"{caption}\" describe the object \"{label}\"? Answer yes or no."
    inputs = phi_tokenizer(prompt, return_tensors="pt").to(device)
    outputs = phi_model.generate(**inputs, max_new_tokens=5)
    answer = phi_tokenizer.decode(outputs[0], skip_special_tokens=True).lower()

    return "yes" in answer


# ========== Main Detection Function ==========
def detect_objects(image_path: str,
                   text_labels: List[List[str]],
                   threshold: float = 0.35,
                   text_threshold: float = 0.35,
                   allowed_keywords: List[str] = Config.ALLOWED_KEYWORDS):
    
    image = Image.open(image_path).convert("RGB")
    image_np = np.array(image)

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
        sam_predictor.set_image(image_np)

        for box, label, score in zip(boxes, labels, scores):
            if any(keyword in label.lower() for keyword in allowed_keywords):
                x1, y1, x2, y2 = map(int, box)

                # SAM Segmentation
                input_box = np.array([[x1, y1, x2, y2]])
                transformed_boxes = sam_predictor.transform.apply_boxes_torch(
                    torch.tensor(input_box, device=device), image_np.shape[:2]
                )
                masks, _, _ = sam_predictor.predict_torch(
                    point_coords=None, point_labels=None, boxes=transformed_boxes, multimask_output=False
                )

                # BLIP Captioning
                object_crop = image.crop((x1, y1, x2, y2))
                blip_inputs = blip_processor(images=object_crop, return_tensors="pt").to(device)
                caption = blip_model.generate(**blip_inputs)
                caption_text = blip_processor.decode(caption[0], skip_special_tokens=True)

                # Phi Alignment Check
                is_aligned = check_alignment(label, caption_text)

                filtered_output.append({
                    "box": [x1, y1, x2, y2],
                    "label": label,
                    "score": float(score),
                    "caption": caption_text,
                    "aligned": is_aligned,
                    "mask": masks[0].squeeze(0).cpu().numpy().tolist()
                })

    detected = any(obj["aligned"] for obj in filtered_output)
    return detected, filtered_output
