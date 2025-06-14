import requests
from dotenv import load_dotenv
import os
import time
import numpy as np
from flask import Blueprint, jsonify, request
# from google.generativeai import types
# import google.generativeai as genai

from google import genai
from google.genai import types
import json, hashlib

load_dotenv()

llm_bp = Blueprint('llm', __name__)
conversations = {}

# Configure API key
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@llm_bp.route('/api/llm-query', methods=['POST'])
def generate():
    context = request.json.get("context")
    message = request.json.get("message")

    prompt = f"""
        You are an assistant analyzing urban anomaly detection reports. Here is the summarized report:
        
        {context}
        
        Can you respond to the user input based on the context above 
        
        {message}
        
        Use formal tone and structured formatting (e.g., bullets or short paragraphs).
        """
        
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt],
        config=types.GenerateContentConfig(
            max_output_tokens=200,
        )
    )

    # model = genai.model.generate_content("gemini-2.0-flash")
    # chat = model.start_chat(history=[])



    # response = chat.send_message(
    #     prompt,
    #     generation_config={
    #         "max_output_tokens": 200
    #     }
    # )
    return jsonify({"reply": response.text})

from mysql_models import DetectionEvent, DetectionImage, DetectionMetadata
from sqlalchemy.orm import joinedload

cached_summary = None#TO DO: implement this in the database
cached_hash = None


@llm_bp.route('/api/llm-summarize', methods=['POST'])
def summarize():
    global cached_summary, cached_hash
    
    
    events = DetectionEvent.query.options(
        joinedload(DetectionEvent.images).joinedload(DetectionImage.metadatas)
    ).all()
    
    anomalyJson = []
    for event in events:
        anomalyList = []
        for image in event.images:
            anomalyList.extend([metadata.type.value for metadata in image.metadatas])
        anomalyList = sorted(anomalyList)
                        
        anomalyJson.append(
        {
            "anomalyTypes": anomalyList,
            "latitude": str(event.latitude),
            "longitude": str(event.longitude),
            "timestamp": event.timestamp.isoformat(),
            "street": event.street or "",
            "city": event.city or "",
            "state": event.state or "",
            "zipcode": event.zipcode or "",
        })
    json_string = json.dumps(anomalyJson, indent=2)  # `indent=2` for pretty print
    # print(json_string)
    
    # Create a hash of the current anomalyJson
    current_hash = hashlib.sha256(json.dumps(anomalyJson, sort_keys=True).encode('utf-8')).hexdigest()
    
    print("HASH A:", current_hash)
    print("HASH B:", cached_hash)

    # Check if summary already exists for this state
    if current_hash == cached_hash:
        print("Using cached summary", flush=True)
        return jsonify({"reply": cached_summary})
    
    print("Test", flush=True)
    from collections import Counter, defaultdict
    from datetime import datetime
    
    
    # Preprocessing summary
    type_counter = Counter()
    street_counter = Counter()
    time_list = []
    missing_streets = 0

    for item in anomalyJson:
        type_counter.update(item["anomalyTypes"])
        if not item["street"] or item["street"].strip() == "":
            missing_streets += 1
        else:
            street_counter[item["street"]] += 1
        time_list.append(datetime.fromisoformat(item["timestamp"]))

    time_list.sort()
    time_range = f"{time_list[0]} to {time_list[-1]}" if time_list else "N/A"

    # Compact summary
    summary = {
        "anomaly_counts": dict(type_counter),
        "top_streets": dict(street_counter.most_common(5)),
        "time_range": time_range,
        "missing_street_count": missing_streets,
        "total_reports": len(anomalyJson)
    }
    
    
    prompt = f"""
        You are an assistant analyzing urban anomaly detection reports. Here is the summarized data:

        - Anomaly counts: {summary["anomaly_counts"]}
        - Top streets by anomaly count: {summary["top_streets"]}
        - Time range of reports: {summary["time_range"]}
        - Missing street entries: {summary["missing_street_count"]}
        - Total number of reports: {summary["total_reports"]}

        generate a short summary with key patterns and findings (e.g., bullets or short paragraphs).
        """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[prompt],
        config=types.GenerateContentConfig(
            max_output_tokens=250,
        )
    )
    
    # Update cache
    cached_summary = response.text
    cached_hash = current_hash
    
    return jsonify({"reply": response.text})
    