import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection

# Load model and processor once globally to avoid reloading every time
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_id = "IDEA-Research/grounding-dino-base"
print("Loading Grounding DINO...")
processor = AutoProcessor.from_pretrained(model_id)
model = AutoModelForZeroShotObjectDetection.from_pretrained(model_id).to(device)

def detect_objects(image_path: str, text_prompt: str, threshold: float = 0.2, text_threshold: float = 0.2):
    # Load image
    image = Image.open(image_path).convert("RGB")

    # Prepare inputs
    inputs = processor(images=image, text=text_prompt, return_tensors="pt").to(device)
    outputs = model(**inputs)

    # Get image dimensions for post-processing
    target_size = torch.tensor([image.size[::-1]]).to(device)  # height, width

    # Post-process detection results
    results = processor.post_process_grounded_object_detection(
        outputs=outputs,
        input_ids=inputs["input_ids"],
        target_sizes=target_size,
        threshold=threshold,
        text_threshold=text_threshold
    )[0]

    # Extract results
    boxes = results["boxes"].tolist() if "boxes" in results else []
    labels = results["labels"] if "labels" in results else []
    scores = results["scores"].tolist() if "scores" in results else []

    detected = len(boxes) > 0
    bounding_boxes = [(int(x1), int(y1), int(x2), int(y2)) for (x1, y1, x2, y2) in boxes]

    return detected, bounding_boxes