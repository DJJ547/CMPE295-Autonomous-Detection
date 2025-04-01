import os
import json
import xml.etree.ElementTree as ET
from tqdm import tqdm

# Path to your Pascal VOC XML annotations and image directory
ANNOTATIONS_DIR = "C:/Users/jdai1/OneDrive/Desktop/annotations"
IMAGES_DIR = "C:/Users/jdai1/OneDrive/Desktop/images"
OUTPUT_JSON = "coco_annotations.json"

# COCO dataset structure
coco_data = {
    "images": [],
    "annotations": [],
    "categories": []
}

category_mapping = {}
annotation_id = 1

def convert_voc_to_coco():
    global annotation_id
    for xml_file in tqdm(os.listdir(ANNOTATIONS_DIR)):
        if not xml_file.endswith(".xml"):
            continue
        
        tree = ET.parse(os.path.join(ANNOTATIONS_DIR, xml_file))
        root = tree.getroot()

        # Extract image details
        filename = root.find("filename").text
        image_id = len(coco_data["images"]) + 1
        size = root.find("size")
        width = int(size.find("width").text)
        height = int(size.find("height").text)

        coco_data["images"].append({
            "id": image_id,
            "file_name": filename,
            "width": width,
            "height": height
        })

        # Process objects
        for obj in root.findall("object"):
            category_name = obj.find("name").text
            if category_name not in category_mapping:
                category_mapping[category_name] = len(category_mapping) + 1
                coco_data["categories"].append({
                    "id": category_mapping[category_name],
                    "name": category_name
                })

            bndbox = obj.find("bndbox")
            xmin = int(bndbox.find("xmin").text)
            ymin = int(bndbox.find("ymin").text)
            xmax = int(bndbox.find("xmax").text)
            ymax = int(bndbox.find("ymax").text)

            width = xmax - xmin
            height = ymax - ymin

            coco_data["annotations"].append({
                "id": annotation_id,
                "image_id": image_id,
                "category_id": category_mapping[category_name],
                "bbox": [xmin, ymin, width, height],
                "area": width * height,
                "iscrowd": 0
            })
            annotation_id += 1

    # Save to JSON file
    with open(OUTPUT_JSON, "w") as json_file:
        json.dump(coco_data, json_file, indent=4)

if __name__ == "__main__":
    convert_voc_to_coco()
    print(f"COCO annotations saved to {OUTPUT_JSON}")
