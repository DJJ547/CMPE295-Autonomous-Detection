from ultralytics import YOLO
import torch
from PIL import Image
from typing import List
import sys
import os
from dotenv import load_dotenv

# Add the parent directory to the Python path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import Config

# Load environment variables
load_dotenv()

# Load all three models with their specific paths
GRAFFITI_MODEL_PATH = "models/graffiti.pt"
TENT_MODEL_PATH = "models/homeless.pt"  # Note: using homeless.pt for tent detection
ROAD_DAMAGE_MODEL_PATH = "models/road damage.pt"

# Initialize models
print("Loading YOLO models...")
graffiti_model = YOLO(GRAFFITI_MODEL_PATH)
tent_model = YOLO(TENT_MODEL_PATH)
road_damage_model = YOLO(ROAD_DAMAGE_MODEL_PATH)
print("Finished loading YOLO models")

def map_detection_to_label(model_name: str, confidence: float) -> str:
    """
    Map our model detections to the labels expected by the system.
    This ensures compatibility with the existing database and frontend.
    """
    if model_name == "graffiti":
        return "a graffiti vandalism"
    elif model_name == "homeless":
        return "a tent on the sidewalk"
    elif model_name == "road damage":
        # Since our model doesn't distinguish between types of road damage,
        # we'll use a generic label that will be mapped to road_damage in the database
        return "a crack on the road"  # This will be mapped to road_damage in mysql_db_utils
    else:
        print(f"Warning: Unknown model name {model_name}")
        return model_name

def detect_objects(
    image_path: str,
    text_labels: List[str],  # Kept for consistency with other models
    threshold: float = 0.5,
    allowed_keywords: List[str] = Config.ALLOWED_KEYWORDS
):
    """
    Run all three YOLO models on the image and combine their results.
    Each model detects one specific type of object.
    """
    print(f"\nProcessing image: {image_path}")
    filtered_output = []
    
    # Run inference with graffiti model
    print("\nRunning graffiti model...")
    graffiti_results = graffiti_model(image_path)[0]
    for box in graffiti_results.boxes:
        if box.conf[0] >= threshold:
            cls_id = int(box.cls[0])
            label = graffiti_results.names[cls_id]
            print(f"Graffiti model detected: {label} with confidence {box.conf[0]:.2f}")
            mapped_label = map_detection_to_label("graffiti", box.conf[0])
            filtered_output.append({
                "box": box.xyxy[0].tolist(),
                "label": mapped_label,
                "score": float(box.conf[0])
            })
    
    # Run inference with tent model
    print("\nRunning tent model...")
    tent_results = tent_model(image_path)[0]
    for box in tent_results.boxes:
        if box.conf[0] >= threshold:
            cls_id = int(box.cls[0])
            label = tent_results.names[cls_id]
            print(f"Tent model detected: {label} with confidence {box.conf[0]:.2f}")
            mapped_label = map_detection_to_label("homeless", box.conf[0])
            filtered_output.append({
                "box": box.xyxy[0].tolist(),
                "label": mapped_label,
                "score": float(box.conf[0])
            })
    
    # Run inference with road damage model
    print("\nRunning road damage model...")
    road_damage_results = road_damage_model(image_path)[0]
    for box in road_damage_results.boxes:
        if box.conf[0] >= threshold:
            cls_id = int(box.cls[0])
            label = road_damage_results.names[cls_id]
            print(f"Road damage model detected: {label} with confidence {box.conf[0]:.2f}")
            mapped_label = map_detection_to_label("road damage", box.conf[0])
            filtered_output.append({
                "box": box.xyxy[0].tolist(),
                "label": mapped_label,
                "score": float(box.conf[0])
            })
    
    detected = len(filtered_output) > 0
    print(f"\nTotal detections: {len(filtered_output)}")
    return detected, filtered_output
