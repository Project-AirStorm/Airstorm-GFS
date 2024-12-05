from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) #enables cross origin resource sharing AKA "CORS"

@app.route('/api/test', methods=['GET'])
def greet():
    return jsonify({"message": "Hello Airstorm Team!"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)

