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

app.config['SECRET_KEY'] = os.getenv('UNIQUE_KEY', 'default_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///multibrain.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

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

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255))
    position = db.Column(db.String(120))
    email = db.Column(db.String(255))

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
            'total_pending_tasks': pending,
            'total_completed_tasks': completed,
        }

def allowed_filename(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def transcribe_audio(file_path):
    result = whisper_model.transcribe(file_path)
    return result.get('text', '').strip()

def is_audio_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'mp3', 'wav'}

def is_text_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'txt', 'pdf', 'docx'}

@app.route('/', methods=['GET'])
def dashboard():
    return render_template('dash.html')

@app.route('/employees_page', methods=['GET'])
def employees_page():
    return render_template('employee.html')

@app.route('/auto_assign', methods=['GET'])
def auto_assign():
    return render_template('index.html')

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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()

        if Employee.query.count() == 0:
            print("Adding dummy employees...")
            employee1 = Employee(name="John Doe", role="Manager", email="john@example.com")
            employee2 = Employee(name="Jane Smith", role="Developer", email="jane@example.com")
            employee3 = Employee(name="Peter Jones", role="Designer", email="peter@example.com")
            employee4 = Employee(name="Alice Brown", role="Marketing", email="alice@example.com")
            employee5 = Employee(name="Robert Green", role="Sales", email="robert@example.com")
            db.session.add_all([employee1, employee2, employee3, employee4, employee5])
            db.session.commit()
            print("Dummy employees added.") 

    app.run(debug=True)