# I-Gamify: AI-Powered Quiz Game Generator

I-Gamify is an AI-powered educational game platform that allows users to upload their study material (PDF or Word) and instantly generate interactive learning games:

- Multiple Choice Quiz Game
- Fill-in-the-Blank Game

Built using modern LLMs and NLP pipelines, I-Gamify turns passive study content into active learning experiences.

---

## Features

- Upload `.pdf` or `.docx` files as input
- Automatic question generation using LangChain and Retrieval-Augmented Generation (RAG)
- Powered by Meta LLaMA 4 served via Groq
- Intelligent chunking and semantic understanding
- Interactive game interface with real-time scoring
- Frontend built with React
- Backend API built with Flask
- Fully containerized with Docker

---

## Tech Stack

| Layer         | Tools & Frameworks                          |
|---------------|---------------------------------------------|
| LLM / AI      | Meta LLaMA 4 (via Groq), LangChain, RAG     |
| Backend       | Python, Flask, PyMuPDF, docx2txt            |
| Frontend      | React, TailwindCSS                          |
| Deployment    | Docker, Docker Compose                      |

---

## Project Structure

I-Gamify-AI-Quiz-Game/
|
├── backend/ # Flask backend with LangChain & Groq integration & DockerFile (for MCQ Feature)
├── frontend/ # React frontend interface
├── backend1/ # Flask backend with LangChain & Groq integration & DockerFile (for Puzzle Feature)
└── README.md # Project documentation

yaml
Copy
Edit

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/I-Gamify-AI-Quiz-Game.git
cd I-Gamify-AI-Quiz-Game
2. Backend Setup
bash
Copy
Edit
cd backend
pip install -r requirements.txt
# Add your Groq API key in the environment or a .env file
python app.py
3. Frontend Setup
bash
Copy
Edit
cd ../frontend
npm install
npm start
How It Works
User uploads a PDF or Word document containing study content.

The backend extracts and processes the text using LangChain.

Meta LLaMA 4 (via Groq) generates quiz content (MCQs or fill-in-the-blank).

The frontend renders the game, allowing the user to interact and get scored.

Developed By
Ayten Hossam Zoweil
AI Engineer | Full-Stack Developer
GitHub: https://github.com/yourusername
LinkedIn: https://www.linkedin.com/in/your-profile/

---
