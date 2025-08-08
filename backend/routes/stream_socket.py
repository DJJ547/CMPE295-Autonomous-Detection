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
from detection_models import grounding_dino, owlvit, combined_yolos
from utils import mysql_db_utils
from datetime import datetime
from config import Config

# Load environment variables
load_dotenv()

text_labels = Config.LABELS


def generate_coordinates(startLat, startLng, endLat, endLng, num_points):
    """Generate evenly spaced coordinates between start and end points, rounded to 6 decimal places."""
    latitudes = np.linspace(startLat, endLat, num_points)
    longitudes = np.linspace(startLng, endLng, num_points)
    return [(round(lat, 6), round(lng, 6)) for lat, lng in zip(latitudes, longitudes)]


def upload_file_to_s3(local_path, bucket_name, s3_root_folder_name):
    """
    Upload a single file to AWS S3 and return the URL of the uploaded file.
    """
    s3 = boto3.client("s3")
    filename = os.path.basename(local_path)

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
    """Deletes all objects under a folder prefix in the given S3 bucket to avoid overhead."""
    s3 = boto3.client("s3")
    try:
        response = s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_prefix)
        if 'Contents' in response:
            objects_to_delete = [{'Key': obj['Key']} for obj in response['Contents']]
            s3.delete_objects(Bucket=bucket_name, Delete={'Objects': objects_to_delete})
            print(f"Deleted {len(objects_to_delete)} objects from {folder_prefix}")
    except Exception as e:
        print(f"Error deleting S3 folder {folder_prefix}: {e}")


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

    coords = generate_coordinates(startLat, startLng, endLat, endLng, num_points)

    api_key = os.getenv("GOOGLE_API_KEY")
    print(f"API Key loaded: {'Yes' if api_key else 'No'}")
    bucket_name = os.getenv("S3_BUCKET_NAME")
    s3_stream_root_folder_name = f'user{user_id}-livestream'
    detected_temp_dir = "detected_temp"
    stream_temp_dir = "stream_temp"
    s3_detected_root_folder_name = 'detected-images'
    delete_s3_folder(bucket_name, s3_stream_root_folder_name)

    size = "640x640"
    fov = 90
    pitch = 0
    headings = {"front": 90, "right": 180, "back": 270, "left": 360}

    os.makedirs(stream_temp_dir, exist_ok=True)
    os.makedirs(detected_temp_dir, exist_ok=True)

    for idx, (lat, lon) in enumerate(coords):
        for direction, heading in headings.items():
            # --- Geocode request with detailed logging ---
            geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {"latlng": f"{lat},{lon}", "key": api_key}
            try:
                response = requests.get(geocode_url, params=params, timeout=10)
            except Exception as e:
                print(f"[GEOCODE ERROR] Exception for ({lat}, {lon}): {e}")
                response = None

            address = {'formatted_address': "", 'street': "", 'city': "", 'state': "", 'zipcode': ""}
            if response and response.status_code == 200:
                data_json = response.json()
                if data_json.get('status') == "OK" and data_json.get('results'):
                    try:
                        result = data_json['results'][0]
                        address["formatted_address"] = result.get('formatted_address', 'Unknown')
                        street_number = street_name = ""
                        for comp in result.get('address_components', []):
                            types = comp.get('types', [])
                            if "street_number" in types:
                                street_number = comp.get('long_name', '')
                            if "route" in types:
                                street_name = comp.get('long_name', '')
                                address["street"] = f"{street_number} {street_name}".strip()
                            if "locality" in types:
                                address["city"] = comp.get('long_name', 'Unknown')
                            if "administrative_area_level_1" in types:
                                address["state"] = comp.get('short_name', 'Unknown')
                            if "postal_code" in types:
                                address["zipcode"] = comp.get('long_name', 'Unknown')
                    except (IndexError, KeyError) as e:
                        print("Error parsing response:", str(e))
                else:
                    print(
                        f"[GEOCODE FAIL] coord=({lat},{lon}) HTTP={response.status_code} "
                        f"status={data_json.get('status')} results={len(data_json.get('results', []))} "
                        f"URL={response.url}"
                    )
            else:
                code = response.status_code if response else "no-response"
                body = response.text if response else "—"
                print(
                    f"[GEOCODE HTTP ERROR] coord=({lat},{lon}) HTTP={code} body={body}"
                )

            # --- Street View request with detailed logging ---
            streetview_url = "https://maps.googleapis.com/maps/api/streetview"
            params = {"size": size, "fov": fov, "heading": heading, "pitch": pitch, "key": api_key, "location": f"{lat},{lon}"}
            try:
                response = requests.get(streetview_url, params=params, timeout=10)
            except Exception as e:
                print(f"[STREETVIEW ERROR] Exception for ({lat}, {lon}, {direction}): {e}")
                response = None

            if response and response.status_code == 200:
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                image_name = f"{timestamp}_{idx + 1}.jpg"
                stream_temp_local_path = os.path.join(stream_temp_dir, image_name)

                # Step 1: Save the image from response
                with open(stream_temp_local_path, "wb") as f:
                    f.write(response.content)

                # Step 2: Mask the bottom-left area to remove Google watermark
                img = cv2.imread(stream_temp_local_path)
                if img is not None:
                    h, w, _ = img.shape

                    # Define the mask size (adjust if needed)
                    mask_width = 640   # width of the masked area
                    mask_height = 20   # height of the masked area

                    # Coordinates: bottom-left corner
                    x1 = 0
                    y1 = h - mask_height
                    x2 = x1 + mask_width
                    y2 = h

                    # Fill with black (0, 0, 0) or use white (255, 255, 255)
                    cv2.rectangle(img, (x1, y1), (x2, y2), color=(0, 0, 0), thickness=-1)

                    # Save masked image back
                    cv2.imwrite(stream_temp_local_path, img)
                else:
                    print(f"❌ Failed to load image for masking: {stream_temp_local_path}")


                # Run selected detection model
                try:
                    if model == 'dino':
                        detected, output = grounding_dino.detect_objects(stream_temp_local_path, text_labels)
                    elif model == 'owlvit':
                        detected, output = owlvit.detect_objects(stream_temp_local_path, text_labels)
                    elif model == 'yolo':
                        detected, output = combined_yolos.detect_objects(stream_temp_local_path)
                    else:
                        raise ValueError(f"Unknown model: {model}")

                    handle_detection_result(
                        detected, output, image_name, response.content,
                        detected_temp_dir, bucket_name, s3_detected_root_folder_name,
                        lat, lon, address, direction
                    )
                except Exception as e:
                    print(f"Detection failed on {image_name}: {e}")
                    detected, output = False, []

                # Upload stream image and emit
                s3_stream_image_path = f"{s3_stream_root_folder_name}/{direction}/{image_name}"
                s3_stream_image_url = upload_file_to_s3(stream_temp_local_path, bucket_name, s3_stream_image_path)
                emit("start_stream", {
                    "direction": direction,
                    "url": s3_stream_image_url,
                    "lat": lat,
                    "lon": lon,
                    "detected": detected,
                    "boxes": [d["box"] for d in output] if detected else [],
                    "labels": [d["label"] for d in output] if detected else [],
                    "scores": [d["score"] for d in output] if detected else []
                })
            else:
                code = response.status_code if response else "no-response"
                body_snip = (response.text[:200] + "...") if response and response.text else "—"
                print(
                    f"[STREETVIEW FAIL] direction={direction} coord=({lat},{lon}) "
                    f"HTTP={code} body={body_snip} URL={response.url if response else streetview_url}"
                )


    # Test API key
    test_params = {
        "latlng": "37.7749,-122.4194",  # San Francisco coordinates
        "key": api_key
    }
    test_response = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params=test_params)
    print(f"Test API response status: {test_response.status_code}")
    print(f"Test API response: {test_response.json()}")

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
            # 🧠 Extract the first caption from detection output, if available
            caption = output[0].get("caption") if output else None

            # ✅ Add caption as new argument in DB insert function
            mysql_db_utils.register_anomaly_to_db(
                lat, lon, address, direction, s3_detected_image_url, output, caption
            )
