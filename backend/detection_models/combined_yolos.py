import os
import torch
import numpy as np
from PIL import Image
from typing import List, Tuple, Dict
from ultralytics import YOLO

# ===== Check CUDA availability =====
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    print(f"Using GPU: {torch.cuda.get_device_name(0)}")
else:
    print("CUDA not available, using CPU.")

# ===== Configuration =====
YOLO_MODEL_PATHS = {
    "road damage": "./models/road damage.pt",
    "homeless":    "./models/homeless.pt",
    "graffiti":    "./models/graffiti.pt"
}
CONFIDENCE_THRESHOLD = 0.35

# ===== Model Registry =====
yolo_models = {}

# ===== Guarded Initialization =====
if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or __name__ == "__main__":
    print("Loading YOLO models...")
    for name, path in YOLO_MODEL_PATHS.items():
        model = YOLO(path)
        model.to(device)
        yolo_models[name] = model
    print(f"YOLO Models loaded: {', '.join(yolo_models.keys())}")

# ===== Detection Function =====
def detect_objects(
    image_path: str,
    threshold: float = CONFIDENCE_THRESHOLD
) -> Tuple[bool, List[Dict]]:

    if not yolo_models:
        raise RuntimeError("YOLO models not loaded. Check WERKZEUG_RUN_MAIN or call from __main__")

    threshold = float(threshold[0]) if isinstance(threshold, list) else float(threshold)

    image = Image.open(image_path).convert("RGB")
    img_np = np.array(image)
    filtered_output = []

    for model_name, model in yolo_models.items():
        results = model(img_np)
        result = results[0]

        if result.boxes is None or len(result.boxes) == 0:
            continue

        boxes = result.boxes.xyxy.cpu().numpy()
        scores = result.boxes.conf.cpu().numpy()
        classes = result.boxes.cls.cpu().numpy().astype(int)

        for box, score, cls in zip(boxes, scores, classes):
            score = float(score)
            if score < threshold:
                continue

            label = model.names[cls]
            x1, y1, x2, y2 = map(int, box.tolist())
            filtered_output.append({
                "box": [x1, y1, x2, y2],
                "label": label,
                "score": score
            })

    detected = len(filtered_output) > 0
    return detected, filtered_output

# ===== CLI Test =====
if __name__ == "__main__":
    test_img_path = "/path/to/test_image.jpg"
    found, detections = detect_objects(test_img_path)
    print("Any detections?", found)
    for det in detections:
        print(det)
