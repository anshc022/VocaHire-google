# VocaHire Full Stack Application

This project consists of a Next.js frontend and a FastAPI backend for VocaHire, an AI-powered voice interview platform.

## Project Structure

- `src/`: Contains the Next.js frontend application.
- `components/`: Reusable React components for the frontend.
- `app/`: Next.js App Router pages and layouts.
- `ai/`: Genkit related AI flows for the Next.js application (if any specific to frontend).
- `public/`: Static assets for the frontend.
- `backend/`: Contains the FastAPI backend application.
  - `app/`: Core backend application code.
    - `main.py`: FastAPI application instance and WebSocket/HTTP endpoints.
    - `services/`: Business logic for STT, LLM, TTS, evaluation, and session management.
    - `models/`: Pydantic models for data validation and serialization.
  - `requirements.txt`: Python dependencies for the backend.

## Frontend (Next.js)

This is a Next.js starter in Firebase Studio.

To get started with the frontend, take a look at `src/app/page.tsx`.

### Running the Frontend Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
The frontend will be available at `http://localhost:9002` (or the port specified in your `package.json` script).

## Backend (FastAPI)

The backend is built with FastAPI and handles real-time AI voice interview simulation.

### Key Backend Features:
- WebSocket endpoint for real-time audio streaming.
- Speech-to-Text (STT) integration (placeholder for Whisper/whisper.cpp).
- AI Interview Brain using a local LLM (placeholder for Ollama with Mistral/Phi-2).
- Text-to-Speech (TTS) integration (placeholder for Bark/Coqui TTS).
- Evaluation Engine for analyzing interview transcripts.
- Session Summary generation.

### Setting up the Backend Environment

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a Python virtual environment (recommended):
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    -   On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```
    -   On Windows:
        ```bash
        .\venv\Scripts\activate
        ```
4.  Install Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Running the Backend Development Server

Ensure your virtual environment is activated and you are in the `backend` directory.

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The backend API will be available at `http://localhost:8000`.
Interactive API documentation (Swagger UI) will be at `http://localhost:8000/docs`.

### Backend AI Services (Placeholders)
The current backend implementation uses placeholders for STT, LLM, and TTS services. To enable full functionality, you would need to:
1.  Install and configure the respective libraries (e.g., `openai-whisper`, `ollama`, `TTS` or `bark`).
2.  Update the placeholder functions in `backend/app/services/` with actual integrations.
3.  Ensure any required external services (like Ollama server) are running.

## Genkit (for Next.js AI features)

If using Genkit for AI features within the Next.js frontend:
- Genkit flows are defined in `src/ai/flows/`.
- To run Genkit in development mode (for inspecting flows, etc.):
  ```bash
  npm run genkit:dev
  ```
- Or with watch mode:
  ```bash
  npm run genkit:watch
  ```

## Environment Variables
- Frontend: Create a `.env.local` file in the root of the Next.js app (`/`) for frontend-specific environment variables.
- Backend: Create a `.env` file in the `backend/` directory for backend-specific environment variables (e.g., API keys for cloud STT/TTS if not using local models).

## Further Development
- Frontend: Update UI components to interact with the FastAPI backend WebSocket and HTTP endpoints.
- Backend: Implement the actual STT, LLM, and TTS integrations by replacing the placeholder services. Consider database integration for persistent session storage and user data.
