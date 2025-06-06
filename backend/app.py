# this eventlet import needs to stay to the top of everything
import eventlet
eventlet.monkey_patch()


print("Eventlet monkey patching done.")
from flask import Flask
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

import boto3
import tempfile
from extensions import db, socketio, cors

# Import blueprints
from routes.auth_api import auth_bp
from routes.home import home_bp
from routes.test import test_bp
from routes.heatmap_api import heatmap_bp  # Import the heatmap blueprint

from extensions import db, socketio, cors
from routes.llm import llm_bp
from routes.google_map_api import googlemap_bp

# Load environment variables
load_dotenv()
from config import Config  # 👈 use centralized config
# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)  # 👈 central config loading

# Config
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{os.getenv("MYSQL_DB_USERNAME")}:{os.getenv("MYSQL_DB_PASSWORD")}@{os.getenv("MYSQL_DB_HOST")}:{os.getenv("MYSQL_DB_PORT")}/{os.getenv("MYSQL_DB_NAME")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key'
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Initialize DB, socket, cors with app
db.init_app(app)
socketio.init_app(app)
cors.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(home_bp)
app.register_blueprint(test_bp)
app.register_blueprint(googlemap_bp)
app.register_blueprint(llm_bp)
app.register_blueprint(heatmap_bp)  # Register the heatmap blueprint

# Register SocketIO events
import routes.stream_socket

# Run the app
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
