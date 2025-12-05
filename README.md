<h1 align="center">MultiBrain-AI</h1>

<p align="center">
  Turning messy meetings into organized tasks, timelines, and ownership.
</p>

<p align="center">
  <img src="https://img.shields.io/github/last-commit/hannahjan06/MultiBrain-AI" alt="last commit">
  <img src="https://img.shields.io/github/languages/top/hannahjan06/MultiBrain-AI?color=2b7489&label=top%20language" alt="top language">
  <img src="https://img.shields.io/github/languages/count/hannahjan06/MultiBrain-AI?label=languages" alt="languages">
</p>

<p align="center">
  Built with the tools and technologies:
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/Python-3572A5?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Whisper-0b3d91?style=for-the-badge" alt="Whisper">
  <img src="https://img.shields.io/badge/Ollama-00A67E?style=for-the-badge" alt="Ollama">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
</p>

---

## 🧠 Overview

**MultiBrain-AI** is an AI-powered meeting management dashboard that turns raw meeting recordings or transcripts into structured tasks, assignments, and calendar events.

You can:

- Upload **audio recordings** or **transcript files**
- Let **Whisper** transcribe recordings
- Use **Ollama (LLaMA 2)** to extract actionable tasks as structured JSON
- Drag-and-drop / select tasks and assign them to employees
- Automatically send **email reminders** to assignees
- Manage events in a **calendar view**
- Track **workload, pending tasks, and completed tasks** per employee
- Filter and update task status directly from the dashboard

All of this is backed by a **Flask** app, **SQLite** database, and a clean dashboard UI.

---

## ✨ Core Features

### 1. 🗓 Event & Calendar Management
- Create events with:
  - Title
  - Date
  - Time
  - Category (e.g. meeting)
  - Description
- Events are stored in the backend (`Event` model) and exposed via:
  - `GET /api/events` – fetch all events
  - `POST /api/events` – create a new event
- Events are displayed on a **calendar view** in the dashboard so managers can see upcoming meetings and activities at a glance.

---

### 2. 🤖 Auto Task Extraction (Whisper + Ollama)

You can go to the **Auto Assign** page (`/auto_assign`) and:

- Upload either:
  - **Recording** (`.mp3`, `.wav`)
  - **Transcript** (`.txt`, `.pdf`, `.docx`)
- Select the file type (`recording` or `transcript`)

Then the app will:

1. **Transcribe** audio using `whisper` (for recording files)
2. **Analyse** the transcript using **Ollama** with a custom prompt:
   - Extracts tasks in the JSON format:
     ```json
     {
       "tasks": [
         {
           "id": "T1",
           "assignee": "John Doe",
           "assignee_confidence": 0.8,
           "description": "Follow up with client on proposal",
           "deadline": "2023-04-01",
           "source_quotes": ["Some quote from the transcript"]
         }
       ]
     }
     ```
3. Saves:
   - The **meeting** (`Meeting` model)
   - All AI-generated **tasks** (`Task` model)

These tasks are then available to be assigned and managed via the dashboard.

---

### 3. 👤 Employee Dashboard & Workload

The app includes an `Employee` model and an **Employees page** where you can:

- View all employees with:
  - Name
  - Role
  - Position
  - Email
  - Avatar
- See **per-employee stats**:
  - `total_pending_tasks`
  - `total_completed_tasks`
- Check tasks assigned to a specific employee via:
  - `GET /employees/<id>/tasks`

When the app boots for the first time, it automatically creates **dummy employees** and **dummy tasks** so the dashboard isn’t empty.

---

### 4. ✅ Task Management & Filtering

From the **Tasks page** (`/tasks_page`) you can:

- View **all tasks** from all meetings
- See:
  - Description
  - AI-suggested assignee and confidence
  - Deadline
  - Source quotes
  - Assigned employee
  - Status (pending / complete)
  - Meeting file name
- Filter tasks by **status** (pending / complete) in the UI
- Update task status via:
  - `PUT /tasks/<task_id>/status` with body:
    ```json
    {
      "status": "pending" | "complete"
    }
    ```

---

### 5. 📨 Email Notifications

For each meeting, once tasks are generated and assigned, the app can:

- Group tasks by employee
- Send them an email with:
  - List of tasks
  - Deadlines
  - Polite reminder message

Emails are sent using:

- `smtplib` + `ssl`
- Gmail’s SMTP (`smtp.gmail.com:465`)

You configure sender credentials via environment variables.

---

## 🏗 Tech Stack

- **Backend:** Flask
- **Database:** SQLite (`multibrain.db`) via SQLAlchemy
- **AI:**
  - OpenAI **Whisper** (local model) for audio transcription
  - **Ollama** running `llama2:latest` for task extraction
- **Email:** Gmail SMTP via `smtplib`
- **Others:** `requests`, `python-dotenv`, `whisper`, `Werkzeug` for file handling

---

## 📁 Project Structure (High-level)

*(Adjust to match your actual repo layout if needed)*

```bash
.
├── app.py                 # Main Flask app (the file shown above)
├── multibrain.db          # SQLite database (auto-created)
├── uploads/               # Uploaded files (audio / transcripts)
├── templates/
│   ├── dash.html          # Dashboard
│   ├── events.html        # Events calendar page
│   ├── tasks.html         # Tasks page
│   └── employee.html      # Employee page
├── static/                # CSS / JS / assets (if any)
├── requirements.txt
└── README.md
````

---

## ⚙️ Setup & Installation

### Clone the Repository

```bash
git clone https://github.com/hannahjan06/MultiBrain-AI.git
cd MultiBrain-AI
```

*(Update URL to your actual repo.)*

---

### Create & Activate Virtual Environment (Recommended)

```bash
python -m venv venv
source venv/bin/activate  # macOS / Linux
# or
venv\Scripts\activate     # Windows
```

---

### Install Python Dependencies

Make sure you have `requirements.txt` with:

```txt
Flask
Flask_SQLAlchemy
Werkzeug
requests
openai-whisper
python-dotenv
```

Then run:

```bash
pip install -r requirements.txt
```

> 💡 Depending on your system, `whisper` may also require `ffmpeg`.
> On most systems you can install it via your package manager (e.g., `brew install ffmpeg` on macOS).

---

### Install & Configure Ollama

This app uses **Ollama** locally to run `llama2`.

1. **Download Ollama**

   * Install Ollama from its official website for your OS.

2. **Start the Ollama server**

   Usually just running Ollama will start the local server at:

   ```text
   http://localhost:11434
   ```

3. **Pull the LLaMA 2 model**

   In your terminal:

   ```bash
   ollama pull llama2
   ```

4. **(Optional) Test the model**

   ```bash
   ollama run llama2
   ```

The Flask app expects to talk to Ollama at:

```text
POST http://localhost:11434/api/generate
```

with the model name:

```json
"model": "llama2:latest"
```

Make sure Ollama is running before you start the Flask app.

---

### Environment Variables (.env)

Create a `.env` file in the project root and add:

```env
UNIQUE_KEY=some_random_secret_key
EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

* `UNIQUE_KEY` – Flask secret key for sessions
* `EMAIL_ADDRESS` – Gmail address used to send task reminder emails
* `EMAIL_PASSWORD` – **App password**, not your regular login password
  (for Gmail you need to enable 2FA and create an app-specific password)

---

### Initialize the Database & Run the App

The app auto-creates tables and some dummy data on first run.

```bash
python app.py
```

You should see logs like:

* “Adding dummy employees…”
* “Dummy employees added.”
* “Adding dummy tasks for workload…”
* “Dummy tasks added.”

Then open:

```text
http://127.0.0.1:5000/
```

---

## Usage Flow

### Dashboard (`/`)

* Overview of the app
* Quick navigation to:

  * Events / Calendar
  * Employees
  * Tasks
  * Auto Assign (AI flow)

---

### Events Page (`/events`)

* View event calendar (backed by `/api/events`)
* Add new events via the UI (which call `POST /api/events`)
* Events stored in `Event` model with:

  * `title`, `date`, `time`, `category`, `description`

---

### Auto Assign (AI Task Extraction) (`/auto_assign`)

1. Go to the Auto Assign page.

2. Upload a file:

   * Meeting recording (`.mp3` / `.wav`)
   * Transcript (`.txt`, `.pdf`, `.docx`)

3. Select file type:

   * `recording` → audio is transcribed using Whisper
   * `transcript` → file is read directly

4. Backend:

   * Saves file to `/uploads`
   * Creates a `Meeting` row with:

     * `file_name`
     * `transcript`
   * Calls **Ollama** with a strict JSON prompt
   * Parses API response and saves each **Task** assigned to that meeting

5. In the UI:

   * You can see AI-suggested tasks and assignees.
   * You can confirm / change assignments (e.g., via drag-and-drop or select dropdowns).
   * Once assignments are saved, the backend updates `assigned_employee_id` for each `Task`.

6. Email reminders:

   * The app groups tasks by employee and sends them a summary email with their tasks and deadlines.

---

### Employees Page (`/employees_page`)

* View the list of employees with:

  * Name, role, position, email, avatar
* See **stats per employee**:

  * `total_pending_tasks`
  * `total_completed_tasks`
* Click into an employee to see all tasks assigned to them (via `GET /employees/<id>/tasks`).

---

### Tasks Page (`/tasks_page`)

* View all tasks in the system with:

  * Description
  * Status (pending / complete)
  * AI-assigned person + confidence
  * Deadline
  * Meeting file name
* Use filters in the UI to:

  * Show only **pending** tasks
  * Show only **completed** tasks
* Update task status via the UI (which calls `PUT /tasks/<id>/status`).

---

## 🔌 Key API Endpoints (Backend)

* `GET /` – Main dashboard
* `GET /events` – Events page
* `GET /tasks_page` – Tasks page
* `GET /employees_page` – Employees page
* `GET /auto_assign` – Auto assign UI

**Tasks**

* `POST /tasks` – Create new task manually
* `GET /tasks` – Get all tasks
* `PUT /tasks/<task_id>/status` – Update task status

**Employees**

* `GET /employees` – Get all employees with stats
* `POST /employees` – Create employee
* `GET /employees/<employee_id>/tasks` – Get one employee’s tasks

**Assignments**

* `GET /assignments` – Get all task + assignee info
* `POST /assignments` – Save manual task→employee assignments
* `GET /get_final_assignments` – Get assignments for current meeting (from session)

**Events**

* `GET /api/events` – Get all events
* `POST /api/events` – Create new event

---

## Development Notes

* Whisper is loaded as:

  ```python
  whisper_model = whisper.load_model("base", device="cpu")
  ```

  * CPU-only by default; change `device` if you have GPU.
* Some warnings are disabled:

  ```python
  warnings.filterwarnings("ignore", message="FP16 is not supported on CPU*")
  ```
* Uploaded files are stored under the `uploads/` folder (created if missing).

---

## Future Improvements

* Speaker diarization (who said what in the meeting)
* Richer analytics on the dashboard (per-team, per-project views)
* Multi-tenant support (multiple companies using one instance)
* Integration with external calendar APIs (Google Calendar, Outlook, etc.)
* Role-based access control (manager vs employee views)

---

## Credits

Built with way too much coffee, Python, and a dangerous amount of curiosity.
AI stack: **Whisper + Ollama (LLaMA 2)**.
Backend: **Flask + SQLite + SQLAlchemy**.
