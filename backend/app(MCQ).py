from flask import Flask, request, jsonify
from langchain_community.document_loaders import PyPDFLoader, UnstructuredWordDocumentLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langdetect import detect
from langchain.chains import RetrievalQA
from langchain.chat_models import ChatOpenAI
import requests
import re
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

def load_file(file_path):
    if file_path.endswith(".pdf"):
        loader = PyPDFLoader(file_path)
    elif file_path.endswith(".docx"):
        loader = UnstructuredWordDocumentLoader(file_path)
    else:
        raise ValueError("Unsupported file type. Use .pdf or .docx")

    return loader.load()

def split_documents(docs, chunk_size=1000, chunk_overlap=200):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    return text_splitter.split_documents(docs)

def parse_mcq_output(text):
    questions = []
    question_blocks = re.split(r'\n(?=Q:)', text.strip())

    for idx, block in enumerate(question_blocks, start=1):
        if not block.strip().lower().startswith("q:"):
            continue

        question_match = re.search(r'Q:\s*(.+)', block)
        options = re.findall(r'([A-D])\.\s*(.+)', block)
        answer_match = re.search(r'Answer:\s*([A-D])', block)

        if question_match and len(options) == 4 and answer_match:
            formatted = f"""Q{len(questions)+1}. {question_match.group(1).strip()}
A. {options[0][1].strip()}
B. {options[1][1].strip()}
C. {options[2][1].strip()}
D. {options[3][1].strip()}
Answer: {answer_match.group(1)}"""
            questions.append(formatted)
        else:
            print(f"⚠️ Skipped malformed question block #{idx}")

    return "\n\n".join(questions)

def detect_language(text):
    try:
        lang = detect(text)
        if lang == 'ar':
            return 'arabic'
        elif lang == 'en':
            return 'english'
        else:
            return 'other'
    except:
        return 'unknown'

def generate_mcqs_from_content(content, num_questions=5):
    api_key = "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"
    url = "https://api.groq.com/openai/v1/chat/completions"

    language = detect_language(content)
    
    if language == 'arabic':
       prompt = f"""
       أنت مولد احترافي لأسئلة الاختيار من متعدد.

       أنشئ {num_questions} سؤالًا من نوع اختيار من متعدد بناءً على النص التالي. 
       🔹 قم بتضمين مزيج من الأسئلة الواقعية (ما، متى)، المفاهيمية (لماذا، كيف)، والتطبيقية (من، أي).
       🔹 استخدم مستويات معرفية متنوعة: التذكر، الفهم، التطبيق، والاستدلال.
       🔹 عشوائيًا رتب موقع الإجابة الصحيحة.
       🔹 تأكد من أن الأسئلة التي تم إنشاؤها فريدة ولا تتكرر.

       الشكل المطلوب:
       Q: [نص السؤال]
       A. [الخيار A]
       B. [الخيار B]
       C. [الخيار C]
       D. [الخيار D]
       Answer: [الحرف الصحيح]

       لا تقم بإضافة شروحات أو تعليقات إضافية.

       المحتوى:
       \"\"\"{content}\"\"\"
       """

    else:
        prompt = f"""
        You are a professional quiz generator.

        Create exactly {num_questions} multiple-choice questions (MCQs) from the text below.
        🔹 Include a mix of factual ("What", "When"), conceptual ("Why", "How"), and applied ("Which", "Who") questions.
        🔹 Use different cognitive levels: recall, understanding, application, and inference.
        🔹 Randomize the position of the correct answer (not always A).
        🔹 Ensure that the generated questions are unique and do not repeat.

        Format for each MCQ:
        Q: [Question text]
        A. [Option A]
        B. [Option B]
        C. [Option C]
        D. [Option D]
        Answer: [Correct Option Letter]

        Do not include explanations, markdown, or additional commentary.

        Content:
        \"\"\"{content}\"\"\"
        """

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    body = {
        "model": "meta-llama/llama-4-scout-17b-16e-instruct",
        "messages": [
            {"role": "system", "content": "You are a quiz generator bot."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7
    }

    response = requests.post(url, headers=headers, json=body)
    response.raise_for_status()
    result = response.json()
    return result["choices"][0]["message"]["content"]

def trim_to_n_questions(text, num_questions):
    questions = re.findall(r'(Q:.*?Answer: [A-D])', text, re.DOTALL)

    trimmed = "\n\n".join(questions[:num_questions])
    
    return trimmed if trimmed else text

def number_questions(text):
    questions = re.findall(r'(Q:.*?Answer: [A-D])', text, re.DOTALL)
    numbered_questions = []

    for i, q in enumerate(questions, 1):
        numbered_questions.append(f"{i}. {q.strip()}")

    return "\n\n".join(numbered_questions)


def parse_quiz_to_json(quiz_text, language):
    questions = []
    question_blocks = re.split(r'\n(?=Q:)', quiz_text.strip())

    for idx, block in enumerate(question_blocks, start=1):
        if not block.strip().lower().startswith("q:"):
            continue

        question_match = re.search(r'Q:\s*(.+)', block)
        options = re.findall(r'([A-D])\.\s*(.+)', block)
        answer_match = re.search(r'Answer:\s*([A-D])', block)

        if question_match and len(options) == 4 and answer_match:
            formatted_question = {
                "question": question_match.group(1).strip(),
                "options": [
                    {"A": options[0][1].strip()},
                    {"B": options[1][1].strip()},
                    {"C": options[2][1].strip()},
                    {"D": options[3][1].strip()}
                ],
                "answer": answer_match.group(1)
            }
            questions.append(formatted_question)
        else:
            print(f"⚠️ Skipped malformed question block #{idx}")

    return {"language": language, "quiz": questions}


@app.route('/generate_mcq', methods=['POST'])
def generate_mcq():
    try:
        file = request.files['file']
        num_questions = int(request.form['num_questions'])
        language = request.form['language']  # Retrieve the language from the request
        file_path = f"./temp_file.{file.filename.split('.')[-1]}"
        file.save(file_path)
        docs = load_file(file_path)
        splits = split_documents(docs)
        combined_text = "\n".join([doc.page_content for doc in splits[:5]])  
        raw_quiz = generate_mcqs_from_content(combined_text, num_questions)
        quiz = trim_to_n_questions(raw_quiz, num_questions)

        # Parse the formatted quiz and convert it to structured JSON format
        structured_quiz = parse_quiz_to_json(quiz, language)

        return jsonify(structured_quiz)

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)