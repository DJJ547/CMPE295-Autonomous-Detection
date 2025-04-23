from flask import Blueprint, jsonify, request
from mysql_db import db
from mysql_models import Anomaly

graphs_bp = Blueprint('graphs', __name__)

# @graphs_bp.route('/')
# def sample_api():
#     return "Hello, Flask!"