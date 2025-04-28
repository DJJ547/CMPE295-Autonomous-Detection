from flask import Blueprint, jsonify, request
from mysql_db import db
from mysql_models import Anomaly

graphs_bp = Blueprint('graphs', __name__)

# ===== API: Summary counts for PieChart =====
@graphs_bp.route('/api/graphs/summary', methods=['GET'])
def get_anomaly_summary():
    """
    Get the total counts of each anomaly type: graffiti, road_damage, encampment.
    """
    try:
        graffiti_count = Anomaly.query.filter_by(type='graffiti').count()
        road_damage_count = Anomaly.query.filter_by(type='road_damage').count()
        encampment_count = Anomaly.query.filter_by(type='encampment').count()

        return jsonify({
            'graffiti': graffiti_count,
            'road_damage': road_damage_count,
            'encampment': encampment_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== API: Monthly trend for BarChart and LineChart =====
@graphs_bp.route('/api/graphs/trends', methods=['GET'])
def get_anomaly_trends():
    """
    Get monthly issue counts for bar/line charts.
    """
    try:
        results = db.session.execute("""
            SELECT DATE_FORMAT(timestamp, '%M') AS month, COUNT(*) AS issues_detected
            FROM anomalies
            GROUP BY month
            ORDER BY MIN(timestamp)
        """)

        data = [{'month': row['month'], 'issues_detected': row['issues_detected']} for row in results]

        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500