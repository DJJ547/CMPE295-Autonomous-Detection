import random
from flask import Blueprint, jsonify

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
    
    # Simulate random increase of markers
    num_new_markers = random.randint(1, 5)  # Random number of markers to add (1 to 5)
    
    for _ in range(num_new_markers):
        # Generate a random marker
        new_marker = {
            "class": random.choice(["road-damage", "encampment", "graffiti"]),  # Random class
            "lat": str(round(random.uniform(37.77, 37.78), 4)),  # Random latitude in range 37.7 to 37.8
            "lng": str(round(random.uniform(-122.41, -122.43), 4)),  # Random longitude in range -122.5 to -122.3
        }
        base_markers.append(new_marker)
    
    return jsonify(base_markers)
