import random
from flask import Blueprint, jsonify
from models.anomaly import Anomaly

# Create a Blueprint for home routes
test_bp = Blueprint('test', __name__)

@test_bp.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"message": "Hello from Flask Backend!"})

@test_bp.route('/api/markers', methods=['GET'])
def get_markers():
    # Initial markers
    base_markers = [
        {"class": "road-damage", "lat": "37.7746", "lng": "-122.4193"},
        {"class": "encampment", "lat": "37.7740", "lng": "-122.4188"},
        {"class": "graffiti", "lat": "37.7741", "lng": "-122.4144"},
    ]
    
    
    return jsonify(base_markers)

