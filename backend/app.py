from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from mysql_db import db
import os

# Import blueprints
from routes.auth_api import auth_bp
from routes.home import home_bp
from routes.test import test_bp
from routes.google_streetview_api import streetview_bp
from routes.graphs_api import graphs_bp

from dotenv import load_dotenv
load_dotenv()

# Initialize Flask & extensions
app = Flask(__name__)
CORS(app)

# Config
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['SQLALCHEMY_DATABASE_URI'] = f'mysql+pymysql://{os.getenv("MYSQL_DB_USERNAME")}:{os.getenv("MYSQL_DB_PASSWORD")}@{os.getenv("MYSQL_DB_HOST")}:{os.getenv("MYSQL_DB_PORT")}/{os.getenv("MYSQL_DB_NAME")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'super-secret-key'

# Initialize DB with app
db.init_app(app)

# Register blueprints directly
app.register_blueprint(auth_bp)
app.register_blueprint(home_bp)
app.register_blueprint(test_bp)
app.register_blueprint(streetview_bp)
app.register_blueprint(graphs_bp)

# Run the app
if __name__ == '__main__':
    # with app.app_context():
    #     db.create_all()  # create tables if not exist
    app.run(debug=True, port=8000)
