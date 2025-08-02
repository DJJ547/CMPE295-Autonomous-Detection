import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key")
    SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{os.getenv("MYSQL_DB_USERNAME")}:{os.getenv("MYSQL_DB_PASSWORD")}@{os.getenv("MYSQL_DB_HOST")}:{os.getenv("MYSQL_DB_PORT")}/{os.getenv("MYSQL_DB_NAME")}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_HEADERS = "Content-Type"
    LABELS = ["a graffiti", "a pothole on the road", "a crack on the road", "a tent on the sidewalk", "a bag of trash on the sidewalk"]
    ALLOWED_KEYWORDS = ["graffiti", "pothole", "crack", "tent", "trash"]
