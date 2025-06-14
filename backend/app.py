# This gevent import must stay at the top
from gevent import monkey
monkey.patch_all()
print("Gevent monkey patching done.")

from flask import Flask
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
# Load environment variables
load_dotenv()
from config import Config  # 👈 use centralized config

import boto3
import tempfile
from extensions import db, socketio, cors

# Import blueprints
from routes.auth_api import auth_bp
from routes.home import home_bp
from routes.test import test_bp
from routes.graphs_api import graphs_bp
from routes.heatmap_api import heatmap_bp
from routes.google_map_api import googlemap_bp
from routes.llm import llm_bp

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)  # centralized config class
from routes.heatmap_api import heatmap_bp  # Import the heatmap blueprint

from extensions import db, socketio, cors
from routes.llm import llm_bp
from routes.google_map_api import googlemap_bp


# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)  # 👈 central config loading

# Additional Config
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{os.getenv('MYSQL_DB_USERNAME')}:{os.getenv('MYSQL_DB_PASSWORD')}@{os.getenv('MYSQL_DB_HOST')}:{os.getenv('MYSQL_DB_PORT')}/{os.getenv('MYSQL_DB_NAME')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key'
app.config['UPLOAD_FOLDER'] = 'static/uploads'

# Initialize extensions
db.init_app(app)
socketio.init_app(app, async_mode='gevent')  # gevent preferred for macOS
cors.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(home_bp)
app.register_blueprint(test_bp)
app.register_blueprint(graphs_bp)
app.register_blueprint(googlemap_bp)
app.register_blueprint(llm_bp)
app.register_blueprint(heatmap_bp)

# Register SocketIO events
import routes.stream_socket  # this defines your socketio.on events

# Add default route to avoid "loading forever"
@app.route("/")
def index():
    return "Backend is running"

# Run the app
if __name__ == '__main__':
    print("Starting backend on http://localhost:8000")

# Register SocketIO events
import routes.stream_socket

# Run the app
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
