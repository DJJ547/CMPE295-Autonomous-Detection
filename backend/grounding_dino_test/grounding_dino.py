import torch
from PIL import Image, ImageDraw, ImageFont
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection

# Load model and processor
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_id = "IDEA-Research/grounding-dino-base"

print("Loading Grounding DINO...")
processor = AutoProcessor.from_pretrained(model_id)
model = AutoModelForZeroShotObjectDetection.from_pretrained(model_id).to(device)

# Load your image
image_path = "cars.png"  # Change this to your image path
image = Image.open(image_path).convert("RGB")

# Text prompt
text_prompt = "graffiti"

# Run inference
inputs = processor(images=image, text=text_prompt, return_tensors="pt").to(device)
outputs = model(**inputs)

# Post-process outputs
target_size = torch.tensor([image.size[::-1]]).to(device)  # height, width
results = processor.post_process_grounded_object_detection(
    outputs=outputs,
    input_ids=inputs["input_ids"],
    target_sizes=target_size,
    threshold=0.2,
    text_threshold=0.2
)[0]

# Draw boxes on image
draw = ImageDraw.Draw(image)
font = ImageFont.load_default()

for box, label, score in zip(results["boxes"], results["labels"], results["scores"]):
    x1, y1, x2, y2 = box.tolist()
    draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
    text = f"{label}: {score:.2f}"
    draw.text((x1, y1), text, fill="white", font=font)

print("Detected boxes:", results["boxes"])
print("Labels:", results["labels"])
print("Scores:", results["scores"])

# Show image
image.show()

# Optional: save to file
image.save("output.jpg")