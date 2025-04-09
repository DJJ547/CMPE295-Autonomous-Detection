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

def download_and_compare_images(output_dir="comparison_images"):
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # List contents of the bucket
    response = s3.list_objects_v2(Bucket=bucket)
    
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
            
            # Save original image
            original_output = os.path.join(output_dir, f"original_{os.path.basename(file_key)}")
            original_img = cv2.imread(temp_file_path)
            cv2.imwrite(original_output, original_img)
            
            # Run detection on the same image
            results = model(temp_file_path, conf=0.5)
            
            # Save the annotated image
            annotated_output = os.path.join(output_dir, f"annotated_{os.path.basename(file_key)}")
            
            # Directly use the plot method from YOLO results
            result_image = results[0].plot()
            
            # Convert from RGB to BGR for cv2
            result_image_bgr = cv2.cvtColor(result_image, cv2.COLOR_RGB2BGR)
            
            # Save the image
            cv2.imwrite(annotated_output, result_image_bgr)
            
            # Create a side-by-side comparison
            original_img = cv2.imread(original_output)
            annotated_img = cv2.imread(annotated_output)
            
            # Resize if needed to ensure same height
            h1, w1 = original_img.shape[:2]
            h2, w2 = annotated_img.shape[:2]
            
            # Use the same height for both images
            target_height = max(h1, h2)
            ratio1 = target_height / h1
            ratio2 = target_height / h2
            
            new_w1 = int(w1 * ratio1)
            new_w2 = int(w2 * ratio2)
            
            original_img = cv2.resize(original_img, (new_w1, target_height))
            annotated_img = cv2.resize(annotated_img, (new_w2, target_height))
            
            # Create a side-by-side comparison
            comparison = np.hstack((original_img, annotated_img))
            
            # Add labels
            font = cv2.FONT_HERSHEY_SIMPLEX
            cv2.putText(comparison, 'Original', (10, 30), font, 1, (0, 0, 255), 2)
            cv2.putText(comparison, 'Annotated', (new_w1 + 10, 30), font, 1, (0, 0, 255), 2)
            
            # Save the comparison
            comparison_output = os.path.join(output_dir, f"comparison_{os.path.basename(file_key)}")
            cv2.imwrite(comparison_output, comparison)
            
            # Get detection results for statistics
            detection_result = detect_graffiti(temp_file_path)
            
            # Print result
            if detection_result["detected"]:
                print(f"✅ {file_key}: {len(detection_result['boxes'])} graffiti instance(s) detected")
                print(f"   Saved comparison to {comparison_output}")
            else:
                print(f"❌ {file_key}: No graffiti detected")
                print(f"   Saved comparison to {comparison_output}")
    
    print(f"\n🖼️ Original, annotated, and side-by-side comparisons saved in '{output_dir}' folder")

if __name__ == "__main__":
    download_and_compare_images()