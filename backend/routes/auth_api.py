from flask import Blueprint, request, jsonify, current_app
from extensions import db
from mysql_models import User
import jwt
from datetime import datetime, timedelta, timezone

auth_bp = Blueprint('auth', __name__)

def generate_jwt_token(user):
    payload = {
        'user_id': user.id,
        'email': user.email,
        'exp':  datetime.now(timezone.utc) + timedelta(hours=24)  # token expires in 24 hours
    }

    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')
    return token


@auth_bp.route('/auth/login/', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email, password=password).first()

    if user:
        token = generate_jwt_token(user)
        print(user.role)
        return jsonify({
            'id': user.id,
            'message': 'Login successful',
            'email': user.email,
            'firstname': user.first_name,
            'lastname': user.last_name,
            'role': user.role.value,
            'token': token
        }), 200
    else:
        return jsonify({'message': 'Invalid email or password'}), 401


@auth_bp.route('/auth/signup/', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    firstname = data.get('firstname')
    lastname = data.get('lastname')

    # Check for existing user
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already exists'}), 409

    new_user = User(
        email=email,
        password=password,  # Plaintext (⚠️ for testing/demo only)
        first_name=firstname,
        last_name=lastname,
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Signup successful'}), 200
