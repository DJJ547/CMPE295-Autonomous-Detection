from flask import Blueprint, jsonify, request
from mysql_db import db
from mysql_models import Anomaly

googlemap_bp = Blueprint('googlemap', __name__)

# @googlemap_bp.route('/')
# def sample_api():
#     return "Hello, Flask!"