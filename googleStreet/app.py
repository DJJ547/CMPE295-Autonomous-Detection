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

def download_streetview_images(start, end, num_points, api_key, output_dir="streetview_images3"):
    """Download Google Street View images for generated coordinates."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    coords = generate_coordinates(start, end, num_points)
    base_url = "https://maps.googleapis.com/maps/api/streetview"
    
    params = {
        "size": "640x640",
        "fov": 65, #lower number = more zoom in 
        "heading": 0,
        "pitch": 0,
        "key": api_key
    }

    for idx, (lat, lon) in enumerate(coords):
        params["location"] = f"{lat},{lon}"
        response = requests.get(base_url, params=params)

        if response.status_code == 200:
            image_path = os.path.join(output_dir, f"streetview_{idx}_{lat}_{lon}.jpg")
            with open(image_path, "wb") as f:
                f.write(response.content)
            print(f"Saved: {image_path}")
            
            # Display the image
            img = cv2.imread(image_path)
            cv2.imshow("Street View Image", img)
            cv2.waitKey(250)  
            
        else:
            print(f"Failed to retrieve image for ({lat}, {lon})")
        
        time.sleep(0.25)

if __name__ == "__main__":
    api_key = API_KEY  

    # Example: Define start and end coordinates
    start_coord = (37.752510, -122.414160)  
    end_coord = (37.762146, -122.415040)    
    num_points = 20 

    download_streetview_images(start_coord, end_coord, num_points, api_key)