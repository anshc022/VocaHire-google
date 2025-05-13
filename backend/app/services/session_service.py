from typing import List, Dict, Optional
import time
import json
import random
import asyncio

from backend.app.models.interview_models import SessionSummary, EvaluationMetrics, InterviewTurn

# Placeholder for Session Summary service

# In a real application, this would likely be a database or a more robust in-memory store.
# For simplicity, using a dictionary to store session data.
active_sessions: Dict[str, Dict] = {}

def initialize_session(session_id: str):
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "transcript": [],
            "start_time": time.time(),
            "evaluation": None,
            "status": "active"
        }
        print(f"[Session Service] Initialized session: {session_id}")

def add_to_transcript(session_id: str, speaker: str, text: str):
    if session_id in active_sessions:
        turn = InterviewTurn(speaker=speaker, text=text, timestamp=time.time())
        active_sessions[session_id]["transcript"].append(turn)
    else:
        print(f"[Session Service] Error: Session {session_id} not found for adding transcript.")

def get_transcript(session_id: str) -> List[InterviewTurn]:
    return active_sessions.get(session_id, {}).get("transcript", [])

def store_evaluation(session_id: str, evaluation_results: EvaluationMetrics):
    if session_id in active_sessions:
        active_sessions[session_id]["evaluation"] = evaluation_results
    else:
        print(f"[Session Service] Error: Session {session_id} not found for storing evaluation.")

def get_evaluation(session_id: str) -> Optional[EvaluationMetrics]:
    return active_sessions.get(session_id, {}).get("evaluation", None)


async def generate_session_summary(session_id: str) -> Optional[SessionSummary]:
    """
    Placeholder for generating a summary of the interview session.
    This would collect transcript, evaluation, and generate tips.
    
    Args:
        session_id: The ID of the session to summarize.

    Returns:
        A SessionSummary object or None if session not found/complete.
    """
    if session_id not in active_sessions or active_sessions[session_id].get("status") != "active":
        print(f"[Session Service] Session {session_id} not found or not active for summary.")
        # Could also mean it's already summarized or never existed
        # return None

    session_data = active_sessions.get(session_id)
    if not session_data:
         print(f"[Session Service] Session {session_id} has no data.")
         return None # Or raise error

    print(f"[Session Service - Session {session_id}] Generating summary.")
    
    # Simulate summary generation delay
    await asyncio.sleep(0.5)

    transcript = session_data.get("transcript", [])
    evaluation = session_data.get("evaluation")
    start_time = session_data.get("start_time", time.time())
    end_time = time.time() # Current time as end time for summary generation
    
    if not evaluation:
        # This case should ideally be handled by ensuring evaluation is done before summary
        print(f"[Session Service - Session {session_id}] Evaluation not found. Generating placeholder evaluation.")
        # In a real app, you'd likely call the evaluation service here if not already done.
        # For now, let's create a dummy one.
        evaluation = EvaluationMetrics(
            clarity=random.uniform(0.1, 0.5), confidence=random.uniform(0.1, 0.5), 
            relevance=random.uniform(0.1, 0.5), depth=random.uniform(0.1, 0.5),
            keyword_match_score=random.uniform(0.1, 0.5), answer_length_score=random.uniform(0.1, 0.5),
            overall_score=random.uniform(0.1, 0.5)
        )


    tips = [
        "Practice speaking more clearly and at a steady pace.",
        "Try to provide more specific examples when answering behavioral questions.",
        "Consider elaborating on your experiences to demonstrate depth of knowledge."
    ]
    
    summary = SessionSummary(
        session_id=session_id,
        full_transcript=transcript,
        evaluation=evaluation,
        tips_for_improvement=tips if evaluation.overall_score < 0.7 else ["Great job overall!"],
        duration_seconds=round(end_time - start_time, 2),
        started_at=start_time,
        ended_at=end_time
    )
    
    active_sessions[session_id]["status"] = "summarized" # Mark as summarized
    active_sessions[session_id]["summary"] = summary # Store summary

    print(f"[Session Service - Session {session_id}] Summary generated.")
    return summary

async def export_summary_to_json(summary: SessionSummary, session_id: str) -> str:
    """
    Exports the session summary to a JSON string.
    In a real application, this might save to a file or database.
    """
    print(f"[Session Service - Session {session_id}] Exporting summary to JSON.")
    # Pydantic models have a .model_dump_json() method
    return summary.model_dump_json(indent=2)

async def export_summary_to_pdf(summary: SessionSummary, session_id: str) -> bytes:
    """
    Placeholder for exporting the session summary to a PDF.
    This would require a library like ReportLab.
    """
    print(f"[Session Service - Session {session_id}] Placeholder: Exporting summary to PDF.")
    # Simulate PDF generation
    await asyncio.sleep(1)
    pdf_content = f"PDF Summary for Session {session_id}\n\n"
    pdf_content += f"Overall Score: {summary.evaluation.overall_score}\n\n"
    pdf_content += "Transcript Highlights:\n"
    for turn in summary.full_transcript[:3]: # First 3 turns
        pdf_content += f"- {turn.speaker}: {turn.text[:50]}...\n"
    
    # This is not a real PDF, just text bytes
    return pdf_content.encode('utf-8')

def get_session_summary_from_store(session_id: str) -> Optional[SessionSummary]:
    """Retrieves a previously generated summary if available."""
    return active_sessions.get(session_id, {}).get("summary")

def end_session(session_id: str):
    """Marks a session as ended, could trigger final processing or cleanup."""
    if session_id in active_sessions:
        if active_sessions[session_id]["status"] == "active":
             active_sessions[session_id]["status"] = "ended_pending_summary"
        print(f"[Session Service] Session {session_id} marked as ended.")
        # Optionally, remove from active_sessions after some time or archive
    else:
        print(f"[Session Service] Error: Session {session_id} not found to end.")
