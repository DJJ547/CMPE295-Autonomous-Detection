
# routes/graphs_api.py

from flask import Blueprint, request, jsonify
from sqlalchemy import func
from mysql_models import db, DetectionMetadata, DetectionImage, DetectionEvent

graphs_bp = Blueprint("graphs", __name__)

@graphs_bp.route("/api/chart-data", methods=["GET"])
def get_chart_data():
    """
    API endpoint to retrieve anomaly count by date for a given type.
    Query Params:
        - type: one of ['graffiti', 'tent', 'road damage']
    """
    anomaly_type = request.args.get("type")

    if not anomaly_type:
        return jsonify({"error": "Missing 'type' query parameter."}), 400

    try:
        results = db.session.query(
            func.date(DetectionEvent.timestamp).label("date"),
            func.count().label("count")
        ).join(DetectionImage, DetectionImage.id == DetectionMetadata.image_id) \
         .join(DetectionEvent, DetectionEvent.id == DetectionImage.event_id) \
         .filter(DetectionMetadata.type == anomaly_type) \
         .group_by(func.date(DetectionEvent.timestamp)) \
         .order_by(func.date(DetectionEvent.timestamp)) \
         .all()

        data = [{"date": row.date.strftime("%Y-%m-%d"), "count": row.count} for row in results]
        return jsonify(data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
