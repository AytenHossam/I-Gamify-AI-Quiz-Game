from flask import Flask, request, jsonify
import os
import fitz  # PyMuPDF
import docx
import pytesseract
from pdf2image import convert_from_path
import requests
import random
from langdetect import detect
from werkzeug.utils import secure_filename
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

uploads_dir = 'uploads'
os.makedirs(uploads_dir, exist_ok=True)

ALLOWED_EXTENSIONS = {'.pdf', '.docx'}

def allowed_file(filename):
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXTENSIONS

def upload_file(file):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        path = os.path.join(uploads_dir, filename)
        file.save(path)
        return path
    raise ValueError("No valid file uploaded. Please upload a PDF or DOCX file.")

def extract_docx_text(path):
    return " ".join([p.text for p in docx.Document(path).paragraphs])

def extract_pdf_text_with_ocr(path):
    images = convert_from_path(path)
    return "\n".join(pytesseract.image_to_string(img, lang='ara+eng') for img in images)

def extract_text(path):
    if path.endswith(".pdf"):
        doc = fitz.open(path)
        raw = " ".join([page.get_text() for page in doc])
        return raw if len(raw.strip()) >= 100 else extract_pdf_text_with_ocr(path)
    elif path.endswith(".docx"):
        return extract_docx_text(path)
    else:
        raise ValueError("Unsupported file type.")

def detect_language(text):
    try:
        return detect(text)
    except:
        return "en"

GROQ_API_KEY = "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"
GROQ_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct"

def call_groq(prompt):
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=30)
        res.raise_for_status()
        return res.json()['choices'][0]['message']['content']
    except requests.exceptions.RequestException as e:
        print("Groq API error:", e)
        return None

def generate_prompt(text, num_blanks, lang):
    if lang == "ar":
        return f"""
أنت مساعد تدريسي ذكي.

اقرأ المحتوى التالي واستخرج منه {num_blanks} جمل تعليمية فريدة على شكل **املأ الفراغ**.

---
{text}
---

يجب أن تتبع الجمل الشروط التالية:
1. اختر {num_blanks} مفاهيم تعليمية رئيسية.
2. أنشئ {num_blanks} جمل ذات معنى، تحتوي كل جملة على فراغ.
3. مواضع الفراغ تكون موزعة تقريبًا بالتساوي بين البداية، المنتصف، والنهاية.
4. كل جملة بصياغة ومحتوى مختلف.
5. استخدم هذا التنسيق فقط:

Answers: [كلمة1، كلمة2، ...]
Blanks:
1. ____ ...
2. ... ____ ...
3. ... ____.

لا تكتب أي شرح إضافي.
"""
    else:
        return f"""
You are a teaching assistant.

Read the content and generate {num_blanks} educational **fill-in-the-blank** sentences.

---
{text}
---

Requirements:
1. Choose {num_blanks} key single-word concepts.
2. One blank per sentence, randomized position (start, middle, end).
3. Conceptual and phrasing diversity.
4. Format like this:

Answers: [word1, word2, ..., word{num_blanks}]
Blanks:
1. ____ is ...
2. Something ____ something.
3. Something something ____.

No explanation, only this structure.
"""

@app.route("/", methods=["POST"])
def handle_upload():
    file = request.files.get("file")
    num_blanks = int(request.form.get("num_blanks", 1))

    try:
        path = upload_file(file)
        text = extract_text(path)

        if not text.strip() or len(text.strip().split()) < 50:
            return jsonify({"status": "error", "message": "❗ File contains insufficient content."})

        lang = detect_language(text)
        prompt = generate_prompt(text, num_blanks, lang)
        output = call_groq(prompt)

        if not output:
            return jsonify({"status": "error", "message": "⚠️ Failed to generate questions."})

        answers_start = output.find("Answers:") + len("Answers: [")
        answers_end = output.find("]", answers_start)
        answers_raw = output[answers_start:answers_end].strip()

        sep = "،" if lang == "ar" else ","
        answers = [a.strip() for a in answers_raw.split(sep)]
        answer_pool = answers.copy()
        random.shuffle(answer_pool)

        blanks_start = output.find("Blanks:") + len("Blanks:\n")
        blanks_lines = output[blanks_start:].strip().split("\n")
        blanks = [line.strip()[3:] if line.strip().startswith(tuple("1234567890")) else line.strip()
                  for line in blanks_lines if line.strip()]

        if len(blanks) != len(answers):
            return jsonify({"status": "error", "message": "Mismatch between blanks and answers."})

        questions = [
            {"id": i + 1, "question": blanks[i], "answer": answers[i]}
            for i in range(len(blanks))
        ]

        return jsonify({
            "status": "success",
            "data": {
                "answer_pool": answer_pool,
                "questions": questions,
                "lang": lang
            }
        })

    except ValueError as ve:
        return jsonify({"status": "error", "message": str(ve)})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

# Optional: A simple health check route
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"message": "Server is up"}), 200

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5005)
