# extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_cors import CORS

db = SQLAlchemy()
socketio = SocketIO(cors_allowed_origins="*")
cors = CORS()