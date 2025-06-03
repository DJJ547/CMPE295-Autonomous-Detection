import boto3
import os
import tempfile
import cv2
import numpy as np
from dotenv import load_dotenv
from model.detector import detect_graffiti
from ultralytics import YOLO

# Load environment variables
load_dotenv()

# Initialize S3 client
s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

bucket = os.getenv("S3_BUCKET_NAME")
model_path = os.getenv("MODEL_PATH", "models/graffiti.pt")
model = YOLO(model_path)

def process_and_visualize_s3_images(output_dir="output_images"):
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # List contents of the bucket
    response = s3.list_objects_v2(Bucket=bucket)
    results = {}
    
    print("🔍 Processing images from S3 bucket...")
    
    # Create a temporary directory for downloaded images
    with tempfile.TemporaryDirectory() as temp_dir:
        for obj in response.get("Contents", []):
            file_key = obj["Key"]
            
            # Skip non-image files - adjust extensions as needed
            if not file_key.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                continue
                
            print(f"Processing: {file_key}")
            
            # Download the image to a temporary file
            temp_file_path = os.path.join(temp_dir, os.path.basename(file_key))
            s3.download_file(bucket, file_key, temp_file_path)
            
            # Run detection and visualize
            results = model(temp_file_path, conf=0.5)
            
            # Save the annotated image
            output_filename = os.path.join(output_dir, f"annotated_{os.path.basename(file_key)}")
            
            # Directly use the plot method from YOLO results
            result_image = results[0].plot()
            
            # Convert from RGB to BGR for cv2
            result_image_bgr = cv2.cvtColor(result_image, cv2.COLOR_RGB2BGR)
            
            # Save the image
            cv2.imwrite(output_filename, result_image_bgr)
            
            # Get detection results for statistics
            detection_result = detect_graffiti(temp_file_path)
            
            # Print result
            if detection_result["detected"]:
                print(f"✅ {file_key}: {len(detection_result['boxes'])} graffiti instance(s) detected")
                print(f"   Saved annotated image to {output_filename}")
            else:
                print(f"❌ {file_key}: No graffiti detected")
                print(f"   Saved blank image to {output_filename}")
    
    # Count total images processed
    image_files = [f for f in os.listdir(output_dir) if f.startswith('annotated_')]
    detected_files = [f for f in os.listdir(output_dir) if 'annotated_' in f and os.path.getsize(os.path.join(output_dir, f)) > 0]
    
    print(f"\n📊 Summary: Processed {len(image_files)} images")
    print(f"🖼️ Visualizations saved in the '{output_dir}' folder")

if __name__ == "__main__":
    process_and_visualize_s3_images()