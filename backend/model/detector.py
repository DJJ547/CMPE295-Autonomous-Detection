from ultralytics import YOLO
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Load model
model_path = os.getenv("MODEL_PATH", "models/graffiti.pt")  # fallback if env missing
model = YOLO(model_path)

def detect_graffiti(image_path, confidence_threshold=0.5):
    results = model(image_path)[0]
    detections = []

    for box in results.boxes:
        if box.conf[0] >= confidence_threshold:
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            if label == "graffiti":
                bbox = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                detections.append(bbox)

    return {
        "detected": len(detections) > 0,
        "boxes": detections
    }
