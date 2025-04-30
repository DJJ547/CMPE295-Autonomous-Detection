from mysql_db import db
import enum
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = 'users'  # must match actual table name in MySQL
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    
class DetectionEvent(db.Model):
    __tablename__ = 'detection_events'  # must match actual table name in MySQL
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.now(timezone.utc))
    street = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    zipcode = db.Column(db.String(100), nullable=True)
    
    # Optional reverse relation
    images = db.relationship("DetectionImage", backref="event", cascade="all, delete-orphan")

class DetectionImage(db.Model):
    __tablename__ = 'detection_images'  # must match actual table name in MySQL
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(db.Integer, db.ForeignKey('detection_events.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    
    # Optional reverse relation
    metadatas = db.relationship("DetectionMetadata", backref="image", cascade="all, delete-orphan")

# Define the ENUM type as a Python Enum
class DetectionType(enum.Enum):
    tent = "tent"
    graffiti = "graffiti"
    pothole = "pothole"

class DetectionMetadata(db.Model):
    __tablename__ = 'detection_metadata'  # must match actual table name in MySQL
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    image_id = db.Column(db.Integer, db.ForeignKey('detection_images.id'), nullable=False)
    X1_loc = db.Column(db.Integer, nullable=False)
    Y1_loc = db.Column(db.Integer, nullable=False)
    X2_loc = db.Column(db.Integer, nullable=False)
    Y2_loc = db.Column(db.Integer, nullable=False)
    label = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Float, nullable=False)
    type = db.Column(db.Enum(DetectionType), nullable=False)
    