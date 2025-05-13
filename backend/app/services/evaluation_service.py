from typing import List, Dict
import random
from backend.app.models.interview_models import EvaluationMetrics, InterviewTurn
import asyncio

# Placeholder for the Evaluation Engine

async def analyze_transcript(full_transcript: List[InterviewTurn], session_id: str) -> EvaluationMetrics:
    """
    Placeholder for analyzing the full interview transcript.
    This service would calculate various metrics based on the candidate's responses.
    
    Args:
        full_transcript: A list of InterviewTurn objects representing the conversation.
        session_id: The session ID for context.

    Returns:
        An EvaluationMetrics object.
    """
    print(f"[Evaluation Service - Session {session_id}] Analyzing transcript with {len(full_transcript)} turns.")
    
    # Simulate analysis delay
    await asyncio.sleep(1 + random.uniform(0, 0.5))

    candidate_responses = [turn.text for turn in full_transcript if turn.speaker == "Candidate"]
    
    # Simulated metrics - replace with actual analysis logic
    clarity = random.uniform(0.5, 0.95)
    confidence = random.uniform(0.6, 0.98)
    relevance = random.uniform(0.5, 0.9)
    depth = random.uniform(0.4, 0.85)
    
    num_keywords_found = sum(1 for response in candidate_responses if "experience" in response.lower() or "skill" in response.lower())
    keyword_match_score = min(1.0, num_keywords_found / (len(candidate_responses) + 1e-6)) # Avoid division by zero
    
    avg_response_length = sum(len(r.split()) for r in candidate_responses) / (len(candidate_responses) + 1e-6)
    # Assume ideal length is 50 words, score based on proximity
    answer_length_score = max(0, 1 - abs(avg_response_length - 50) / 50)

    # Simple weighted average for overall score
    overall_score = (
        0.20 * clarity +
        0.20 * confidence +
        0.20 * relevance +
        0.15 * depth +
        0.15 * keyword_match_score +
        0.10 * answer_length_score
    )
    
    metrics = EvaluationMetrics(
        clarity=round(clarity, 2),
        confidence=round(confidence, 2),
        relevance=round(relevance, 2),
        depth=round(depth, 2),
        keyword_match_score=round(keyword_match_score, 2),
        answer_length_score=round(answer_length_score, 2),
        overall_score=round(overall_score, 2)
    )
    
    print(f"[Evaluation Service - Session {session_id}] Analysis complete. Overall score: {metrics.overall_score}")
    return metrics
