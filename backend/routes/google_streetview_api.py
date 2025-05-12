import requests
from dotenv import load_dotenv
import os
import time
import cv2
import numpy as np
from flask import Blueprint, jsonify, request
import boto3

from detection_models import grounding_dino
from utils import mysql_db_utils
from datetime import datetime

streetview_bp = Blueprint('streetview', __name__)
text_labels = [["a graffiti", "a crack", "a tent"]]


def generate_coordinates(startLat, startLng, endLat, endLng, num_points):
    """Generate evenly spaced coordinates between start and end points, rounded to 6 decimal places."""
    latitudes = np.linspace(startLat, endLat, num_points)
    longitudes = np.linspace(startLng, endLng, num_points)
    return [(round(lat, 6), round(lng, 6)) for lat, lng in zip(latitudes, longitudes)]


def upload_file_to_s3(local_path, bucket_name, s3_root_folder_name):
    """
    Upload a single file to AWS S3 and return the URL of the uploaded file.

    Parameters:
        local_path (str): Path to the local file.
        bucket_name (str): S3 bucket name.
        s3_key_prefix (str): Destination folder/key prefix in the S3 bucket.

    Returns:
        str: URL of the uploaded file.
    """
    s3 = boto3.client("s3")
    filename = os.path.basename(local_path)

    # Ensure the prefix ends with '/' and append the filename
    if s3_root_folder_name and not s3_root_folder_name.endswith("/"):
        s3_root_folder_name += "/"

    s3_path = f"{s3_root_folder_name}{filename}"

    try:
        s3.upload_file(local_path, bucket_name, s3_path)
        url = f"https://{bucket_name}.s3.amazonaws.com/{s3_path}"
        print(f"Uploaded to S3: {url}")
        return url
    except Exception as e:
        print(f"Failed to upload {local_path} to S3: {e}")
        return None


def delete_s3_folder(bucket_name, folder_prefix):
    """
    Deletes all objects under a folder prefix in the given S3 bucket to avoid overhead.
    """
    s3 = boto3.client("s3")
    try:
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_prefix)
        if 'Contents' in response:
            objects_to_delete = [{'Key': obj['Key']}
                                 for obj in response['Contents']]
            s3.delete_objects(Bucket=bucket_name, Delete={
                              'Objects': objects_to_delete})
            print(
                f"Deleted {len(objects_to_delete)} objects from {folder_prefix}")
    except Exception as e:
        print(f"Error deleting S3 folder {folder_prefix}: {e}")

# Sample coordinates to try
# start_coord = (37.785215, -122.417924)
# end_coord = (37.785821, -122.412989)
# num_points = 35


@streetview_bp.route('/api/stream', methods=['GET'])
def stream_all_images():
    user_id = int(request.args.get('userId'))
    startLat = float(request.args.get('startLatInput'))
    startLng = float(request.args.get('startLngInput'))
    endLat = float(request.args.get('endLatInput'))
    endLng = float(request.args.get('endLngInput'))
    num_points = int(request.args.get('num_points'))

    coords = generate_coordinates(
        startLat, startLng, endLat, endLng, num_points)

    api_key = os.getenv("GOOGLE_API_KEY")
    bucket_name = os.getenv("S3_BUCKET_NAME")
    s3_stream_root_folder_name = f'user{user_id}-livestream'
    s3_detected_root_folder_name = 'detected-images'
    delete_s3_folder(bucket_name, s3_stream_root_folder_name)

    # stream_temp_dir : Name of the output folder where stream images will be saved

    # size       : Image resolution (max: 640x640)

    # fov        : Field of view (zoom level)
    #              - Range: 10 to 120
    #              - 120 = wide view (more surroundings)
    #              - 90  = standard view
    #              - 30  = zoomed-in view

    # heading    : Camera direction (in degrees)
    #              - 0   = North
    #              - 90  = East
    #              - 180 = South
    #              - 270 = West

    # pitch      : Camera vertical tilt
    #              - Range: -90 to 90
    #              -  0   = level (straight ahead)
    #              - 90  = pointing straight up
    #              - -90 = pointing straight down

    size = "640x640"
    fov = 90
    pitch = 0
    stream_temp_dir = "stream_temp"

    headings = {
        "front": 90,
        "right": 180,
        "back": 270,
        "left": 360
    }

    image_data = {dir: [] for dir in headings}

    if not os.path.exists(stream_temp_dir):
        os.makedirs(stream_temp_dir)

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

            response = requests.get(
                "https://maps.googleapis.com/maps/api/streetview", params=params)

            if response.status_code == 200:
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                image_name = f"{timestamp}_{idx + 1}.jpg"
                stream_temp_local_path = os.path.join(
                    stream_temp_dir, image_name)

                with open(stream_temp_local_path, "wb") as f:
                    f.write(response.content)

                # Run Grounding DINO detection
                try:
                    detected, output = grounding_dino.detect_objects(
                        stream_temp_local_path, text_labels)
                    # If anomalies detected, store the current image into S3 folder named "detected_image"
                    if detected:
                        detected_temp_dir = "detected_temp"
                        if not os.path.exists(detected_temp_dir):
                            os.makedirs(detected_temp_dir)
                        detected_temp_local_path = os.path.join(
                            detected_temp_dir, image_name)
                        with open(detected_temp_local_path, "wb") as f:
                            f.write(response.content)
                        s3_detected_image_url = upload_file_to_s3(
                            detected_temp_local_path, bucket_name, s3_detected_root_folder_name)
                        if s3_detected_image_url:
                            mysql_db_utils.register_anomaly_to_db(
                                lat, lon, direction, s3_detected_image_url, output)

                except Exception as e:
                    print(
                        f"Detection failed on {detected_temp_local_path}: {e}")
                    detected, output = False, []

                # Store images returned by Google Street View API into S3 folder named "user{user_id}-livestream"
                s3_stream_image_path = f"{s3_stream_root_folder_name}/{direction}/{image_name}"
                s3_stream_image_url = upload_file_to_s3(
                    stream_temp_local_path, bucket_name, s3_stream_image_path)

                if s3_stream_image_url:
                    image_data[direction].append({
                        "url": s3_stream_image_url,
                        "lat": lat,
                        "lon": lon,
                        "detected": detected,
                        "boxes": [detection["box"] for detection in output] if detected else [],
                        "labels": [detection["label"] for detection in output] if detected else [],
                        "scores": [detection["score"] for detection in output] if detected else []
                    })
            else:
                print(
                    f"Failed to fetch {direction} image at coordinate {idx + 1}")

            time.sleep(0.25)

    return jsonify(image_data)
