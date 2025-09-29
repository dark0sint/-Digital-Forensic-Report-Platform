from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

# Load sample cases data
def load_cases():
    with open('cases.json', 'r') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/cases')
def get_cases():
    cases = load_cases()
    return jsonify(cases)

@app.route('/api/case/<int:case_id>')
def get_case(case_id):
    cases = load_cases()
    case = next((c for c in cases if c['id'] == case_id), None)
    if case:
        return jsonify(case)
    return jsonify({'error': 'Case not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
