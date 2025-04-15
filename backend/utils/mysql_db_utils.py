from mysql_db import db
from sqlalchemy.exc import SQLAlchemyError
from mysql_models import Anomaly, AnomalyType
from datetime import datetime, timezone

def register_anomaly_to_db(latitude, longitude, url):
    try:
        new_entry = Anomaly(
            timestamp=datetime.now(timezone.utc),
            type=AnomalyType.graffiti,
            latitude=latitude,
            longitude=longitude,
            image_url=url
        )
        db.session.add(new_entry)
        db.session.commit()
        print("Anomaly successfully registered.")

    except SQLAlchemyError as e:
        db.session.rollback()
        print("Failed to register anomaly:", str(e))

    finally:
        db.session.close()