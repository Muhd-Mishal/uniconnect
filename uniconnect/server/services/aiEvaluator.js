import natural from 'natural';
import cosineSimilarity from 'cosine-similarity';

const tokenizer = new natural.WordTokenizer();
const stopWords = new Set(natural.stopwords);

export const preprocessText = (text = '') =>
    tokenizer
        .tokenize(
            String(text)
                .toLowerCase()
                .replace(/[^\w\s]/g, ' ')
        )
        .map((token) => natural.PorterStemmer.stem(token))
        .filter((token) => token && !stopWords.has(token));

const buildVector = (tfidf, documentIndex, vocabulary) =>
    vocabulary.map((term) => tfidf.tfidf(term, documentIndex));

export const evaluateAnswerSimilarity = (referenceAnswer, studentAnswer) => {
    const referenceTokens = preprocessText(referenceAnswer);
    const studentTokens = preprocessText(studentAnswer);

    if (!referenceTokens.length) {
        throw new Error('referenceAnswer must contain meaningful text');
    }

    if (!studentTokens.length) {
        return {
            similarityScore: 0,
            percentage: 0
        };
    }

    const normalizedReference = referenceTokens.join(' ');
    const normalizedStudent = studentTokens.join(' ');

    if (normalizedReference === normalizedStudent) {
        return {
            similarityScore: 1,
            percentage: 100
        };
    }

    const tfidf = new natural.TfIdf();
    tfidf.addDocument(normalizedReference);
    tfidf.addDocument(normalizedStudent);

    const vocabulary = Array.from(
        new Set([
            ...referenceTokens,
            ...studentTokens
        ])
    );

    const referenceVector = buildVector(tfidf, 0, vocabulary);
    const studentVector = buildVector(tfidf, 1, vocabulary);
    const rawScore = cosineSimilarity(referenceVector, studentVector);
    const similarityScore = Number.isFinite(rawScore)
        ? Math.max(0, Math.min(1, rawScore))
        : 0;

    return {
        similarityScore: Number(similarityScore.toFixed(4)),
        percentage: Math.round(similarityScore * 100)
    };
};

export const buildEvaluationFeedback = (percentage) => {
    if (percentage >= 75) {
        return 'Excellent Answer';
    }

    if (percentage >= 50) {
        return 'Good but needs improvement';
    }

    return 'Revise fundamentals';
};
