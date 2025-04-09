<<<<<<< HEAD
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from mysql_db import db
from model.detector import detect_graffiti
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
=======
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from mysql_db import db
import os
>>>>>>> dev

# Import blueprints
from routes.auth import auth_bp
from routes.home import home_bp
from routes.test import test_bp
from routes.google_streetview import streetview_bp

<<<<<<< HEAD
# Load environment variables
=======
from dotenv import load_dotenv
>>>>>>> dev
load_dotenv()

# Initialize Flask & extensions
app = Flask(__name__)
CORS(app)

# Config
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{os.getenv("MYSQL_DB_USERNAME")}:{os.getenv("MYSQL_DB_PASSWORD")}@{os.getenv("MYSQL_DB_HOST")}:{os.getenv("MYSQL_DB_PORT")}/{os.getenv("MYSQL_DB_NAME")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key'
<<<<<<< HEAD
app.config['UPLOAD_FOLDER'] = 'static/uploads'
=======
>>>>>>> dev

# Initialize DB with app
db.init_app(app)

# Register blueprints directly
app.register_blueprint(auth_bp)
app.register_blueprint(home_bp)
app.register_blueprint(test_bp)
app.register_blueprint(streetview_bp)

<<<<<<< HEAD
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

=======
>>>>>>> dev
# Run the app
if __name__ == '__main__':
    # with app.app_context():
    #     db.create_all()  # create tables if not exist
<<<<<<< HEAD
    app.run(debug=True, port=8000)
=======
    app.run(debug=True, port=8000)
>>>>>>> dev
