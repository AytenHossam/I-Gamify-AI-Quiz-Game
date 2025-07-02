FROM python:3.10-slim-bullseye@sha256:9f1aa5cf7b34c9c8ea02c83b186a62a924760ac3b5124185811793917daf7ad6

WORKDIR /app

# Install OS dependencies
RUN apt-get update && \
    apt-get install -y poppler-utils tesseract-ocr && \
    apt-get clean

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

EXPOSE 5005

CMD ["python", "app.py"]
