# this eventlet import needs to stay to the top of everything
import eventlet
eventlet.monkey_patch()
from flask import Flask
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

import boto3
import tempfile

# Import blueprints
from routes.auth_api import auth_bp
from routes.home import home_bp
from routes.test import test_bp

from extensions import db, socketio, cors
from routes.llm import llm_bp
from routes.google_map_api import googlemap_bp
from dotenv import load_dotenv
load_dotenv()

# Initialize Flask & extensions
app = Flask(__name__)

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

# Register blueprints directly
app.register_blueprint(auth_bp)
app.register_blueprint(home_bp)
app.register_blueprint(test_bp)
app.register_blueprint(googlemap_bp)
app.register_blueprint(llm_bp)

# Import and register your socket events
import routes.stream_socket  # <-- important: this registers @socketio.on handlers

# Run the app
if __name__ == '__main__':
    # with app.app_context():
    #     db.create_all()  # create tables if not exist
    # app.run(debug=True, port=8000)
    socketio.run(app, host='0.0.0.0', port=8000)
