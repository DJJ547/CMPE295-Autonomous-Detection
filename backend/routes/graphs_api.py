# routes/graphs_api.py  (or wherever your chart-data lives)
from flask import Blueprint, jsonify, request
from extensions import db
from mysql_models import DetectionEvent, DetectionImage, DetectionMetadata
from sqlalchemy import func
from datetime import datetime, timedelta

graphs_bp = Blueprint("graphs", __name__, url_prefix="/api")

@graphs_bp.route("/chart-data", methods=["GET"])
def get_chart_data():
    anomaly_type = request.args.get("type")
    start_str   = request.args.get("start")
    end_str     = request.args.get("end")

    # parse dates
    start_dt = datetime.fromisoformat(start_str) if start_str else None
    end_dt   = datetime.fromisoformat(end_str)   if end_str   else None

    # base query: join metadata→image→event
    q = (
        db.session.query(DetectionEvent.timestamp, func.count(DetectionMetadata.id).label("count"))
        .join(DetectionImage, DetectionImage.event_id == DetectionEvent.id)
        .join(DetectionMetadata, DetectionMetadata.image_id == DetectionImage.id)
        .filter(DetectionMetadata.type == anomaly_type)
    )

    # apply filters
    if start_dt:
        q = q.filter(DetectionEvent.timestamp >= start_dt)
    if end_dt:
        # if they picked the same date, include the full day
        # otherwise just <= end_dt at midnight
        cutoff = end_dt + timedelta(days=1) if start_dt == end_dt else end_dt
        q = q.filter(DetectionEvent.timestamp <= cutoff)

    # decide grouping key: by hour if same-day, else by date
    if start_dt and end_dt and start_dt.date() == end_dt.date():
        # hourly buckets:
        bucket = func.date_format(DetectionEvent.timestamp, "%Y-%m-%dT%H:00:00")
    else:
        # daily buckets:
        bucket = func.date_format(DetectionEvent.timestamp, "%Y-%m-%dT00:00:00")

    results = (
        q.with_entities(bucket.label("bucket"), func.count().label("count"))
         .group_by(bucket)
         .order_by(bucket)
         .all()
    )

    # build JSON
    data = [{"date": row.bucket, "count": row.count} for row in results]
    return jsonify(data), 200
