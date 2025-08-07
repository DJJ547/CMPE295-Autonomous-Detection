from flask import Blueprint, jsonify, request
from extensions import db
from mysql_models import Task, DetectionEvent, DetectionImage, DetectionMetadata, User, UserRole, Status
from sqlalchemy.orm import joinedload
from sqlalchemy import and_
staff_task_bp = Blueprint('staff_task', __name__)


@staff_task_bp.route('/api/tasks', methods=['GET'])
def get_tasks():
    """
    Returns a paginated list of tasks with optional filters and sorting.

    Query Parameters:
    - page (int): Page number (default: 1)
    - per_page (int): Items per page (default: 10)
    - status (str): Filter by task status
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
    status = request.args.get('status')
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

    if status:
        try:
            filters.append(Task.status == Status[status])
        except KeyError:
            return jsonify({"error": f"Invalid status: {status}"}), 400

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
            "status": task.status.value,
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
                "type": metadata.type.value,
                "caption": metadata.caption
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


@staff_task_bp.route('/api/tasks/<int:task_id>', methods=['PUT'])
def modify_task(task_id):
    """
    Updates fields of a specific task.

    Path Parameters:
    - task_id (int): ID of the task to update

    JSON Body (at least one of the following):
    - status (str): New status
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
    if "status" in data:
        try:
            task.status = Status[data["status"]]
        except KeyError:
            return jsonify({"error": f"Invalid status: {data['status']}"}), 400

    if "worker_id" in data:
        # Optional: validate if the user exists
        worker = User.query.get(data["worker_id"])
        if not worker:
            return jsonify({"error": f"Worker with id {data['worker_id']} not found"}), 404
        task.worker_id = data["worker_id"]
    
    db.session.commit()
    return jsonify({"message": "Task updated successfully", "task_id": task.id})


@staff_task_bp.route('/api/tasks/bulk', methods=['PUT'])
def modify_multiple_tasks():
    """
    Bulk update multiple tasks.

    JSON Body (list of task update objects):
    [
        {
            "task_id": int,                       # Required
            "status": str,                        # Optional
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

        if "status" in item:
            try:
                task.status = Status[item["status"]]
            except KeyError:
                result["error"] = f"Invalid status: {item['status']}"
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


@staff_task_bp.route('/api/tasks/getWorkers', methods=['GET'])
def get_workers():
    workers = User.query.filter_by(role=UserRole.worker).all()
    def serialize_user(user):
        return {
            'id': user.id,
            'firstName': user.first_name,
            'lastName': user.last_name,
        }
        
    return jsonify([serialize_user(worker) for worker in workers])


@staff_task_bp.route('/api/tasks/<int:task_id>/label', methods=['PUT'])
def update_task_label(task_id):
    """
    Allows staff to manually update the detected label for a task.

    Path Parameters:
    - task_id (int): ID of the task to update.

    JSON Body:
    - label (str): New label to assign.

    Returns:
    - JSON with success message and updated label.
    - 400 if invalid input.
    - 404 if task or metadata not found.
    """
    data = request.get_json()
    if not data or "label" not in data:
        return jsonify({"error": "Missing label field"}), 400

    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": f"Task with id {task_id} not found"}), 404

    # Assuming each Task has exactly one metadata entry
    metadata = task.metadatas
    if not metadata:
        return jsonify({"error": f"No metadata found for task {task_id}"}), 404

    metadata.label = data["label"]
    db.session.commit()

    return jsonify({"message": "Label updated successfully", "task_id": task.id, "new_label": metadata.label}), 200
