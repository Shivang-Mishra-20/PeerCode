FROM python:3.11-slim

# Install curl for health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements & install dependencies
COPY apps/ai-service/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY apps/ai-service/app ./app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
