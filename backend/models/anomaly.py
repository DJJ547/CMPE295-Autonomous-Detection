from mysql_db import db


class Anomaly(db.Model):
    __tablename__ = 'anomalies'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    timestamp = db.Column(db.TIMESTAMP)
    type = db.Column(db.Enum('tent', 'graffiti', 'road damage'))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    image_url = db.Column(db.String(500))