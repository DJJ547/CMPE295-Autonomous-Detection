# this eventlet import needs to stay to the top of everything
import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from extensions import db, socketio, cors

# Import blueprints
from routes.auth_api import auth_bp
from routes.home import home_bp
from routes.test import test_bp
from routes.llm import llm_bp
from routes.google_map_api import googlemap_bp

# Load environment variables
load_dotenv()
from config import Config  # 👈 use centralized config
# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)  # 👈 central config loading

# Initialize extensions
db.init_app(app)
socketio.init_app(app)
cors.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(home_bp)
app.register_blueprint(test_bp)
app.register_blueprint(googlemap_bp)
app.register_blueprint(llm_bp)

# Register SocketIO events
import routes.stream_socket

# Run the app
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000)
