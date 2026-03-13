from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = Flask(__name__)
CORS(app)

def preprocess_text(text):
    if not text:
        return ""
    # Lowercase and remove punctuation
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    return text

@app.route('/evaluate', methods=['POST'])
def evaluate():
    try:
        data = request.get_json()
        
        user_answer = data.get('user_answer', '')
        ideal_answer = data.get('ideal_answer', '')
        
        if not user_answer or not ideal_answer:
            return jsonify({'message': 'user_answer and ideal_answer are required'}), 400

        user_clean = preprocess_text(user_answer)
        ideal_clean = preprocess_text(ideal_answer)

        # Handle exact match or empty strings
        if not user_clean:
            score = 0
            feedback = "Revise fundamentals"
            return jsonify({'score': score, 'feedback': feedback})

        if user_clean == ideal_clean:
            return jsonify({'score': 100, 'feedback': "Excellent Answer"})

        corpus = [ideal_clean, user_clean]
        
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(corpus)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
        score = float(similarity[0][0]) * 100

        # Formulate feedback logic
        if score > 75:
            feedback = "Excellent Answer"
        elif score >= 50:
            feedback = "Good but needs improvement"
        else:
            feedback = "Revise fundamentals"

        return jsonify({
            'score': round(score, 2),
            'feedback': feedback
        })

    except Exception as e:
        return jsonify({'message': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
