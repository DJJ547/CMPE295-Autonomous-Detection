import random
from flask import Blueprint, jsonify
from models.anomaly import Anomaly


# Create a Blueprint for home routes
googleMap_bp = Blueprint('googleMap', __name__)


@googleMap_bp.route('/api/anomalies', methods=['GET'])
def get_anomalies():
    
    anomalies = Anomaly.query.all()
    markers = []
    for anomaly in anomalies:
        markers.append({
            "class": anomaly.type.replace(' ', '-'),
            "lat": anomaly.latitude,
            "lng": anomaly.longitude,
            "image_url": anomaly.image_url,
            "timestamp": anomaly.timestamp.isoformat() if anomaly.timestamp else None
        })
    #print(markers[0], flush=True)
    return jsonify(markers)