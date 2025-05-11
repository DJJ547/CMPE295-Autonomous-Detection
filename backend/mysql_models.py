from mysql_db import db

class User(db.Model):
    __tablename__ = 'users'  # must match actual table name in MySQL
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    
class Detection_metadata(db.Model):
    __tablename__ = 'detection_metadata'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.TIMESTAMP)
    type = db.Column(db.Enum('tent', 'graffiti', 'road damage'))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_url = db.Column(db.String(500))