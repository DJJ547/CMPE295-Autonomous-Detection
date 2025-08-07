from extensions import db
import enum
from datetime import datetime, timezone
from sqlalchemy import Numeric, UniqueConstraint
from sqlalchemy.sql import func


class UserRole(enum.Enum):
    admin = "admin"
    worker = "worker"
    guest = "guest"


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False)


class DetectionEvent(db.Model):
    __tablename__ = "detection_events"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    latitude = db.Column(Numeric(9, 6), nullable=False)
    longitude = db.Column(Numeric(9, 6), nullable=False)
    timestamp = db.Column(
        db.DateTime, nullable=False, default=datetime.now(timezone.utc)
    )
    street = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    zipcode = db.Column(db.String(100), nullable=True)

    # The detection_events table allows only one event per unique (latitude, longitude)
    __table_args__ = (UniqueConstraint("latitude", "longitude", name="uq_lat_lon"),)

    # Optional reverse relation
    images = db.relationship(
        "DetectionImage", backref="event", cascade="all, delete-orphan"
    )


class Directions(enum.Enum):
    front = "front"
    back = "back"
    left = "left"
    right = "right"


class DetectionImage(db.Model):
    __tablename__ = "detection_images"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    event_id = db.Column(
        db.Integer, db.ForeignKey("detection_events.id"), nullable=False
    )
    direction = db.Column(db.Enum(Directions), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)

    # Optional reverse relation
    metadatas = db.relationship(
        "DetectionMetadata", backref="image", cascade="all, delete-orphan"
    )


class DetectionType(enum.Enum):
    tent = "tent"
    graffiti = "graffiti"
    road_damage = "road_damage"
    trash = "trash"


class DetectionMetadata(db.Model):
    __tablename__ = "detection_metadata"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    image_id = db.Column(
        db.Integer, db.ForeignKey("detection_images.id"), nullable=False
    )
    X1_loc = db.Column(db.Integer, nullable=False)
    Y1_loc = db.Column(db.Integer, nullable=False)
    X2_loc = db.Column(db.Integer, nullable=False)
    Y2_loc = db.Column(db.Integer, nullable=False)
    label = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Float, nullable=False)
    type = db.Column(db.Enum(DetectionType), nullable=False)
    caption = db.Column(db.String(200))


class Status(enum.Enum):
    unverified = "unverified"
    verified = "verified"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    discarded = "discarded"


class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    metadata_id = db.Column(
        db.Integer, db.ForeignKey("detection_metadata.id"), nullable=False
    )
    worker_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    status = db.Column(db.Enum(Status), nullable=False, default=Status.unverified)
    notes = db.Column(db.String(500), nullable=True)
    scheduled_time = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime, default=func.now(), onupdate=datetime.now(timezone.utc)
    )

    metadatas = db.relationship("DetectionMetadata", backref="tasks")
    worker = db.relationship("User", backref="tasks")
