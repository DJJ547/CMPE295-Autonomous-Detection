from flask import Blueprint, jsonify, request
from extensions import db #
from mysql_models import DetectionEvent, DetectionImage, DetectionMetadata, DetectionType #

heatmap_bp = Blueprint('heatmap', __name__)

@heatmap_bp.route('/api/heatmap/data', methods=['GET'])
def get_heatmap_data():
    """
    Fetches heatmap data based on detection events and metadata.
    Allows filtering by detection type (e.g., ?type=graffiti).
    """
    detection_type_filter = request.args.get('type') # Get 'type' from query parameters

    query = db.session.query(
        DetectionEvent.latitude, #
        DetectionEvent.longitude, #
        DetectionMetadata.type #
    ).join(DetectionImage, DetectionEvent.id == DetectionImage.event_id)\
     .join(DetectionMetadata, DetectionImage.id == DetectionMetadata.image_id)

    # Apply filter if a detection type is provided in the query string
    if detection_type_filter:
        try:
            # Convert the string filter to the DetectionType Enum member
            # Enum members are case-sensitive, so convert filter to match enum values (e.g., "road damage" -> "road_damage")
            # Note: The DetectionType enum has "road_damage" as a key for "road damage" value
            
            # Special handling for "road_damage" string to match enum key "road_damage"
            if detection_type_filter.lower() == "road damage":
                enum_type = DetectionType.road_damage
            else:
                enum_type = DetectionType[detection_type_filter.lower()]
            
            query = query.filter(DetectionMetadata.type == enum_type) #
        except KeyError:
            # Return an error if the provided detection type is invalid
            return jsonify({"error": f"Invalid detection type: {detection_type_filter}. Valid types are: {', '.join([d.value for d in DetectionType])}"}), 400

    results = query.all()

    heatmap_data = []
    for lat, lng, det_type in results:
        # Each detection event contributes a point to the heatmap.
        # Assign a weight (e.g., 1) and include the type for potential frontend specific rendering.
        heatmap_data.append({
            "lat": float(lat),
            "lng": float(lng),
            "weight": 1, # Default weight; can be adjusted based on needs (e.g., score, number of detections at a point)
            "type": det_type.value # Store the enum value string (e.g., "graffiti", "road damage", "tent")
        })

    return jsonify(heatmap_data)