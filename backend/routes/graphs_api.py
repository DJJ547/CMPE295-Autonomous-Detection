
# routes/graphs_api.py

from flask import Blueprint, request, jsonify
from sqlalchemy import func
from sqlalchemy.orm import aliased
from mysql_models import db, DetectionMetadata, DetectionImage, DetectionEvent

graphs_bp = Blueprint("graphs", __name__)


@graphs_bp.route("/api/chart-data", methods=["GET"])
def get_chart_data():
    print("==================")
    """
    API endpoint to retrieve anomaly count by date for a given type.
    Query Params:
        - type: one of ['graffiti', 'tent', 'road damage']
    """
    anomaly_type = request.args.get("type")
    print(anomaly_type)

    if not anomaly_type:
        return jsonify({"error": "Missing 'type' query parameter."}), 400

    try:

        # Aliases for clarity and to avoid accidental re-reference
        Event = aliased(DetectionEvent)
        Image = aliased(DetectionImage)
        Metadata = aliased(DetectionMetadata)

        results = db.session.query(
            func.date(Event.timestamp).label("date"),
            func.count().label("count")
        ).select_from(Metadata) \
            .join(Image, Image.id == Metadata.image_id) \
            .join(Event, Event.id == Image.event_id) \
            .filter(Metadata.type == anomaly_type) \
            .group_by(func.date(Event.timestamp)) \
            .order_by(func.date(Event.timestamp)) \
            .all()
        print(results)

        data = [{"date": row.date.strftime(
            "%Y-%m-%d"), "count": row.count} for row in results]
        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
