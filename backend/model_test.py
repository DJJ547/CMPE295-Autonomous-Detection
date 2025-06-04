from ultralytics import YOLO

# Load model
model = YOLO("models/graffiti.pt")  # Use relative path

# Run inference on your test image
results = model("images/original_14.jpg")  # Update this to match your image path

# Show image with predictions
results[0].show()

# Print detection info
print(f"\nDetections found: {len(results[0].boxes)}")
for box in results[0].boxes:
    cls_id = int(box.cls[0])
    label = model.names[cls_id]  # Get class name
    confidence = float(box.conf[0])
    print(f"Class: {label} (ID: {cls_id}), Confidence: {confidence:.2f}")