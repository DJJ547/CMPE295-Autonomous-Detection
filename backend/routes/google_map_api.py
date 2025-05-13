from flask import Blueprint, jsonify, request
from extensions import db
from mysql_models import DetectionEvent, DetectionImage, DetectionMetadata
from sqlalchemy.orm import joinedload

googlemap_bp = Blueprint('googlemap', __name__)

@googlemap_bp.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    
    events = DetectionEvent.query.options(
        joinedload(DetectionEvent.images).joinedload(DetectionImage.metadatas)
    ).all()
    markers = []
    for event in events:
        # Construct a list of images and their metadata for the current event
        images = []
        for image in event.images:
            metadatas = [
                {
                    "id": metadata.id,
                    "X1_loc": metadata.X1_loc,
                    "Y1_loc": metadata.Y1_loc,
                    "X2_loc": metadata.X2_loc,
                    "Y2_loc": metadata.Y2_loc,
                    "label": metadata.label,
                    "score": metadata.score,
                    "type": metadata.type.value
                } for metadata in image.metadatas
            ]
            images.append({
                "id": image.id,
                "direction": image.direction.value,
                "image_url": image.image_url,
                "metadatas": metadatas
            })

        # Add the event data along with images and metadata
        markers.append({
            "id": event.id,
            "latitude": str(event.latitude),
            "longitude": str(event.longitude),
            "timestamp": event.timestamp.isoformat(),
            "street": event.street,
            "city": event.city,
            "state": event.state,
            "zipcode": event.zipcode,
            "images": images
        })

    return jsonify(markers)