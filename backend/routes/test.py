from flask import Blueprint, jsonify

# Create a Blueprint for home routes
test_bp = Blueprint('test', __name__)

@test_bp.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"message": "Hello from Flask Backend!"})
