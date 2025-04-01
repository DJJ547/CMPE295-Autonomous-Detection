from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from routes.home import home_bp  # Import the Blueprint
from routes.test import test_bp
from routes.google_streetview import streetview_bp

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register Blueprints
app.register_blueprint(home_bp)
app.register_blueprint(test_bp)
app.register_blueprint(streetview_bp)

if __name__ == '__main__':
    app.run(debug=True, port=8000)
