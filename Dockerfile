# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create database directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=src/main.py
ENV FLASK_ENV=production
ENV DATABASE_URL=sqlite:///data/traffic.db

# Create database tables
RUN python -c "from src.main import app, db; app.app_context().push(); db.create_all()"

# Run the application
CMD ["python", "src/main.py"]

