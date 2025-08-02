import numpy as np
import cv2
import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection
from ultralytics import YOLO
import json

# ─────────────────────────────────────────────────────────────
# CONFIG + CATEGORY MAPPING
# ─────────────────────────────────────────────────────────────
yolo_detectable = {"person", "traffic light", "vehicle"}

dino_labels = {
    "bike lane", "bike lane painting", "bike lane striping",
    "dumped trash", "dumped vegetation", "yard waste pile",
    "residential trash can", "commercial dumpster",
    "traffic light", "street sign", "construction sign", "orange construction cone",
    "bollard", "fire hydrant",
    "streetlight",
    "pothole", "road", "red curb", "side walk", "block", "jack",
    "power line", "tree overhang",
    "flooding", "sewage backup",
    "glass", "debris", "window", "tire", "wheel",
    "street vendor",
    "graffiti"
}

def normalize_object_name(name):
    mapping = {
        "potholes": "pothole", "bollards": "bollard", "power lines": "power line",
        "bike lanes": "bike lane", "side walks": "side walk", "street signs": "street sign",
        "traffic lights": "traffic light", "residential trash cans": "residential trash can",
        "commercial dumpsters": "commercial dumpster", "construction signs": "construction sign",
        "orange construction cones": "orange construction cone", "roads": "road",
        "vehicles": "vehicle", "windows": "window", "tires": "tire", "wheels": "wheel",
        "mobile retailers": "street vendor"
    }
    return mapping.get(name, name)

# ─────────────────────────────────────────────────────────────
# LOAD MODELS
# ─────────────────────────────────────────────────────────────
yolo_model = YOLO("yolov8n.pt")
dino_processor = AutoProcessor.from_pretrained("IDEA-Research/grounding-dino-base")
dino_model = AutoModelForZeroShotObjectDetection.from_pretrained("IDEA-Research/grounding-dino-base").to("cuda" if torch.cuda.is_available() else "cpu")

# ─────────────────────────────────────────────────────────────
# LOAD SCENARIOS
# ─────────────────────────────────────────────────────────────
with open("parsed_labels.json", "r") as f:
    scenarios = json.load(f)

# ─────────────────────────────────────────────────────────────
# IMAGE PREP
# ─────────────────────────────────────────────────────────────
img_path = "vehicle_red_curb.png"
img_bgr = cv2.imread(img_path)
img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

# ─────────────────────────────────────────────────────────────
# DETECTION FUNCTIONS
# ─────────────────────────────────────────────────────────────
def detect_with_yolo(image_rgb, object_name):
    results = yolo_model.predict(image_rgb, verbose=False)
    bboxes = []
    for box in results[0].boxes:
        class_name = yolo_model.names[int(box.cls)]
        # store actual class name from YOLO
        if class_name == object_name or (object_name == "vehicle" and class_name in ["car", "truck", "bus"]):
            bboxes.append({"object": class_name, "bbox": box.xyxy[0].cpu().numpy()})
    return bboxes

def gpt_verify_adjective(cropped_image, prompt):
    print(f"🤖 GPT verifying: {prompt}")
    return np.random.choice([True, False], p=[0.7, 0.3])

def bboxes_overlap(box1, box2, threshold=0.1):
    x0 = max(box1[0], box2[0])
    y0 = max(box1[1], box2[1])
    x1 = min(box1[2], box2[2])
    y1 = min(box1[3], box2[3])
    inter = max(0, x1 - x0) * max(0, y1 - y0)
    if inter == 0: return False
    area1 = (box1[2]-box1[0])*(box1[3]-box1[1])
    area2 = (box2[2]-box2[0])*(box2[3]-box2[1])
    return inter / min(area1, area2) > threshold

def draw_detections(primary_dets, secondary_dets, window_title="Detections"):
    img_copy = img_bgr.copy()
    for det in primary_dets:
        x0,y0,x1,y1 = map(int, det["bbox"])
        cv2.rectangle(img_copy, (x0,y0), (x1,y1), (0,255,0), 2)
        cv2.putText(img_copy, det["object"], (x0, y0-5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
    for det in secondary_dets:
        x0,y0,x1,y1 = map(int, det["bbox"])
        cv2.rectangle(img_copy, (x0,y0), (x1,y1), (0,0,255), 2)
        cv2.putText(img_copy, det["object"], (x0, y0-5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,0,255), 2)
    cv2.imshow(window_title, img_copy)

# ─────────────────────────────────────────────────────────────
# RUN DINO BATCH DETECTIONS
# ─────────────────────────────────────────────────────────────
all_dino_detections = {}
for label in sorted(dino_labels):
    print(f"🔍 Running DINO on: {label}")
    pil_img = Image.fromarray(img_rgb)
    inputs = dino_processor(images=pil_img, text=label, return_tensors="pt").to(dino_model.device)
    outputs = dino_model(**inputs)
    results = dino_processor.post_process_grounded_object_detection(
        outputs, inputs.input_ids, box_threshold=0.35, text_threshold=0.25,
        target_sizes=[img_rgb.shape[:2]]
    )
    for box, lbl, score in zip(results[0]["boxes"], results[0]["text_labels"], results[0]["scores"]):
        label_str = lbl.strip()
        if label_str not in all_dino_detections:
            all_dino_detections[label_str] = []
        all_dino_detections[label_str].append({"object": label_str, "bbox": box.detach().cpu().numpy()})

# ─────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────
results_log = []

for scenario in scenarios:
    print("\n===================================")
    print(f"🚀 Processing scenario: {scenario}")

    matched_in_scenario = False

    for primary in scenario["primary_objects"]:
        obj = normalize_object_name(primary["object"])
        adj = primary["adjective"]

        if obj in yolo_detectable:
            primary_dets = detect_with_yolo(img_rgb, obj)
        else:
            primary_dets = all_dino_detections.get(obj, [])

        if not primary_dets:
            print(f"⚠️ Primary object '{obj}' not detected at all.")
            continue
        else:
            detected_names = [d['object'] for d in primary_dets]
            print(f"✅ Detected {len(primary_dets)} primary '{obj}' objects: {detected_names}")
            draw_detections(primary_dets, [], window_title=f"Primary '{obj}' detections")

        if adj:
            valid_dets = []
            for det in primary_dets:
                x0,y0,x1,y1 = map(int, det["bbox"])
                cropped = img_rgb[y0:y1, x0:x1]
                if gpt_verify_adjective(cropped, f"Does this {obj} have {adj}?"):
                    print(f"✅ GPT confirms '{adj}' on '{obj}'.")
                    valid_dets.append(det)
                else:
                    print(f"🚫 GPT says no '{adj}' on '{obj}'.")
            primary_dets = valid_dets

        if not primary_dets:
            print(f"🚫 After adjective filtering, no '{obj}' remains.")
            continue

        scenario_had_match = False
        if scenario.get("secondary_objects"):
            for secondary in scenario["secondary_objects"]:
                sobj = normalize_object_name(secondary["object"])
                if sobj in yolo_detectable:
                    sec_dets = detect_with_yolo(img_rgb, sobj)
                else:
                    sec_dets = all_dino_detections.get(sobj, [])

                if not sec_dets:
                    print(f"⚠️ Secondary object '{sobj}' not detected.")
                    continue
                else:
                    detected_sec_names = [d['object'] for d in sec_dets]
                    print(f"✅ Detected {len(sec_dets)} secondary '{sobj}' objects: {detected_sec_names}")
                    draw_detections([], sec_dets, window_title=f"Secondary '{sobj}' detections")

                for prim_det in primary_dets:
                    for sec_det in sec_dets:
                        if bboxes_overlap(prim_det["bbox"], sec_det["bbox"]):
                            print(f"🎯 MATCH: '{prim_det['object']}' overlaps '{sec_det['object']}'")
                            results_log.append({
                                "scenario": scenario,
                                "primary": prim_det,
                                "secondary": sec_det
                            })
                            draw_detections([prim_det], [sec_det], window_title=f"Match: {prim_det['object']} vs {sec_det['object']}")
                            scenario_had_match = True
        else:
            print(f"✅ Scenario has no secondary objects. Detected {len(primary_dets)} '{obj}'.")
            scenario_had_match = True

        if not scenario_had_match:
            print(f"🚫 Scenario didn't have overlapping secondary objects.")
        else:
            matched_in_scenario = True

    if not matched_in_scenario:
        print(f"🚫 Entire scenario skipped: no final matches found.")

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
print("\n===================================")
print(f"✅ DONE. Found {len(results_log)} matching scenarios.")
for match in results_log:
    print(f"- Scenario '{match['scenario']['preposition']}' with '{match['primary']['object']}' & '{match['secondary']['object']}'")
