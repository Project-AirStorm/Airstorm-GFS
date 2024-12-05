from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) #enables cross origin resource sharing AKA "CORS"

@app.route('/api/test', methods=['GET'])
def greet():
    return jsonify({"message": "Hello Airstorm Team!"})

@app.route('/')
def home():
    #this will eventually contain our Graphcast Data, served up to react
    return jsonify({"message": "Welcome to the Airstorm Homepage"})
   
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)

