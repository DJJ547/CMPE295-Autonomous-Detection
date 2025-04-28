from flask import Blueprint, jsonify, request
from mysql_db import db
from mysql_models import Anomaly

heatmap_bp = Blueprint('heatmap', __name__)

# @heatmap_bp.route('/')
# def sample_api():
#     return "Hello, Flask!"