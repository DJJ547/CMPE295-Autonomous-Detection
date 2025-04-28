from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from mysql_db import db
from model.detector import detect_graffiti
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

import boto3
import tempfile

# Import blueprints
from routes.auth_api import auth_bp
from routes.home import home_bp
from routes.test import test_bp
from routes.google_streetview_api import streetview_bp

from routes.heatmap_api import heatmap_bp

# Load environment variables
load_dotenv()

# Initialize Flask & extensions
app = Flask(__name__)
CORS(app)

# Config
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{os.getenv("MYSQL_DB_USERNAME")}:{os.getenv("MYSQL_DB_PASSWORD")}@{os.getenv("MYSQL_DB_HOST")}:{os.getenv("MYSQL_DB_PORT")}/{os.getenv("MYSQL_DB_NAME")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key'
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Initialize DB with app
db.init_app(app)

# Register blueprints directly
app.register_blueprint(auth_bp)
app.register_blueprint(home_bp)
app.register_blueprint(test_bp)
app.register_blueprint(streetview_bp)
app.register_blueprint(heatmap_bp)

# Add detection endpoint
@app.route('/detect', methods=['POST'])
def detect():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files['image']
    filename = secure_filename(image.filename)
    image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    image.save(image_path)

    # Run detection
    result = detect_graffiti(image_path)

    return jsonify(result), 200

@app.route('/detect-s3', methods=['POST'])
def detect_s3():
    # Check if S3 URL was provided
    if not request.json or 'url' not in request.json:
        return jsonify({"error": "No S3 URL provided"}), 400
    
    s3_url = request.json['url']
    
    # Parse S3 URL to get bucket and key
    # Expected format: s3://bucket-name/path/to/file.jpg
    if not s3_url.startswith('s3://'):
        return jsonify({"error": "Invalid S3 URL format. Use s3://bucket-name/key"}), 400
    
    # Remove s3:// prefix and split into bucket and key
    s3_path = s3_url[5:]
    try:
        bucket_name, s3_key = s3_path.split('/', 1)
    except ValueError:
        return jsonify({"error": "Invalid S3 URL format. Use s3://bucket-name/key"}), 400
    
    # Initialize S3 client
    s3 = boto3.client(
        "s3",
        region_name=os.getenv("AWS_REGION"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    
    try:
        # Create temp file in static/uploads instead of system temp directory
        filename = f"s3_temp_{os.path.basename(s3_key)}"
        temp_file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        # Download the file
        s3.download_file(bucket_name, s3_key, temp_file_path)
        
        # Run detection on the downloaded image
        result = detect_graffiti(temp_file_path)
        
        # Clean up temp file - use try/finally to ensure it gets deleted
        try:
            os.remove(temp_file_path)
        except:
            # If we can't delete it now, it's not critical - it's in our app folder
            pass
            
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
app.register_blueprint(graphs_bp)

# Run the app
if __name__ == '__main__':
    # with app.app_context():
    #     db.create_all()  # create tables if not exist
    app.run(debug=True, port=8000)
