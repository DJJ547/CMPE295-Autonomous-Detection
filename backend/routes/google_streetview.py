import requests
from dotenv import load_dotenv
import os
import time
import cv2
import numpy as np
from flask import Blueprint, jsonify, request
import boto3

streetview_bp = Blueprint('streetview', __name__)

def generate_coordinates(startLat, startLng, endLat, endLng, num_points):
    """Generate evenly spaced coordinates between start and end points."""
    latitudes = np.linspace(startLat, endLat, num_points)
    longitudes = np.linspace(startLng, endLng, num_points)
    return list(zip(latitudes, longitudes))


def upload_file_to_s3(local_path, bucket_name, s3_key):
    """
    Upload a single file to AWS S3 and return the URL of the uploaded file.

    Parameters:
        local_path (str): Path to the local file.
        bucket_name (str): S3 bucket name.
        s3_key (str): Destination key (path) in the S3 bucket.

    Returns:
        str: URL of the uploaded file.
    """
    s3 = boto3.client("s3")
    try:
        s3.upload_file(local_path, bucket_name, s3_key)
        # Return the URL (assuming the bucket is public or you use pre-signed URLs)
        url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
        print(f"Uploaded to S3: {url}")
        return url
    except Exception as e:
        print(f"Failed to upload {local_path} to S3: {e}")
        return None
    
    
def delete_s3_folder(bucket_name, folder_prefix):
    """
    Deletes all objects under a folder prefix in the given S3 bucket.
    """
    s3 = boto3.client("s3")
    try:
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_prefix)
        if 'Contents' in response:
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
            s3.delete_objects(Bucket=bucket_name, Delete={'Objects': objects_to_delete})
            print(f"Deleted {len(objects_to_delete)} objects from {folder_prefix}")
    except Exception as e:
        print(f"Error deleting S3 folder {folder_prefix}: {e}")

# Sample coordinates to try
# start_coord = (37.785215, -122.417924)
# end_coord = (37.785821, -122.412989)
# num_points = 35
@streetview_bp.route('/api/stream', methods=['GET'])
def stream_all_images():
    startLat = float(request.args.get('startLat'))
    startLng = float(request.args.get('startLng'))
    endLat = float(request.args.get('endLat'))
    endLng = float(request.args.get('endLng'))
    num_points = int(request.args.get('num_points'))

    coords = generate_coordinates(startLat, startLng, endLat, endLng, num_points)

    api_key = os.getenv("GOOGLE_API_KEY")
    bucket_name = os.getenv("S3_BUCKET_NAME")
    s3_folder = "live_stream"
    delete_s3_folder(bucket_name, s3_folder)  # 🔥 Clear old images

    # Customize these parameters
    # output_dir = Change output folder name
    # size = Image resolution (max: 640x640)
    # fov = Zoom level (10~120), 120 = capture more of surrounding, 90 = moderate field of view, 30 = zoom in on a smaller area
    # heading = Camera facing direction (0~360), 0 = North, 90 = East, 180 = South, 270 = West
    # pitch = Vertical tilt (-90~90), 0 = looks straight ahead, 90 = straight up, -90 = straight down
    size = "640x640"
    fov = 90
    pitch = 0
    output_dir = "stream_temp"

    headings = {
        "front": 90,
        "right": 180,
        "back": 270,
        "left": 360
    }

    image_urls = {dir: [] for dir in headings}

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for idx, (lat, lon) in enumerate(coords):
        for direction, heading in headings.items():
            params = {
                "size": size,
                "fov": fov,
                "heading": heading,
                "pitch": pitch,
                "key": api_key,
                "location": f"{lat},{lon}"
            }

            response = requests.get("https://maps.googleapis.com/maps/api/streetview", params=params)

            if response.status_code == 200:
                image_name = f"{idx + 1}.jpg"
                image_path = os.path.join(output_dir, image_name)

                with open(image_path, "wb") as f:
                    f.write(response.content)

                s3_key = f"{s3_folder}/{direction}/{image_name}"
                s3_url = upload_file_to_s3(image_path, bucket_name, s3_key)

                if s3_url:
                    image_urls[direction].append(s3_url)
            else:
                print(f"Failed to fetch {direction} image at coordinate {idx + 1}")

            time.sleep(0.25)

    return jsonify(image_urls)
    