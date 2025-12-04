import os
from flask import Flask, jsonify, render_template, request, session

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('dash.html')

if __name__ == '__main__':  
    app.run(debug=True)