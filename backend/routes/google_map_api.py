# in your googlemap_bp file (e.g. googlemap.py)
from flask import Blueprint, jsonify, request
from extensions import db
from mysql_models import DetectionEvent, DetectionImage, DetectionMetadata, Task
from sqlalchemy.orm import joinedload
from sqlalchemy import func

googlemap_bp = Blueprint("googlemap", __name__)


@googlemap_bp.route("/api/anomalies", methods=["GET"])
def get_anomalies():
    events = DetectionEvent.query.options(
        joinedload(DetectionEvent.images).joinedload(DetectionImage.metadatas)
    ).all()

    markers = []
    for event in events:
        images = []
        for image in event.images:
            metadatas = [
                {
                    "id": metadata.id,
                    "X1_loc": metadata.X1_loc,
                    "Y1_loc": metadata.Y1_loc,
                    "X2_loc": metadata.X2_loc,
                    "Y2_loc": metadata.Y2_loc,
                    "label": metadata.label,
                    "score": metadata.score,
                    "type": metadata.type.value,
                    "caption": metadata.caption,
                }
                for metadata in image.metadatas
            ]
            images.append(
                {
                    "id": image.id,
                    "direction": image.direction.value,
                    "image_url": image.image_url,
                    "metadatas": metadatas,
                }
            )

        markers.append(
            {
                "id": event.id,
                "latitude": str(event.latitude),
                "longitude": str(event.longitude),
                "timestamp": event.timestamp.isoformat(),
                "street": event.street,
                "city": event.city,
                "state": event.state,
                "zipcode": event.zipcode,
                "images": images,
            }
        )

    return jsonify(markers)


@googlemap_bp.route("/api/anomalies/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    event = DetectionEvent.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    metadata_ids = [md.id for img in event.images for md in img.metadatas]
    if metadata_ids:
        Task.query.filter(Task.metadata_id.in_(metadata_ids)).delete(
            synchronize_session=False
        )

    db.session.delete(event)
    db.session.commit()
    return jsonify({"message": "Event and its related tasks deleted"}), 200


@googlemap_bp.route("/api/anomalies/images/<int:image_id>", methods=["DELETE"])
def delete_image(image_id):
    image = DetectionImage.query.get(image_id)
    if not image:
        return jsonify({"error": "Image not found"}), 404

    metadata_ids = [md.id for md in image.metadatas]
    if metadata_ids:
        Task.query.filter(Task.metadata_id.in_(metadata_ids)).delete(
            synchronize_session=False
        )

    db.session.delete(image)
    db.session.commit()
    return jsonify({"message": "Image and its related tasks deleted"}), 200


@googlemap_bp.route("/api/anomalies/metadata/<int:metadata_id>", methods=["DELETE"])
def delete_metadata(metadata_id):
    metadata = DetectionMetadata.query.get(metadata_id)
    if not metadata:
        return jsonify({"error": "Metadata not found"}), 404

    Task.query.filter_by(metadata_id=metadata_id).delete(synchronize_session=False)
    db.session.delete(metadata)
    db.session.commit()
    return jsonify({"message": "Metadata and its related tasks deleted"}), 200


@googlemap_bp.route("/api/anomalies/stats", methods=["GET"])
def anomalies_stats():
    # 1) run the GROUP BY
    results = (
        db.session.query(DetectionMetadata.type, func.count(DetectionMetadata.id))
        .group_by(DetectionMetadata.type)
        .all()
    )
    # 2) key by the enum's .value (the string), not by the Enum member itself
    counts = {enum_member.value: count for enum_member, count in results}

    # 3) return, filling in missing categories with zero
    return (
        jsonify(
            {
                "road_damage": counts.get("road_damage", 0),
                "graffiti": counts.get("graffiti", 0),
                "tent": counts.get("tent", 0),
            }
        ),
        200,
    )
