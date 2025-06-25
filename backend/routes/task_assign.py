from flask import Blueprint, jsonify, request
from extensions import db
from mysql_models import Task, DetectionEvent, DetectionImage, DetectionMetadata, User, UserRole, VerificationStatus, ProgressStatus
from sqlalchemy.orm import joinedload
from sqlalchemy import and_
task_assign_bp = Blueprint('task_assign', __name__)


@task_assign_bp.route('/api/tasks', methods=['GET'])
def get_tasks():
    """
    Returns a paginated list of tasks with optional filters and sorting.

    Query Parameters:
    - page (int): Page number (default: 1)
    - per_page (int): Items per page (default: 10)
    - progress_status (str): Filter by task progress status
    - verification_status (str): Filter by task verification status
    - worker_id (int): Filter by assigned worker
    - sort (str): Sort field ('created_at', 'updated_at', 'scheduled_time')
    - order (str): Sort order ('asc' or 'desc')

    Returns:
    - JSON with task details, related metadata, image, and event info
    - Pagination info (page, per_page, total_pages, total_items)
    """
    
    #pagination
    page = request.args.get('page', default=1, type=int)
    per_page = request.args.get('per_page', default=10, type=int)

    # Filter parameters
    progress_status = request.args.get('progress_status')  
    verification_status = request.args.get('verification_status') 
    worker_id = request.args.get('worker_id', type=int)
    
    #sort and order
    sort_field = request.args.get('sort', 'created_at')
    sort_order = request.args.get('order', 'desc')  # default to descending

    
    query = Task.query.options(
        joinedload(Task.metadatas)
            .joinedload(DetectionMetadata.image)
            .joinedload(DetectionImage.event),
        joinedload(Task.worker)
    )
    
    #filter option lists
    filters = []

    if verification_status:
        try:
            filters.append(Task.verification_status == VerificationStatus[verification_status])
        except KeyError:
            return jsonify({"error": f"Invalid status: {verification_status}"}), 400
        
    if progress_status:
        try:
            filters.append(Task.progress_status == ProgressStatus[progress_status])
        except KeyError:
            return jsonify({"error": f"Invalid status: {progress_status}"}), 400

    if worker_id is not None:
        filters.append(Task.worker_id == worker_id)

    if filters:
        query = query.filter(and_(*filters))
    
    
    sortable_fields = {
        'created_at': Task.created_at,
        'updated_at': Task.updated_at,
        'scheduled_time': Task.scheduled_time
    }
    
    #sort option list
    if sort_field not in sortable_fields:
        return jsonify({"error": f"Cannot sort by: {sort_field}"}), 400
    
    sort_column = sortable_fields[sort_field]
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    elif sort_order == 'desc':
        query = query.order_by(sort_column.desc())
    else:
        return jsonify({"error": "Invalid order: must be 'asc' or 'desc'"}), 400
        
    paginated_tasks = query.paginate(page=page, per_page=per_page, error_out=False)
    
    def serialize_task(task):
        
        metadata = task.metadatas
        image = metadata.image
        event = image.event

        return {
            "task_id": task.id,
            "verification_status": task.verification_status.value,
            "progress_status": task.progress_status.value,
            "notes": task.notes,
            "scheduled_time": task.scheduled_time.isoformat() if task.scheduled_time else None,
            "created_at": task.created_at.isoformat(),
            "updated_at": task.updated_at.isoformat() if task.updated_at else None,
            "worker_id": task.worker_id,
            "worker_first_name": task.worker.first_name if task.worker else None,
            "worker_last_name": task.worker.last_name if task.worker else None,

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
                "id": metadata.id,
                "X1_loc": metadata.X1_loc,
                "Y1_loc": metadata.Y1_loc,
                "X2_loc": metadata.X2_loc,
                "Y2_loc": metadata.Y2_loc,
                "label": metadata.label,
                "score": metadata.score,
                "type": metadata.type.value
            }
        }
            
    return jsonify({
        "tasks": [serialize_task(task) for task in paginated_tasks.items],
        "pagination": {
            "page": paginated_tasks.page,
            "per_page": paginated_tasks.per_page,
            "total_pages": paginated_tasks.pages,
            "total_items": paginated_tasks.total
        }
    })


@task_assign_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
def modify_task(task_id):
    """
    Updates fields of a specific task.

    Path Parameters:
    - task_id (int): ID of the task to update

    JSON Body (at least one of the following):
    - verification_status (str): New verification status
    - progress_status (str): New progress status
    - worker_id (int): New worker ID

    Returns:
    - JSON with success message and task ID
    - 400 if invalid input
    - 404 if task or worker not found
    """
    
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": f"Task with id {task_id} not found"}), 404

    # Update allowed fields
    if "verification_status" in data:
        try:
            task.verification_status = VerificationStatus[data["verification_status"]]
        except KeyError:
            return jsonify({"error": f"Invalid verification_status: {data['verification_status']}"}), 400
    
        # Update allowed fields
    if "progress_status" in data:
        try:
            task.progress_status = VerificationStatus[data["progress_status"]]
        except KeyError:
            return jsonify({"error": f"Invalid progress_status: {data['progress_status']}"}), 400

    if "worker_id" in data:
        # Optional: validate if the user exists
        worker = User.query.get(data["worker_id"])
        if not worker:
            return jsonify({"error": f"Worker with id {data['worker_id']} not found"}), 404
        task.worker_id = data["worker_id"]
    
    db.session.commit()
    return jsonify({"message": "Task updated successfully", "task_id": task.id})


@task_assign_bp.route('/api/tasks/bulk', methods=['PUT'])
def modify_multiple_tasks():
    """
    Bulk update multiple tasks.

    JSON Body (list of task update objects):
    [
        {
            "task_id": int,                       # Required
            "verification_status": str,           # Optional
            "progress_status": str,               # Optional
            "worker_id": int                      # Optional
        },
        ...
    ]

    Returns:
    - JSON with summary of successes and errors per task
    - 400 if input is invalid
    """
    data = request.get_json()
    if not data or not isinstance(data, list):
        return jsonify({"error": "Input must be a list of task updates"}), 400

    results = []

    for item in data:
        result = {"task_id": item.get("task_id")}
        
        task_id = item.get("task_id")
        if not task_id:
            result["error"] = "Missing task_id"
            results.append(result)
            continue

        task = Task.query.get(task_id)
        if not task:
            result["error"] = f"Task with id {task_id} not found"
            results.append(result)
            continue

        # Process verification_status
        if "verification_status" in item:
            try:
                task.verification_status = VerificationStatus[item["verification_status"]]
            except KeyError:
                result["error"] = f"Invalid verification_status: {item['verification_status']}"
                results.append(result)
                continue

        # Process progress_status
        if "progress_status" in item:
            try:
                task.progress_status = ProgressStatus[item["progress_status"]]  # Fixed typo
            except KeyError:
                result["error"] = f"Invalid progress_status: {item['progress_status']}"
                results.append(result)
                continue

        # Process worker_id
        if "worker_id" in item:
            worker = User.query.get(item["worker_id"])
            if not worker:
                result["error"] = f"Worker with id {item['worker_id']} not found"
                results.append(result)
                continue
            task.worker_id = item["worker_id"]

        result["message"] = "Task updated successfully"
        results.append(result)

    db.session.commit()
    return jsonify(results), 200


@task_assign_bp.route('/api/tasks/getWorkers', methods=['GET'])
def get_workers():
    workers = User.query.filter_by(role=UserRole.worker).all()
    def serialize_user(user):
        return {
            'id': user.id,
            'firstName': user.first_name,
            'lastName': user.last_name,
        }
        
    return jsonify([serialize_user(worker) for worker in workers])