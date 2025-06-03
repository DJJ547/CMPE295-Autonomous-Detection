import requests
from dotenv import load_dotenv
import os
import time
import cv2
import numpy as np
from flask import request
import boto3

from extensions import socketio
from flask_socketio import emit
from detection_models import grounding_dino, owlvit
from utils import mysql_db_utils
from datetime import datetime
from config import Config

text_labels = Config.LABELS


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


@socketio.on('start_stream')
def stream_all_images(data):
    print("Socket successfully established with client")
    user_id = int(data.get('userId'))
    startLat = float(data.get('startLatInput'))
    startLng = float(data.get('startLngInput'))
    endLat = float(data.get('endLatInput'))
    endLng = float(data.get('endLngInput'))
    num_points = int(data.get('num_points'))
    model = str(data.get('model'))

    coords = generate_coordinates(
        startLat, startLng, endLat, endLng, num_points)

    api_key = os.getenv("GOOGLE_API_KEY")
    bucket_name = os.getenv("S3_BUCKET_NAME")
    s3_stream_root_folder_name = f'user{user_id}-livestream'
    detected_temp_dir = "detected_temp"
    stream_temp_dir = "stream_temp"
    s3_detected_root_folder_name = 'detected-images'
    delete_s3_folder(bucket_name, s3_stream_root_folder_name)

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

    headings = {
        "front": 90,
        "right": 180,
        "back": 270,
        "left": 360
    }

    if not os.path.exists(stream_temp_dir):
        os.makedirs(stream_temp_dir)
    if not os.path.exists(detected_temp_dir):
        os.makedirs(detected_temp_dir)

    for idx, (lat, lon) in enumerate(coords):
        for direction, heading in headings.items():
            params = {
                    "latlng": f"{lat},{lon}", 
                    "key": api_key
                }
            response = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params=params) #retrieve address based on coordinate
            address = {
                'formatted_address': "",
                'street': "",
                'city': "",
                'state': "",
                'zipcode': "",
            }
            if response.status_code == 200:
                data = response.json()
                if data['status'] == "OK" and len(data.get('results', [])) > 0:
                    try:
                        # Extract the first result
                        result = data['results'][0]

                        # Get the formatted address
                        address["formatted_address"] = result.get('formatted_address', 'Unknown')

                        # Initialize variables for components
                        street_number = street_name = ""

                        # Iterate over address components to find desired fields
                        for component in result.get('address_components', []):
                            types = component.get('types', [])
                            if "street_number" in types:
                                street_number = component.get('long_name', '')
                            if "route" in types:
                                street_name = component.get('long_name', '')
                                address["street"] = f"{street_number} {street_name}".strip()
                            if "locality" in types:
                                address["city"] = component.get('long_name', 'Unknown')
                            if "administrative_area_level_1" in types:
                                address["state"] = component.get('short_name', 'Unknown')
                            if "postal_code" in types:
                                address["zipcode"] = component.get('long_name', 'Unknown')

                        #print("Extracted Address Information:", address)

                    except (IndexError, KeyError) as e:
                        print("Error parsing response:", str(e))
                else:
                    print("Failed to retrieve address for coordinate: ", lat, lon)
            else:
                print("Failed to retrieve address for coordinate: ", lat, lon)
            
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

                # Run selected detection model
                try:
                    if model == 'dino':
                        detected, output = grounding_dino.detect_objects(
                            stream_temp_local_path, text_labels)
                    elif model == 'owlvit':
                        detected, output = owlvit.detect_objects(
                            stream_temp_local_path, text_labels)

                    handle_detection_result(
                        detected, output, image_name, response.content,
                        detected_temp_dir, bucket_name, s3_detected_root_folder_name,
                        lat, lon, address, direction
                    )

                except Exception as e:
                    print(f"Detection failed on {image_name}: {e}")
                    detected, output = False, []


                # Store images returned by Google Street View API into S3 folder named "user{user_id}-livestream"
                s3_stream_image_path = f"{s3_stream_root_folder_name}/{direction}/{image_name}"
                s3_stream_image_url = upload_file_to_s3(
                    stream_temp_local_path, bucket_name, s3_stream_image_path)
                    
                # Emit result immediately
                emit("start_stream", {
                    "direction": direction,
                    "url": s3_stream_image_url,
                    "lat": lat,
                    "lon": lon,
                    "detected": detected,
                    "boxes": [detection["box"] for detection in output] if detected else [],
                    "labels": [detection["label"] for detection in output] if detected else [],
                    "scores": [detection["score"] for detection in output] if detected else []
                })
            else:
                print(f"Failed to fetch {direction} image at coordinate ({lat}, {lon})")

def handle_detection_result(
    detected, output, image_name, response_content, detected_temp_dir,
    bucket_name, s3_detected_root_folder_name, lat, lon, address, direction
):
    if detected:
        detected_temp_local_path = os.path.join(detected_temp_dir, image_name)
        with open(detected_temp_local_path, "wb") as f:
            f.write(response_content)
        s3_detected_image_url = upload_file_to_s3(
            detected_temp_local_path, bucket_name, s3_detected_root_folder_name
        )
        if s3_detected_image_url:
            mysql_db_utils.register_anomaly_to_db(
                lat, lon, address, direction, s3_detected_image_url, output
            )
            