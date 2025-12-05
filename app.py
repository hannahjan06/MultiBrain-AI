import smtplib
import ssl
from email.message import EmailMessage
from collections import defaultdict
import os
from flask import Flask, jsonify, render_template, request, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import requests
import json
import whisper
import warnings
import dotenv
dotenv.load_dotenv()
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU*")

app = Flask(__name__)
db = SQLAlchemy(app)

app.config['SECRET_KEY'] = os.getenv('UNIQUE_KEY', 'default_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///multibrain.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

OLLAMA_PROMPT_TEMPLATE = """
You are given a meeting transcript:

\"\"\"{transcript}\"\"\"

Extract ONLY the actionable tasks and return them as valid JSON in this exact shape:

{{
  "tasks": [
    {{
      "id": "string",
      "assignee": "string|null",
      "assignee_confidence": "number",
      "description": "string",
      "deadline": "string|null",
      "source_quotes": ["string"]
    }}
  ]
}}

- A task = something someone should do in the future.
- Use null when assignee or deadline is not clearly specified.
- Use IDs like "T1", "T2", "T3", in order.
- Respond ONLY with JSON, no extra text.
- Action items must be realistic based on professional meetings.
- Ignore fictional or literary content.
"""
whisper_model = whisper.load_model("base", device="cpu")

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'txt', 'pdf', 'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

class Meeting(db.Model):
    __tablename__ = 'meetings'
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255))
    transcript = db.Column(db.Text)
    
    tasks = db.relationship('Task', backref='meeting', lazy=True)

class Task(db.Model):
    __tablename__ = 'tasks'
    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey('meetings.id'), nullable=False)
    description = db.Column(db.Text)
    ai_assignee = db.Column(db.String(120), nullable=True)
    ai_assignee_confidence = db.Column(db.Float, nullable=True)
    deadline = db.Column(db.String(120), nullable=True) 
    source_quotes = db.Column(db.Text, nullable=True)
    assigned_employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    status = db.Column(db.String(20), nullable=False, default='pending')

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    time = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(20), nullable=False, default='meeting')
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'date': self.date,
            'time': self.time,
            'category': self.category,
            'description': self.description
        }

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255))
    position = db.Column(db.String(120))
    email = db.Column(db.String(255))
    avatar = db.Column(db.String(255), nullable=True)

    tasks = db.relationship('Task', backref='assigned_employee', lazy=True)

    def to_dict_with_stats(self):
        pending = 0
        completed = 0

        for t in self.tasks:
            if t.status == 'pending':
                pending += 1
            elif t.status == 'complete':
                completed += 1
            else:
                print(f"Warning: Task with unknown status '{t.status}' for task ID {t.id}")
        
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role,
            'position': self.position,
            'email': self.email,
            'avatar': self.avatar,
            'total_pending_tasks': pending,
            'total_completed_tasks': completed,
        }

def send_email(to_address, subject, body):
    msg = EmailMessage()
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to_address
    msg['Subject'] = subject
    msg.set_content(body)

    stmp_server = "smtp.gmail.com"
    port = 465

    context = ssl.create_default_context()

    with smtplib.SMTP_SSL(stmp_server, port, context=context) as server:
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.send_message(msg)

def allowed_filename(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def transcribe_audio(file_path):
    result = whisper_model.transcribe(file_path)
    return result.get('text', '').strip()

def is_audio_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'mp3', 'wav'}

def is_text_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'txt', 'pdf', 'docx'}

def analyse_transcipt(text):
    prompt = OLLAMA_PROMPT_TEMPLATE.format(transcript=text)

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "llama2:latest",
            "prompt": prompt,
            "stream": False  
        },
        timeout = 120
    )

    response.raise_for_status()
    raw = response.json()

    print("Completed response")

    model_text = raw.get("response", "")
    try:
        parsed = json.loads(model_text)
    except json.JSONDecodeError:
        raise ValueError("Model did not return valid JSON")

    return parsed

def send_task_emails_for_meeting(meeting, tasks):
    employees = Employee.query.all()
    employees_by_name = {e.name.lower(): e for e in employees}

    tasks_by_employee = defaultdict(list)

    for task in tasks:
        if not task.ai_assignee:
            continue

        emp = employees_by_name.get(task.ai_assignee.lower())
        if not emp or not emp.email:
            continue

        tasks_by_employee[emp].append(task)

    for emp, emp_tasks in tasks_by_employee.items():
        lines = [
            f"Hi {emp.name},",
            "",
            "This is to remind you of the tasks assigned to you from the recent meeting:",
            "",
        ]
        for t in emp_tasks:
            lines.append(
                f"- {t.description} (Deadline: {t.deadline or 'Not specified'})"
            )
        lines.append("")
        lines.append("Please make sure to complete these on time.")
        lines.append("")
        lines.append("Best,")
        lines.append("Your Meeting Assistant")

        body = "\n".join(lines)

        send_email(
            to_address=emp.email,
            subject="Meeting Task Reminder",
            body=body
        )

@app.route('/', methods=['GET'])
def dashboard():
    return render_template('dash.html')

@app.route('/tasks_page', methods=['GET'])
def tasks_page():
    return render_template('tasks.html')

@app.route('/employees_page', methods=['GET'])
def employees_page():
    return render_template('employee.html')

@app.route('/auto_assign', methods=['GET'])
def auto_assign():
    return render_template('index.html')

@app.route('/events', methods=['GET'])
def events():
    return render_template('events.html')

@app.route('/tasks', methods=['POST'])
def add_new_task():
    data = request.json
    
    description = data.get('description')
    deadline = data.get('deadline')
    assigned_employee_id = data.get('assigned_employee_id')

    if not description:
        return jsonify({'success': False, 'message': 'Task description is required'}), 400

    new_task = Task(
        description=description,
        deadline=deadline,
        assigned_employee_id=assigned_employee_id,
        status='pending',
        meeting_id=1
    )
    
    db.session.add(new_task)
    try:
        db.session.commit()
        return jsonify({
            'id': new_task.id,
            'description': new_task.description,
            'deadline': new_task.deadline,
            'status': new_task.status,
            'assigned_employee_id': new_task.assigned_employee_id,
            'meeting_file_name': new_task.meeting.file_name if new_task.meeting else None
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding new task: {e}")
        return jsonify({'success': False, 'message': 'Failed to add new task to database'}), 500

@app.route('/tasks/<int:task_id>/status', methods=['PUT'])
def update_task_status(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found'}), 404
    
    data = request.json
    new_status = data.get('status')

    if new_status not in ['pending', 'complete']:
        return jsonify({'success': False, 'message': 'Invalid status provided'}), 400
    
    task.status = new_status
    try:
        db.session.commit()
        return jsonify({
            'id': task.id,
            'description': task.description,
            'status': task.status,
            'deadline': task.deadline,
            'assigned_employee_id': task.assigned_employee_id
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating task status: {e}")
        return jsonify({'success': False, 'message': 'Failed to update task status in database'}), 500

@app.route('/tasks', methods=['GET'])
def get_all_tasks():
    tasks = Task.query.all()
    tasks_data = []
    for task in tasks:
        employee_name = None
        if task.assigned_employee_id:
            employee = Employee.query.get(task.assigned_employee_id)
            if employee:
                employee_name = employee.name

        tasks_data.append({
            'id': task.id,
            'description': task.description,
            'ai_assignee': task.ai_assignee,
            'ai_assignee_confidence': task.ai_assignee_confidence,
            'deadline': task.deadline,
            'source_quotes': json.loads(task.source_quotes or '[]'),
            'assigned_employee_id': task.assigned_employee_id,
            'assigned_employee_name': employee_name,
            'status': task.status,
            'meeting_id': task.meeting_id,
            'meeting_file_name': task.meeting.file_name if task.meeting else None
        })
    return jsonify(tasks_data), 200

@app.route('/auto_assign', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file in request'}), 400
    
    file = request.files['file']

    if file.filename == '': 
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    if not allowed_filename(file.filename):
        return jsonify({'success': False, 'message': 'File type not supported'}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    print("Saved file:", file_path, "size:", os.path.getsize(file_path))

    file_type = request.form.get('fileType')

    if file_type is None or file_type == '':
        return jsonify({'success': False, 'message': 'No file type selected'}), 400

    transcript_text = None
    analysis_json = None

    print("loaded file type:", file_type)

    if file_type == 'transcript':
        file_info = 'Transcript File'
        if not is_text_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'You selected "transcript" but file is not a text type'
            }), 400
        
        with open(file_path, 'r', encoding='utf-8') as f:
            transcript_text = f.read()
        
        try:
            analysis_json = analyse_transcipt(transcript_text)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error during analysis: {str(e)}'
            }), 500
    elif file_type == 'recording':
        file_info = 'Recording File'

        if not is_audio_file(file.filename):
            return jsonify({
                'success': False,
                'message': 'You selected "recording" but file is not an audio type'
            }), 400
        
        try:
            transcript_text = transcribe_audio(file_path)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error during transcription: {str(e)}'
            }), 500

        try:
            analysis_json = analyse_transcipt(transcript_text)
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Error during analysis: {str(e)}'
            }), 500
        print("Analysis JSON:", analysis_json)
        
    else:
        return jsonify({'success': False, 'message': 'Invalid fileType value'}), 400
    
    meeting = Meeting(
        file_name=filename,
        transcript=transcript_text
    )
    db.session.add(meeting)
    db.session.flush()

    session['current_meeting_id'] = meeting.id

    tasks_from_ai = analysis_json.get('tasks', [])
    saved_tasks = []

    for t in tasks_from_ai:
        task = Task(
            meeting_id=meeting.id,
            description=t.get('description'),
            ai_assignee=t.get('assignee'),
            ai_assignee_confidence=t.get('assignee_confidence'),
            deadline=t.get('deadline'),
            source_quotes=json.dumps(t.get('source_quotes', []))
        )
        db.session.add(task)
        saved_tasks.append(task)
    
    db.session.commit()

    tasks_response = [
        {
            'id': task.id,
            'description': task.description,
            'deadline': task.deadline,
            'ai_assignee': task.ai_assignee,
            'ai_assignee_confidence': task.ai_assignee_confidence,
            'source_quotes': json.loads(task.source_quotes or '[]'),
            'assigned_employee_id': task.assigned_employee_id
        }
        for task in saved_tasks
    ]

    try:
        send_task_emails_for_meeting(meeting, saved_tasks)
    except Exception as e:
        print("Error sending task emails:", e)

    return jsonify({
        'success': True,
        'message': 'File uploaded successfully',
        'filename': filename,
        'saved_path': file_path,
        'file_type': file_info,
        'transcript': transcript_text,
        'analysis': analysis_json,
        'tasks': tasks_response
    }), 200

@app.route('/employees', methods=['GET'])
def get_employees():
    employees = Employee.query.all()
    return jsonify([e.to_dict_with_stats() for e in employees]), 200


@app.route('/employees', methods=['POST'])
def employees():
    data = request.json
    try:
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': 'Invalid JSON data'}), 400
    
    try:
        name = data.get('name')
        role = data.get('role')
        position = data.get('position')
        email = data.get('email')
    except Exception as e:
        return jsonify({'success': False, 'message': 'Missing required employee field'}), 400

    new_employee = Employee(name=name, role=role, position=position, email=email)

    db.session.add(new_employee)
    db.session.commit()

    return jsonify(new_employee.to_dict_with_stats()), 201

@app.route('/employees/<int:employee_id>/tasks', methods=['GET'])
def get_employee_tasks(employee_id):
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({'message': 'Employee not found'}), 404

    tasks = []
    for task in employee.tasks:
        tasks.append({
            'id': task.id,
            'description': task.description,
            'deadline': task.deadline,
            'status': task.status,
            'meeting_id': task.meeting_id,
            'meeting_file_name': task.meeting.file_name if task.meeting else 'N/A'
        })
    return jsonify(tasks), 200

@app.route('/assignments', methods=['GET'])
def assignments():
    tasks = Task.query.all()
    assignments = []
    for task in tasks:
        assignee_name = None
        assignee_avatar = None
        if task.assigned_employee_id:
            employee = Employee.query.get(task.assigned_employee_id)
            if employee:
                assignee_name = employee.name
                assignee_avatar = f"https://i.pravatar.cc/150?img={(employee.id % 70) + 1}"
        elif task.ai_assignee:
            assignee_name = task.ai_assignee + ' (AI Suggestion)'
            assignee_avatar = f"https://i.pravatar.cc/150?img={(task.id % 70) + 20}"
    
        assignments.append({
        'id': task.id,
        'meeting_id': task.meeting_id,
        'description': task.description,
        'ai_assignee': task.ai_assignee,
        'ai_assignee_confidence': task.ai_assignee_confidence,
        'deadline': task.deadline,
        'source_quotes': json.loads(task.source_quotes or '[]'),
        'assigned_employee_id': task.assigned_employee_id,
        'status': task.status,
        'assignee_name': assignee_name,
        'assignee_avatar': assignee_avatar
    })
    
    return jsonify(assignments), 200

@app.route('/assignments', methods=['POST'])
def save_assignments():
    data = request.json
    assignments = data.get('assignments', {})

    if not isinstance(assignments, dict):
        return jsonify({'success': False, 'error': 'Invalid assignments format'}), 400
    
    try:
        for task_id_str, employee_id_str in assignments.items():
            try:
                task_id = int(task_id_str)
                employee_id = int(employee_id_str)
            except ValueError:
                print(f"Warning: Could not convert task_id_str='{task_id_str}' or employee_id_str='{employee_id_str}' to int. Skipping.")
                continue
            
            task = Task.query.get(task_id)
            if not task:
                print(f"Warning: Task with ID {task_id} not found. Skipping assignment.")
                continue

            employee = Employee.query.get(employee_id)
            if not employee:
                print(f"Warning: Employee with ID {employee_id} not found. Skipping assignment for task {task_id}.")
                continue

            task.assigned_employee_id = employee_id
        
        db.session.commit()
        return jsonify({'success': True}), 200
    except Exception as e:
        db.session.rollback()
        print('Error saving assignments:', e)
        return jsonify({'success': False, 'error': 'Server error while saving assignments'}), 500
    
@app.route('/get_final_assignments', methods=['GET'])
def get_final_assignments():
    current_meeting_id = session.get('current_meeting_id')
    if not current_meeting_id:
        return jsonify({'error': 'No active meeting ID found in session. Please upload a file first.'}), 400

    tasks = Task.query.filter_by(meeting_id=current_meeting_id).all()

    final_assignments = []
    for task in tasks:
        assignee_info = None
        if task.assigned_employee_id:
            employee = Employee.query.get(task.assigned_employee_id)
            if employee:
                assignee_info = {'id': employee.id, 'name': employee.name, 'role': employee.role}
        elif task.ai_assignee:
            assignee_info = {'name': task.ai_assignee, 'ai_suggestion': True}

        final_assignments.append({
            'id': task.id,
            'description': task.description,
            'deadline': task.deadline,
            'ai_assignee': task.ai_assignee,
            'assigned_employee_id': task.assigned_employee_id,
            'assignee': assignee_info
        })

    return jsonify(final_assignments)

@app.route('/api/events', methods=['GET'])
def get_events():
    events = Event.query.all()
    return jsonify([event.to_dict() for event in events]), 200

@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.json

    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    try:
        title = data.get('title')
        date = data.get('date')
        time = data.get('time')
        category = data.get('category')
        description = data.get('description')
    except Exception as e:
        jsonify({'success': False, 'message': 'Missing required event field'}), 400
    
    new_event = Event(title=title, date=date, time=time, category=category, description=description)
    db.session.add(new_event)

    try:
        db.session.commit()
        return jsonify(new_event.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding event: {e}")
        return jsonify({'success': False, 'message': 'Failed to add event to database'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

        if Employee.query.count() == 0:
            print("Adding dummy employees...")
            employee1 = Employee(name="John Doe", role="UI/UX Designer", position="Designer",  email="john@example.com", avatar="https://i.pravatar.cc/150?img=1")
            employee2 = Employee(name="Jane Smith", role="iOS Developer", position="Developer", email="jane@example.com", avatar="https://i.pravatar.cc/150?img=7")
            employee3 = Employee(name="Peter Jones", role="Copywriter", position="Copywriter", email="peter@example.com", avatar="https://i.pravatar.cc/150?img=3")
            employee4 = Employee(name="Alice Brown", role="Marketing", email="alice@example.com", avatar="https://i.pravatar.cc/150?img=4")
            employee5 = Employee(name="Robert Green", role="Sales", email="robert@example.com", avatar="https://i.pravatar.cc/150?img=5")
            db.session.add_all([employee1, employee2, employee3, employee4, employee5])
            db.session.commit()
            print("Dummy employees added.")

        if Task.query.count() == 0:
            print("Adding dummy tasks for workload...")
            meeting1 = Meeting(file_name="Meeting_Alpha.mp3", transcript="Transcript for Alpha meeting.")
            meeting2 = Meeting(file_name="Meeting_Beta.mp3", transcript="Transcript for Beta meeting.")
            db.session.add_all([meeting1, meeting2])
            db.session.flush()

            task1 = Task(meeting_id=meeting1.id, description="Design landing page mockups", ai_assignee="John Doe", deadline="2023-03-28", assigned_employee_id=1, status="pending")
            task2 = Task(meeting_id=meeting1.id, description="Review user flows", ai_assignee="John Doe", deadline="2023-03-29", assigned_employee_id=1, status="pending")
            task3 = Task(meeting_id=meeting2.id, description="Create design system components", ai_assignee="John Doe", deadline="2023-03-30", assigned_employee_id=1, status="complete")

            task4 = Task(meeting_id=meeting1.id, description="Develop iOS login screen", ai_assignee="Jane Smith", deadline="2023-03-27", assigned_employee_id=2, status="pending")
            task5 = Task(meeting_id=meeting2.id, description="Implement push notifications", ai_assignee="Jane Smith", deadline="2023-04-01", assigned_employee_id=2, status="pending")

            task6 = Task(meeting_id=meeting1.id, description="Write website copy", ai_assignee="Peter Jones", deadline="2023-03-28", assigned_employee_id=3, status="complete")
            task7 = Task(meeting_id=meeting2.id, description="Proofread marketing materials", ai_assignee="Peter Jones", deadline="2023-03-29", assigned_employee_id=3, status="pending")
            
            db.session.add_all([task1, task2, task3, task4, task5, task6, task7])
            db.session.commit()
            print("Dummy tasks added.")
    app.run(debug=True)