import requests
import os
import time
import cv2
import numpy as np
from dotenv import load_dotenv

# Load API key from .env file
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

def generate_coordinates(start, end, num_points):
    """Generate evenly spaced coordinates between start and end points."""
    latitudes = np.linspace(start[0], end[0], num_points)
    longitudes = np.linspace(start[1], end[1], num_points)
    return list(zip(latitudes, longitudes))

def download_streetview_images(start, end, num_points, api_key, 
                               output_dir, size, fov, heading, pitch):
    """Download Google Street View images for generated coordinates with configurable parameters."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    coords = generate_coordinates(start, end, num_points)
    base_url = "https://maps.googleapis.com/maps/api/streetview"
    
    for idx, (lat, lon) in enumerate(coords):
        params = {
            "size": size,  # width x height (e.g., "640x640")
            "fov": fov,    # Field of view (10~120)
            "heading": heading,  # Camera direction (0~360)
            "pitch": pitch,  # Vertical tilt (-90~90)
            "key": api_key,  # Google Street View API Key
            "location": f"{lat},{lon}"
        }

        response = requests.get(base_url, params=params)

        if response.status_code == 200:
            # image_path = os.path.join(output_dir, f"streetview_{idx}_{lat}_{lon}.jpg")
            image_path = os.path.join(output_dir, f"streetview_{idx + 1}.jpg")
            with open(image_path, "wb") as f:
                f.write(response.content)
            print(f"Saved: {image_path}")
            
            # Display the image
            img = cv2.imread(image_path)
            cv2.imshow("Street View Image", img)
            cv2.waitKey(250)  # Display image for 250 ms
            
        else:
            print(f"Failed to retrieve image for ({lat}, {lon})")
        
        time.sleep(0.25)

if __name__ == "__main__":
    api_key = API_KEY  # Get API key from environment

    # Example: Define start and end coordinates，and number of images you want
    start_coord = (37.785215, -122.417924)
    end_coord = (37.785821, -122.412989)
    num_points = 35

    # Customize these parameters
    output_dir = "streetview_images_east"  # Change output folder name
    size = "640x640"  # Image resolution (max: 640x640)
    fov = 75  # Zoom level (10~120) 120 = capture more of surrounding, 90 = moderate field of view, 30 = zoom in on a smaller area
    heading = 90  # Camera facing direction (0~360), 0 = North, 90 = East, 180 = South, 270 = West
    pitch = 0  # Vertical tilt (-90~90), 0 = looks straight ahead, 90 = straight up, -90 = straight down

    # Call the function with custom parameters
    download_streetview_images(start_coord, end_coord, num_points, api_key, 
                               output_dir, size, fov, heading, pitch)