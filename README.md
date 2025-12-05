<h1 align="center">MULTIBRAIN-AI</h1>

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

## Overview

**MULTIBRAIN-AI** is an AI-powered meeting and workload dashboard.  
It turns meeting recordings or transcripts into structured tasks, assigns them to employees, syncs events to a calendar, and notifies the right people by email.

You can:

- Add **events** and see them in a calendar-style view.
- Upload **audio recordings** or **transcripts** from meetings.
- Let **Whisper** transcribe recordings.
- Use **Ollama (LLaMA 2)** to extract actionable tasks.
- Assign tasks to employees from the UI.
- Track each employee’s **pending vs completed tasks**.
- Filter and update task status.
- Automatically send:
  - notification emails to the **whole team** when a new event is added,
  - reminder emails to the **specific assignee** when tasks are created.

---

## Features

### Event & Calendar Management
- Create events with title, date, time, category and description.
- Events are stored in the backend and rendered in the calendar view (`events.html`).
- Every new event can trigger an email notification so the full team knows what’s coming up.

### AI Task Extraction (Whisper + Ollama)
- Upload either:
  - a **recording** (`.mp3`, `.wav`) or  
  - a **transcript** (`.txt`, `.pdf`, `.docx`).
- Whisper is used to transcribe audio files.
- The transcript is sent to **Ollama** with a strict JSON prompt.
- Ollama returns a list of tasks with:
  - description  
  - suggested assignee + confidence  
  - deadline  
  - source quotes
- Tasks are stored in SQLite (`Task` + `Meeting` models).

### Employee & Workload View
- Employee list with name, role, position, email, avatar.
- For each employee you can see:
  - total pending tasks  
  - total completed tasks  
- You can view all tasks for a specific employee.

### Task Management & Filters
- See all tasks in the **Tasks** page with:
  - description  
  - status (pending / complete)  
  - AI-assignee + confidence  
  - deadline  
  - linked meeting file
- Filter tasks by status (pending / complete).
- Change status from the UI (calls `PUT /tasks/<id>/status`).

### Email Notifications
- For AI-generated tasks, the app groups tasks by assignee and sends them a reminder email with:
  - task list  
  - deadlines  
  - short message.
- When you create new events, you can notify the whole team so they don’t miss any important meeting.
- Uses Gmail SMTP over SSL.

---

## Project Structure

```bash
.
├── app.py
├── requirements.txt
├── .env                # local environment variables (not committed)
├── .gitignore
├── static/
│   ├── dash.css
│   ├── dash.js
│   ├── employee.css
│   ├── employee.js
│   ├── events.css
│   ├── events.js
│   ├── script.js
│   ├── style.css
│   ├── tasks.css
│   └── tasks.js
├── templates/
│   ├── dash.html       # main dashboard
│   ├── employee.html   # employees view
│   ├── events.html     # calendar / events page
│   ├── index.html      # auto-assign / upload page
│   └── tasks.html      # tasks list + filters
└── uploads/
    └── sample-0.mp3    # sample meeting recording
````

---

## Setup & Installation

### Clone the Repo

```bash
git clone https://github.com/hannahjan06/MULTIBRAIN.git
cd MULTIBRAIN
```

---

### Create & Activate Virtual Env (Optional but recommended)

```bash
python -m venv venv
# macOS / Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
```

---

### Install Dependencies

`requirements.txt` should look roughly like:

```txt
Flask
Flask_SQLAlchemy
Werkzeug
requests
openai-whisper
python-dotenv
```

Then install:

```bash
pip install -r requirements.txt
```

> ⚠️ Whisper may require `ffmpeg`.  
> Example (macOS): `brew install ffmpeg`  
> Linux: use your package manager (`apt`, `dnf`, etc).  

---

### Install & Run Ollama

1. Download **Ollama** from its official site and install it.
2. Start Ollama (it will listen on `http://localhost:11434`).
3. Pull the LLaMA 2 model:

```bash
ollama pull llama2
```

4. (Optional) Test it:

```bash
ollama run llama2
```

The app expects:

```json
"model": "llama2:latest"
```

and uses `POST http://localhost:11434/api/generate`.

---

### Configure Environment Variables

Create a `.env` file in the repo root:

```env
UNIQUE_KEY=some_random_secret_key

EMAIL_ADDRESS=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
```

* `UNIQUE_KEY` → Flask `SECRET_KEY`
* `EMAIL_ADDRESS` / `EMAIL_PASSWORD` → used for SMTP to send notifications.
  For Gmail, enable 2FA and generate an **App Password** (don’t use your real login password).

---

### Run the App

```bash
python app.py
```

On first run, the app will:

* create `multibrain.db`
* add dummy employees
* add some dummy tasks for workload visualisation

Then open:

```text
http://127.0.0.1:5000/
```

---

## Typical Flow

1. **Create events** in the Events page
   → events stored in DB and your whole team gets notified.

2. **Upload a recording or transcript** in the Auto Assign page
   → Whisper transcribes (if audio), Ollama extracts JSON tasks.

3. **Review AI tasks**
   → check descriptions, deadlines, suggested assignees.

4. **Assign tasks to employees**
   → app links tasks to `Employee` records and emails each person their list.

5. **Track progress**

   * Dashboard shows workload.
   * Tasks page lets you filter pending/complete.
   * Change statuses as work is done.

---

## Future Ideas

* Speaker diarization (who said what).
* Integration with Google Calendar / Outlook.
* Per-project boards instead of only per-employee view.
* Role-based access (manager vs employee dashboards).

---

## Credits

Built with way too much coffee, Python, and curiosity.  
AI stack: **Whisper + Ollama (LLaMA 2)**  
Backend: **Flask + SQLite + SQLAlchemy**  
