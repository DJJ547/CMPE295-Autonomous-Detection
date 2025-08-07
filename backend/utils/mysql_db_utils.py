from extensions import db
from sqlalchemy.exc import SQLAlchemyError
from mysql_models import (
    DetectionEvent,
    DetectionImage,
    DetectionMetadata,
    DetectionType,
    Task,
    Status,
)
from datetime import datetime, timezone
from config import Config

text_labels = Config.ALLOWED_KEYWORDS


def get_detected_type(label: str) -> DetectionType:
    label = label.lower()

    if "graffiti" in label:
        return DetectionType.graffiti
    elif "tent" in label:
        return DetectionType.tent
    elif "damage" in label or "crack" in label or "hole" in label:
        return DetectionType.road_damage
    elif "trash" in label:
        return DetectionType.trash
    else:
        raise ValueError(f"Unknown label: {label}")


def register_anomaly_to_db(
    latitude, longitude, address, direction, image_url, output, caption=None
):
    try:
        # Step 1: Check if an event with the same (lat, lon) exists
        existing_event = DetectionEvent.query.filter_by(
            latitude=latitude, longitude=longitude
        ).first()

        if existing_event:
            new_event_id = existing_event.id
        else:
            # Step 2: Create a new DetectionEvent
            new_event_entry = DetectionEvent(
                latitude=latitude,
                longitude=longitude,
                timestamp=datetime.now(timezone.utc),
                street=address.get("street", ""),
                city=address.get("city", ""),
                state=address.get("state", ""),
                zipcode=address.get("zipcode", ""),
            )
            db.session.add(new_event_entry)
            db.session.commit()
            new_event_id = new_event_entry.id
            print("Anomaly successfully registered.")

        # Step 3: Add associated image
        new_image_entry = DetectionImage(
            event_id=new_event_id, direction=direction, image_url=image_url
        )
        db.session.add(new_image_entry)
        db.session.commit()

        new_image_id = new_image_entry.id
        for res in output:
            new_metadata_entry = DetectionMetadata(
                image_id=new_image_id,
                X1_loc=res["box"][0],
                Y1_loc=res["box"][1],
                X2_loc=res["box"][2],
                Y2_loc=res["box"][3],
                label=res["label"],
                score=res["score"],
                caption=res.get("caption") if caption is None else caption,
                type=get_detected_type(res["label"]),
            )
            db.session.add(new_metadata_entry)
            db.session.commit()

            # Step 5: Create Task for the new metadata
            new_task = Task(
                metadata_id=new_metadata_entry.id,
                status=Status.unverified,
                created_at=datetime.now(timezone.utc),
            )
            db.session.add(new_task)
            db.session.commit()

    except SQLAlchemyError as e:
        db.session.rollback()
        print("Failed to register anomaly:", str(e))

    finally:
        db.session.close()
