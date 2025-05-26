import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection
from typing import List
from config import Config

# Load model and processor once globally to avoid reloading every time
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_id = "IDEA-Research/grounding-dino-base"
processor = AutoProcessor.from_pretrained(model_id)
model = AutoModelForZeroShotObjectDetection.from_pretrained(
    model_id).to(device)
print("Finished loading Grounding DINO")


def detect_objects(
    image_path: str,
    text_labels: List[List[str]],
    threshold: float = 0.35,
    text_threshold: float = 0.35,
    allowed_keywords: List[str] = Config.ALLOWED_KEYWORDS
):
    image = Image.open(image_path).convert("RGB")

    inputs = processor(images=image, text=text_labels, return_tensors="pt").to(device)
    outputs = model(**inputs)

    target_size = torch.tensor([image.size[::-1]]).to(device)

    results = processor.post_process_grounded_object_detection(
        outputs=outputs,
        input_ids=inputs["input_ids"],
        target_sizes=target_size,
        threshold=threshold,
        text_threshold=text_threshold
    )[0]

    boxes = results.get("boxes", [])
    labels = results.get("labels", [])
    scores = results.get("scores", [])

    filtered_output = []
    for (box, label, score) in zip(boxes, labels, scores):
        # Convert label to lowercase and check if any keyword is in it
        if any(keyword in label.lower() for keyword in allowed_keywords):
            x1, y1, x2, y2 = map(int, box)
            filtered_output.append({
                "box": [x1, y1, x2, y2],
                "label": label,
                "score": float(score)
            })

    detected = len(filtered_output) > 0
    return detected, filtered_output
