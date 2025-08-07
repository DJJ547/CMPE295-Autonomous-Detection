from flask import Blueprint, jsonify, request
from extensions import db
from mysql_models import DetectionEvent, DetectionImage, DetectionMetadata, Task
from sqlalchemy.orm import joinedload

googlemap_bp = Blueprint("googlemap", __name__)


@googlemap_bp.route("/api/anomalies", methods=["GET"])
def get_anomalies():

    events = DetectionEvent.query.options(
        joinedload(DetectionEvent.images).joinedload(DetectionImage.metadatas)
    ).all()
    markers = []
    for event in events:
        # Construct a list of images and their metadata for the current event
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

        # Add the event data along with images and metadata
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

    # 1) Gather all metadata IDs under this event
    metadata_ids = [
        md.id
        for img in event.images
        for md in img.metadatas
    ]
    # 2) Delete any tasks pointing to those metadata IDs
    if metadata_ids:
        Task.query.filter(Task.metadata_id.in_(metadata_ids)).delete(synchronize_session=False)

    # 3) Delete the event (cascade will remove images & metadata)
    db.session.delete(event)
    db.session.commit()

    return jsonify({"message": "Event and its related tasks deleted"}), 200


@googlemap_bp.route("/api/anomalies/images/<int:image_id>", methods=["DELETE"])
def delete_image(image_id):
    image = DetectionImage.query.get(image_id)
    if not image:
        return jsonify({"error": "Image not found"}), 404

    # 1) Gather metadata IDs under this image
    metadata_ids = [md.id for md in image.metadatas]
    # 2) Delete tasks referencing those metadata IDs
    if metadata_ids:
        Task.query.filter(Task.metadata_id.in_(metadata_ids)).delete(synchronize_session=False)

    # 3) Delete the image (cascade will remove its metadata)
    db.session.delete(image)
    db.session.commit()

    return jsonify({"message": "Image and its related tasks deleted"}), 200


@googlemap_bp.route("/api/anomalies/metadata/<int:metadata_id>", methods=["DELETE"])
def delete_metadata(metadata_id):
    metadata = DetectionMetadata.query.get(metadata_id)
    if not metadata:
        return jsonify({"error": "Metadata not found"}), 404

    # 1) Delete any tasks pointing to this metadata
    Task.query.filter_by(metadata_id=metadata_id).delete(synchronize_session=False)

    # 2) Delete the metadata
    db.session.delete(metadata)
    db.session.commit()

    return jsonify({"message": "Metadata and its related tasks deleted"}), 200