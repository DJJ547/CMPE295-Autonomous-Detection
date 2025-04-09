from ultralytics import YOLO

# Load model
model = YOLO("CMPE295-Autonomous-Detection/backend/models/graffiti.pt")  # adjust path if needed

# Run inference on your test image
results = model("CMPE295-Autonomous-Detection/backend/images/sample.png")

# Show image with predictions
results[0].show()  # ← This is the fix

# Print detection info
print(f"\nDetections found: {len(results[0].boxes)}")
for box in results[0].boxes:
    cls_id = int(box.cls[0])
    label = model.names[cls_id]  # Get class name
    confidence = float(box.conf[0])
    print(f"Class: {label} (ID: {cls_id}), Confidence: {confidence:.2f}")
