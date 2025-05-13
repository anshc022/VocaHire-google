from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AudioInput(BaseModel):
    audio_chunk: bytes # Raw audio bytes
    session_id: str
    sequence_number: int # To maintain order of chunks

class TranscriptionResult(BaseModel):
    text: str
    timestamp: float # Timestamp of transcription completion
    is_final: bool # Whether this is the final transcript for an utterance

class AIResponse(BaseModel):
    text_response: Optional[str] = None
    audio_response_url: Optional[str] = None # URL to generated audio
    audio_response_bytes: Optional[bytes] = None # Or send bytes directly
    session_id: str
    response_to_sequence: Optional[int] = None # Correlates to input sequence

class EvaluationMetrics(BaseModel):
    clarity: float = Field(..., ge=0, le=1, description="Communication clarity score (0-1)")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (e.g., based on hesitation/fillers)")
    relevance: float = Field(..., ge=0, le=1, description="Relevance of answers score (0-1)")
    depth: float = Field(..., ge=0, le=1, description="Depth of answers score (0-1)")
    keyword_match_score: float = Field(..., ge=0, le=1, description="Keyword matching score (0-1)")
    answer_length_score: float = Field(..., ge=0, le=1, description="Score based on answer length appropriateness (0-1)")
    overall_score: float = Field(..., ge=0, le=1, description="Overall weighted score")

class InterviewTurn(BaseModel):
    speaker: str # "AI" or "Candidate"
    text: str
    timestamp: float

class SessionSummary(BaseModel):
    session_id: str
    full_transcript: List[InterviewTurn]
    evaluation: EvaluationMetrics
    tips_for_improvement: Optional[List[str]] = None
    duration_seconds: float
    started_at: float # Unix timestamp
    ended_at: float # Unix timestamp

class SummaryRequest(BaseModel):
    session_id: str
    # In a real scenario, the backend would fetch transcript and evaluation data
    # based on session_id from a database or cache.
    # For this example, we might pass it if not stored.
    # full_transcript: List[InterviewTurn]
    # evaluation_results: EvaluationMetrics
