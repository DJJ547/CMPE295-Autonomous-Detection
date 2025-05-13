import requests
from dotenv import load_dotenv
import os
import time
import numpy as np
from flask import Blueprint, jsonify, request
from google.genai import types

from google import genai
load_dotenv()

llm_bp = Blueprint('llm', __name__)
conversations = {}

@llm_bp.route('/api/llm-query', methods=['POST'])
def generate():
    user_id = request.json.get("user_id")
    prompt = request.json.get("message")
    
    if not user_id or not prompt:
        return jsonify({"error": "Missing user_id or message"}), 400
    
    if user_id not in conversations:
        conversations[user_id] = []
    conversations[user_id].append({"role": "user", "parts": [prompt]})
    
    
    api_key = os.getenv("GEMINI_API_KEY")
    
    
    client = genai.Client(api_key=api_key)
    chat = client.chats.create(
        model="gemini-2.0-flash",
        config=types.GenerateContentConfig(
        max_output_tokens=100,
    )
    )
    
    response = chat.send_message(prompt)
    print(response.text)

    return jsonify({"reply": response.text})
