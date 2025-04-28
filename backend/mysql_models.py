from mysql_db import db
import enum

class User(db.Model):
    __tablename__ = 'users'  # must match actual table name in MySQL
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    
# Define the ENUM type as a Python Enum
class AnomalyType(enum.Enum):
    tent = "tent"
    graffiti = "graffiti"
    road_damage = "road damage"
    
class Anomaly(db.Model):
    __tablename__ = 'anomalies'  # must match actual table name in MySQL
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    timestamp = db.Column(db.TIMESTAMP)
    type = db.Column(db.Enum(AnomalyType), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    image_url = db.Column(db.String(500))