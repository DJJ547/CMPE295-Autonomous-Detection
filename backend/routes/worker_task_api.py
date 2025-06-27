from flask import Blueprint, jsonify, request
from extensions import db
from mysql_models import Task, DetectionEvent, DetectionImage, DetectionMetadata, User, UserRole, VerificationStatus, ProgressStatus
from datetime import datetime, timezone
from sqlalchemy.orm import joinedload
from sqlalchemy import and_

worker_task_bp = Blueprint('worker_task', __name__)


@worker_task_bp.route('/api/getAssignedTasks', methods=['GET'])
def get_assigned_tasks():
    try:
        user_id = request.args.get('user_id', type=int)
        if user_id is None:
            return jsonify({"error": "Missing user_id parameter"}), 400

        # eager-load the metadata relationship so you can read X1_loc etc.
        tasks = (
            db.session.query(Task)
            .options(joinedload(Task.metadatas))
            .filter(Task.worker_id == user_id)
            .all()
        )

        def serialize_task(task):
            metadata = task.metadatas
            image = metadata.image
            event = image.event
            return {
                "task_id": task.id,
                "metadata_id": metadata.id,
                "worker_id": task.worker_id,
                "verification_status": task.verification_status.name,
                "progress_status": task.progress_status.name,
                "notes": task.notes,
                "scheduled_time": task.scheduled_time.isoformat() if task.scheduled_time else None,
                "created_at": task.created_at.isoformat() if task.created_at else None,
                "updated_at": task.updated_at.isoformat() if task.updated_at else None,
                "metadata_summary": getattr(task.metadatas, "summary", None),
                "worker_name": getattr(task.worker, "name", None),

                # Image fields
                "image_id": image.id,
                "image_url": image.image_url,
                "direction": image.direction.value,

                # Event fields
                "event_id": event.id,
                "latitude": float(event.latitude),
                "longitude": float(event.longitude),
                "timestamp": event.timestamp.isoformat(),
                "street": event.street,
                "city": event.city,
                "state": event.state,
                "zipcode": event.zipcode,

                # Metadata fields
                "label": metadata.label,
                "type": metadata.type.value,
                
                "metadata": {
                    "id":          metadata.id,
                    "X1_loc":      metadata.X1_loc,
                    "Y1_loc":      metadata.Y1_loc,
                    "X2_loc":      metadata.X2_loc,
                    "Y2_loc":      metadata.Y2_loc,
                    "label":       metadata.label,
                    "score":       metadata.score,
                    "type":        metadata.type.name,
                },
            }

        return jsonify({"tasks": [serialize_task(t) for t in tasks]}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    
@worker_task_bp.route('/api/startTasks', methods=['POST'])
def start_assigned_tasks():
    try:
        data = request.get_json()
        task_ids = data.get('task_ids', [])
        user_id = data.get('user_id')

        if not task_ids or user_id is None:
            return jsonify({"error": "Missing task_ids or user_id"}), 400

        tasks = Task.query.filter(
            Task.id.in_(task_ids),
            Task.worker_id == user_id
        ).all()

        if not tasks:
            return jsonify({"error": "No tasks found for given user"}), 404

        updated_tasks = []
        already_in_progress = []

        for task in tasks:
            if task.progress_status == ProgressStatus.in_progress:
                already_in_progress.append(task.id)
                continue

            task.progress_status = ProgressStatus.in_progress
            task.updated_at = datetime.now(timezone.utc)
            updated_tasks.append(task.id)

        db.session.commit()

        return jsonify({
            "message": f"{len(updated_tasks)} task(s) marked as in_progress.",
            "updated_task_ids": updated_tasks,
            "skipped_task_ids": already_in_progress,
            "note": "Skipped tasks were already in progress."
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@worker_task_bp.route('/api/completeTasks', methods=['POST'])
def complete_started_tasks():
    try:
        data = request.get_json()
        task_ids = data.get('task_ids', [])
        user_id = data.get('user_id')

        if not task_ids or user_id is None:
            return jsonify({"error": "Missing task_ids or user_id"}), 400

        tasks = Task.query.filter(
            Task.id.in_(task_ids),
            Task.worker_id == user_id
        ).all()

        if not tasks:
            return jsonify({"error": "No tasks found for given user"}), 404

        updated_tasks = []
        already_completed = []

        for task in tasks:
            if task.progress_status == ProgressStatus.completed:
                already_completed.append(task.id)
                continue

            task.progress_status = ProgressStatus.completed
            task.updated_at = datetime.now(timezone.utc)
            updated_tasks.append(task.id)

        db.session.commit()

        return jsonify({
            "message": f"{len(updated_tasks)} task(s) marked as completed.",
            "updated_task_ids": updated_tasks,
            "skipped_task_ids": already_completed,
            "note": "Skipped tasks were already completed."
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    