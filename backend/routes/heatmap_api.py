from flask import Blueprint, jsonify
from sqlalchemy import func
from extensions import db
# Import the new models and enum
from mysql_models import DetectionEvent, DetectionImage, DetectionMetadata, DetectionType

heatmap_bp = Blueprint('heatmap', __name__)

@heatmap_bp.route('/api/heatmap/anomalies', methods=['GET'])
def get_heatmap_data():
    """
    Retrieve all detection events for heatmap rendering.
    Returns coordinates, type, and other relevant data for heatmap visualization.
    """
    try:
        # Query DetectionEvents and join with DetectionImages and DetectionMetadata
        # to get the type of anomaly.
        # We use distinct to ensure each event-type combination is represented once for the heatmap.
        query_results = db.session.query(
            DetectionEvent.id,
            DetectionEvent.latitude,
            DetectionEvent.longitude,
            DetectionEvent.timestamp,
            DetectionMetadata.type
        ).join(DetectionImage, DetectionEvent.id == DetectionImage.event_id)\
         .join(DetectionMetadata, DetectionImage.id == DetectionMetadata.image_id)\
         .distinct().all()

        heatmap_data = [{
            'id': event_id,
            'lat': float(latitude),  # Ensure latitude is a float
            'lng': float(longitude), # Ensure longitude is a float
            'weight': 1,  # Default weight, can be adjusted if needed
            'type': det_type.value, # Get the string value of the enum
            'timestamp': timestamp.isoformat() if timestamp else None
        } for event_id, latitude, longitude, timestamp, det_type in query_results]
        
        return jsonify({
            'success': True,
            'data': heatmap_data
        })
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in get_heatmap_data: {str(e)}")
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@heatmap_bp.route('/api/heatmap/anomalies/by-type/<type_name>', methods=['GET'])
def get_heatmap_data_by_type(type_name):
    """
    Retrieve detection events filtered by type for heatmap rendering.
    Returns coordinates, type, and other relevant data for heatmap visualization.
    """
    try:
        # Validate the type_name against DetectionType enum keys
        try:
            # Assumes type_name matches the enum key e.g., "graffiti", "road_damage"
            anomaly_type_enum = DetectionType[type_name] 
        except KeyError:
            return jsonify({'success': False, 'error': f'Invalid type: {type_name}'}), 400
            
        # Query DetectionEvents filtered by the specified type
        query_results = db.session.query(
            DetectionEvent.id,
            DetectionEvent.latitude,
            DetectionEvent.longitude,
            DetectionEvent.timestamp,
            DetectionMetadata.type
        ).join(DetectionImage, DetectionEvent.id == DetectionImage.event_id)\
         .join(DetectionMetadata, DetectionImage.id == DetectionMetadata.image_id)\
         .filter(DetectionMetadata.type == anomaly_type_enum)\
         .distinct().all()
        
        heatmap_data = [{
            'id': event_id,
            'lat': float(latitude),
            'lng': float(longitude),
            'weight': 1,
            'type': det_type.value,
            'timestamp': timestamp.isoformat() if timestamp else None
        } for event_id, latitude, longitude, timestamp, det_type in query_results]
        
        return jsonify({
            'success': True,
            'data': heatmap_data
        })
    except Exception as e:
        print(f"Error in get_heatmap_data_by_type for {type_name}: {str(e)}")
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@heatmap_bp.route('/api/heatmap/anomalies/count', methods=['GET'])
def get_anomaly_counts():
    """
    Get counts of individual detections by type from DetectionMetadata.
    """
    try:
        # Query database to count detections by type from DetectionMetadata
        counts_query = db.session.query(
            DetectionMetadata.type, 
            func.count(DetectionMetadata.id).label('count')
        ).group_by(DetectionMetadata.type).all()
        
        # Initialize counts for all defined detection types to 0
        result = {
            dt.value: 0 for dt in DetectionType
        }
        
        # Populate with actual counts from the query
        for detection_type_enum, count_value in counts_query:
            result[detection_type_enum.value] = count_value
            
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        print(f"Error in get_anomaly_counts: {str(e)}")
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500