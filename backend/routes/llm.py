import requests
from dotenv import load_dotenv
import os
import time
import numpy as np
from flask import Blueprint, jsonify, request
from google.generativeai import types
import google.generativeai as genai
import json

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
        model = genai.GenerativeModel("gemini-2.0-flash")
        chat = model.start_chat(history=[])
        conversations[user_id] = chat
    else:
        chat = conversations[user_id]
    
    response = chat.send_message(
        prompt,
        generation_config={
            "max_output_tokens": 200
        }
    )
    return jsonify({"reply": response.text})

from mysql_models import DetectionEvent, DetectionImage, DetectionMetadata
from sqlalchemy.orm import joinedload


@llm_bp.route('/api/llm-summarize', methods=['POST'])
def summarize():
    events = DetectionEvent.query.options(
        joinedload(DetectionEvent.images).joinedload(DetectionImage.metadatas)
    ).all()
    
    anomalyJson = []
    for event in events:
        anomalyList = []
        for image in event.images:
            anomalyList.extend([metadata.type.value for metadata in image.metadatas])
                        
        anomalyJson.append(
            {
                "anamolyTypes": anomalyList,
                "latitude": str(event.latitude),
                "longitude": str(event.longitude),
                "timestamp": event.timestamp.isoformat(),
                "street": event.street,
                "city": event.city,
                "state": event.state,
                "zipcode": event.zipcode,
            })
    json_string = json.dumps(anomalyJson, indent=2)  # `indent=2` for pretty print
    print(json_string)    
        
    return jsonify({"reply": anomalyJson})