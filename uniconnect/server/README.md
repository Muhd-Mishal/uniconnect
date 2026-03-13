# UniConnect Backend

Single Node.js + Express backend for authentication, APIs, MySQL, real-time features, and answer evaluation using TF-IDF plus cosine similarity.

## Folder structure

```text
server/
  server.js
  config/
    db.js
  controllers/
    aiController.js
    evaluateController.js
    interviewController.js
  routes/
    aiRoutes.js
    evaluateRoutes.js
    interviewRoutes.js
  services/
    aiEvaluator.js
```

## Required npm packages

- `express`
- `dotenv`
- `cors`
- `mysql2`
- `jsonwebtoken`
- `bcryptjs`
- `multer`
- `socket.io`
- `nodemailer`
- `@google/generative-ai`
- `natural`
- `cosine-similarity`
- `nodemon` as a dev dependency

## Environment variables

Create `.env` from `.env.example` and set:

- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `FRONTEND_URL`
- `CLIENT_ORIGIN`
- `EMAIL_USER`
- `EMAIL_PASS`

## Local setup

1. Install dependencies:
   `npm install`
2. Create the database and tables:
   run [database.sql](C:/Users/Muhammed Mishal/newreact - Copy (2) - Copy/uniconnect/database.sql)
3. Start the backend:
   `npm run dev`

## Evaluation endpoint

`POST /api/evaluate`

Headers:

```text
Authorization: Bearer <jwt>
Content-Type: application/json
```

Body:

```json
{
  "referenceAnswer": "correct answer",
  "studentAnswer": "user answer",
  "questionId": 1
}
```

Response:

```json
{
  "similarityScore": 0.82,
  "percentage": 82,
  "feedback": "Excellent Answer"
}
```

## Interview evaluation storage

The backend stores evaluation records in `answer_evaluations` with:

- `user_id`
- `question_id`
- `answer`
- `similarity_score`
- `evaluated_at`

The existing `interview_results` table is also still written for backward compatibility with current history screens.

## Render deployment

Deploy only the Node backend service from the `uniconnect/server` directory.

- Build command: `npm install`
- Start command: `npm start`
- Add the same environment variables from `.env.example`
- Use a managed MySQL database and import the schema from [database.sql](C:/Users/Muhammed Mishal/newreact - Copy (2) - Copy/uniconnect/database.sql)
