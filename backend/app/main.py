from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Path
from fastapi.responses import JSONResponse, HTMLResponse # Added HTMLResponse for root
from typing import Dict, List, AsyncGenerator
import asyncio
import uuid
import time

from backend.app.models.interview_models import (
    AIResponse, SessionSummary, EvaluationMetrics, InterviewTurn, SummaryRequest
)
from backend.app.services import (
    stt_service,
    llm_service,
    tts_service,
    evaluation_service,
    session_service,
)

app = FastAPI(
    title="VocaHire Backend",
    description="FastAPI backend for the VocaHire real-time AI voice interview simulator.",
    version="0.1.0",
)

# Store active WebSocket connections and session data
# In a production environment, consider using Redis or another shared store
active_connections: Dict[str, WebSocket] = {}
interview_sessions: Dict[str, Dict[str, any]] = {}


@app.get("/", response_class=HTMLResponse)
async def read_root():
    return """
    <html>
        <head>
            <title>VocaHire Backend</title>
        </head>
        <body>
            <h1>VocaHire Backend is running!</h1>
            <p>Connect to the WebSocket endpoint at <code>/ws/interview/{session_id}</code>.</p>
            <p>Access API documentation at <a href="/docs">/docs</a>.</p>
        </body>
    </html>
    """

async def audio_chunk_generator_from_websocket(websocket: WebSocket, session_id: str) -> AsyncGenerator[bytes, None]:
    """
    Receives audio chunks from WebSocket and yields them.
    Terminates when a special "END_OF_AUDIO" message is received or connection closes.
    """
    chunk_index = 0
    try:
        while True:
            data = await websocket.receive()
            if "bytes" in data:
                audio_chunk = data["bytes"]
                print(f"[WebSocket - Session {session_id}] Received audio chunk {chunk_index} of length {len(audio_chunk)} bytes.")
                session_service.add_to_transcript(session_id, "Candidate_Audio_Marker", f"Audio chunk {chunk_index} received") # Simplified marker
                yield audio_chunk
                chunk_index += 1
            elif "text" in data:
                message = data["text"]
                if message == "END_OF_STREAM": # Client signals end of its audio transmission for this turn
                    print(f"[WebSocket - Session {session_id}] Client signaled END_OF_STREAM for current turn.")
                    break # Stop yielding for this turn, STT will finalize.
                elif message == "END_INTERVIEW":
                    print(f"[WebSocket - Session {session_id}] Client signaled END_INTERVIEW.")
                    # Handle interview termination logic if needed by generator
                    # For now, just break, main loop will handle.
                    break
    except WebSocketDisconnect:
        print(f"[WebSocket - Session {session_id}] Client disconnected during audio streaming.")
    except Exception as e:
        print(f"[WebSocket - Session {session_id}] Error receiving audio: {e}")
    finally:
        print(f"[WebSocket - Session {session_id}] Audio chunk generator finished.")


@app.websocket("/ws/interview/{session_id}")
async def interview_websocket_endpoint(websocket: WebSocket, session_id: str = Path(...)):
    await websocket.accept()
    active_connections[session_id] = websocket
    session_service.initialize_session(session_id)
    await llm_service.reset_interview_state() # Reset LLM state for new session

    print(f"[WebSocket] Client connected: {session_id}")

    try:
        # Send initial greeting / first question from AI
        initial_greeting_stream = llm_service.generate_interview_response("", [], session_id)
        
        ai_response_text_buffer = ""
        # Create a queue for text chunks from LLM to TTS
        llm_to_tts_queue = asyncio.Queue()

        async def process_llm_to_tts():
            nonlocal ai_response_text_buffer
            async for text_chunk in initial_greeting_stream:
                ai_response_text_buffer += text_chunk
                await llm_to_tts_queue.put(text_chunk)
            await llm_to_tts_queue.put(None) # Signal end of text stream

        # Start TTS stream processing in parallel
        tts_audio_stream_queue = await tts_service.convert_text_to_speech_stream(llm_to_tts_queue, session_id)
        
        # Concurrently run LLM-to-TTS text production and TTS audio consumption
        llm_task = asyncio.create_task(process_llm_to_tts())
        
        # Stream audio back to client
        while True:
            audio_chunk = await tts_audio_stream_queue.get()
            if audio_chunk is None: # End of TTS audio stream
                tts_audio_stream_queue.task_done()
                break
            await websocket.send_bytes(audio_chunk)
            tts_audio_stream_queue.task_done()
        
        await llm_task # Ensure LLM text production is complete
        
        session_service.add_to_transcript(session_id, "AI", ai_response_text_buffer)
        await websocket.send_text(f"AI_ zegt: {ai_response_text_buffer}") # Also send text for debugging/UI

        # Main interview loop
        turn_count = 0
        while True:
            turn_count +=1
            print(f"[WebSocket - Session {session_id}] Waiting for candidate audio (Turn {turn_count})...")
            
            # 1. Receive audio from client and transcribe (STT)
            candidate_audio_stream = audio_chunk_generator_from_websocket(websocket, session_id)
            
            transcribed_text_final = ""
            async for text_part, is_final in stt_service.transcribe_audio_stream(candidate_audio_stream, session_id):
                await websocket.send_text(f"STT_part: {text_part}{' (final)' if is_final else ''}") # Send partial transcripts
                if is_final:
                    transcribed_text_final += text_part + " " # Accumulate final parts for the turn
            
            transcribed_text_final = transcribed_text_final.strip()
            if not transcribed_text_final:
                 # Check if client sent special text command instead of audio bytes
                async for message_obj in websocket.iter_text(): # Check for text messages if audio stream was empty
                    if message_obj == "END_INTERVIEW":
                        print(f"[WebSocket - Session {session_id}] END_INTERVIEW received, terminating loop.")
                        raise WebSocketDisconnect(code=1000, reason="Interview ended by client")
                    # Handle other text commands if necessary
                print(f"[WebSocket - Session {session_id}] No transcription received for turn {turn_count}.")
                # Potentially ask to repeat, or if multiple empty, end interview
                # For now, let's try to get another AI response to prompt user
                # transcribed_text_final = "..." # Placeholder to trigger LLM
                if turn_count > 5 and not transcribed_text_final: # Arbitrary limit for empty turns
                    await websocket.send_text("AI_says: It seems I'm not receiving audio. Ending interview.")
                    raise WebSocketDisconnect(code=1000, reason="No audio from client after multiple turns")


            session_service.add_to_transcript(session_id, "Candidate", transcribed_text_final)
            await websocket.send_text(f"Candidate_says: {transcribed_text_final}")


            # 2. Get AI response (LLM)
            current_transcript = session_service.get_transcript(session_id)
            history_for_llm = [{"role": "AI" if t.speaker == "AI" else "user", "content": t.text} for t in current_transcript]
            
            ai_response_stream = llm_service.generate_interview_response(transcribed_text_final, history_for_llm, session_id)
            
            ai_response_text_buffer = ""
            llm_to_tts_queue_loop = asyncio.Queue()

            async def process_llm_to_tts_loop():
                nonlocal ai_response_text_buffer
                async for text_chunk in ai_response_stream:
                    ai_response_text_buffer += text_chunk
                    await llm_to_tts_queue_loop.put(text_chunk)
                await llm_to_tts_queue_loop.put(None)

            tts_audio_stream_queue_loop = await tts_service.convert_text_to_speech_stream(llm_to_tts_queue_loop, session_id)
            llm_task_loop = asyncio.create_task(process_llm_to_tts_loop())

            # 3. Convert AI response to speech (TTS) and stream back
            while True:
                audio_chunk = await tts_audio_stream_queue_loop.get()
                if audio_chunk is None:
                    tts_audio_stream_queue_loop.task_done()
                    break
                await websocket.send_bytes(audio_chunk)
                tts_audio_stream_queue_loop.task_done()
            
            await llm_task_loop # Ensure LLM text production is complete

            session_service.add_to_transcript(session_id, "AI", ai_response_text_buffer)
            await websocket.send_text(f"AI_says: {ai_response_text_buffer}")

            if "that concludes the main part of the interview" in ai_response_text_buffer.lower():
                print(f"[WebSocket - Session {session_id}] AI signaled end of questions. Preparing to close.")
                await websocket.send_text("INTERVIEW_ENDED_BY_AI")
                break # Exit the main interview loop

    except WebSocketDisconnect as e:
        print(f"[WebSocket - Session {session_id}] Client disconnected. Code: {e.code}, Reason: {e.reason}")
        session_service.end_session(session_id)
    except Exception as e:
        print(f"[WebSocket - Session {session_id}] Error in WebSocket connection: {e}")
        await websocket.close(code=1011, reason=f"Server error: {str(e)}")
    finally:
        if session_id in active_connections:
            del active_connections[session_id]
        print(f"[WebSocket - Session {session_id}] Connection closed.")
        # Session summary could be triggered here or by client request
        # For now, let's assume client requests it via HTTP GET

@app.post("/api/interview/summary", response_model=SessionSummary)
async def get_interview_summary(summary_request: SummaryRequest):
    """
    Generates and returns the interview session summary.
    This endpoint would typically be called after the WebSocket session ends.
    """
    session_id = summary_request.session_id
    print(f"[API] Request for summary for session: {session_id}")

    # Retrieve transcript and perform evaluation
    transcript = session_service.get_transcript(session_id)
    if not transcript:
        raise HTTPException(status_code=404, detail=f"Transcript for session {session_id} not found or empty.")

    evaluation_results = await evaluation_service.analyze_transcript(transcript, session_id)
    session_service.store_evaluation(session_id, evaluation_results)
    
    summary = await session_service.generate_session_summary(session_id)
    if not summary:
        raise HTTPException(status_code=404, detail=f"Summary for session {session_id} could not be generated or not found.")
    
    # Optionally, save the summary (e.g., to JSON or PDF)
    json_summary = await session_service.export_summary_to_json(summary, session_id)
    # For testing, print it. In prod, save to a file or return as part of response.
    print(f"[API - Session {session_id}] JSON Summary:\n{json_summary}")
    
    # pdf_summary_bytes = await session_service.export_summary_to_pdf(summary, session_id)
    # This would be saved or made available for download.

    return summary

@app.get("/api/interview/{session_id}/summary", response_model=Optional[SessionSummary])
async def retrieve_interview_summary(session_id: str):
    """
    Retrieves a previously generated interview session summary.
    """
    print(f"[API] Retrieval request for summary for session: {session_id}")
    summary = session_service.get_session_summary_from_store(session_id)
    if not summary:
        # Attempt to generate if not found and session data exists
        # This logic might be better if summary generation is explicitly triggered
        session_data = session_service.active_sessions.get(session_id)
        if session_data and session_data.get("transcript"):
            print(f"[API - Session {session_id}] Summary not found in store, attempting to generate now...")
            # Ensure evaluation is done first
            if not session_data.get("evaluation"):
                 transcript = session_data.get("transcript")
                 evaluation_results = await evaluation_service.analyze_transcript(transcript, session_id)
                 session_service.store_evaluation(session_id, evaluation_results)

            summary = await session_service.generate_session_summary(session_id)

        if not summary:
            raise HTTPException(status_code=404, detail=f"Summary for session {session_id} not found.")
            
    return summary


if __name__ == "__main__":
    import uvicorn
    # This is for local development. For deployment, use a process manager like Gunicorn.
    # Example: uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
