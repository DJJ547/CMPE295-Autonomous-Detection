from flask import Blueprint, jsonify
from mysql_models import Anomaly, AnomalyType
from mysql_db import db
from sqlalchemy import func
from datetime import datetime, timedelta

heatmap_bp = Blueprint('heatmap', __name__)

@heatmap_bp.route('/api/heatmap/anomalies', methods=['GET'])
def get_heatmap_data():
    """
    Retrieve all anomalies for heatmap rendering.
    Returns coordinates and weights for heatmap visualization.
    """
    try:
        # Query all anomalies
        anomalies = Anomaly.query.all()
        
        # Format data for heatmap
        heatmap_data = [{
            'lat': anomaly.latitude,
            'lng': anomaly.longitude,
            'weight': 1,  # Default weight
            'type': anomaly.type.value,
            'timestamp': anomaly.timestamp.isoformat() if anomaly.timestamp else None,
            'id': anomaly.id
        } for anomaly in anomalies]
        
        return jsonify({
            'success': True,
            'data': heatmap_data
        })
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@heatmap_bp.route('/api/heatmap/anomalies/by-type/<type_name>', methods=['GET'])
def get_heatmap_data_by_type(type_name):
    """
    Retrieve anomalies filtered by type for heatmap rendering.
    Returns coordinates and weights for heatmap visualization.
    """
    try:
        # Check if the type exists in the enum
        try:
            anomaly_type = AnomalyType[type_name]
        except KeyError:
            return jsonify({'success': False, 'error': f'Invalid type: {type_name}'}), 400
            
        # Query anomalies of the specified type
        anomalies = Anomaly.query.filter_by(type=anomaly_type).all()
        
        # Format data for heatmap
        heatmap_data = [{
            'lat': anomaly.latitude,
            'lng': anomaly.longitude,
            'weight': 1,  # Default weight
            'type': anomaly.type.value,
            'timestamp': anomaly.timestamp.isoformat() if anomaly.timestamp else None,
            'id': anomaly.id
        } for anomaly in anomalies]
        
        return jsonify({
            'success': True,
            'data': heatmap_data
        })
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500

@heatmap_bp.route('/api/heatmap/anomalies/count', methods=['GET'])
def get_anomaly_counts():
    """
    Get counts of anomalies by type.
    """
    try:
        # Query database to count anomalies by type
        counts = db.session.query(
            Anomaly.type, 
            func.count(Anomaly.id).label('count')
        ).group_by(Anomaly.type).all()
        
        # Format the results
        result = {
            anomaly_type.value: 0 for anomaly_type in AnomalyType
        }
        
        for anomaly_type, count in counts:
            result[anomaly_type.value] = count
            
        return jsonify({
            'success': True,
            'data': result
        })
    except Exception as e:
        return jsonify({
            'success': False, 
            'error': str(e)
        }), 500