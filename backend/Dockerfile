# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Sets the working directory in the docker container
WORKDIR /app

# Copy the requirements file (the dependencies) to the container
COPY requirements.txt ./

# Installs packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install watchdog to improve reloading in Docker
RUN pip install watchdog

# Copies the rest of the application code to the container
COPY . .

# Exposes port 5000 for Flask
EXPOSE 5001

# Run the flask application
CMD ["flask", "--app", "app.py", "run", "--host=0.0.0.0", "--debug"]