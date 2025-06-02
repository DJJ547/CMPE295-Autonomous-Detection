import requests
from dotenv import load_dotenv
import os
import time
import numpy as np
from flask import Blueprint, jsonify, request
from google.generativeai import types
import google.generativeai as genai

load_dotenv()

llm_bp = Blueprint('llm', __name__)
conversations = {}

# Configure API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

@llm_bp.route('/api/llm-query', methods=['POST'])
def generate():
    user_id = request.json.get("user_id")
    prompt = request.json.get("message")

    if not user_id or not prompt:
        return jsonify({"error": "Missing user_id or message"}), 400

    # Initialize or retrieve chat history
    if user_id not in conversations:
        model = genai.GenerativeModel("gemini-pro")
        chat = model.start_chat(history=[])
        conversations[user_id] = chat
    else:
        chat = conversations[user_id]
