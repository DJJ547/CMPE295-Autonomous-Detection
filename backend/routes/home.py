from flask import Blueprint

# Create a Blueprint for home routes
home_bp = Blueprint('home', __name__)

@home_bp.route('/')
def home():
    return "Hello, Flask!"
