from typing import List, Dict, Any, AsyncGenerator
import asyncio
import random

# Placeholder for actual LLM integration (e.g., Google Gemini API via google-generativeai library)
# You would need to install the google-generativeai library and configure API keys.
# For a real implementation, you would initialize the Gemini client here,
# likely using an API key from environment variables.
# Example:
# import google.generativeai as genai
# genai.configure(api_key="YOUR_GEMINI_API_KEY")
# model = genai.GenerativeModel('gemini-pro') # Or another suitable model

current_question_index = 0
interview_questions = [
    "Can you tell me about yourself?",
    "What are your strengths?",
    "What are your weaknesses?",
    "Why are you interested in this role?",
    "Describe a challenging situation you faced and how you handled it.",
    "Where do you see yourself in 5 years?",
    "Why should we hire you?",
    "Do you have any questions for me?"
]

async def generate_interview_response(transcript_segment: str, interview_history: List[Dict[str, str]], session_id: str) -> AsyncGenerator[str, None]:
    """
    Placeholder for LLM (Gemini) to generate the next interview question or feedback.
    This function would interact with the Gemini API.
    
    Args:
        transcript_segment: The latest transcribed segment from the candidate.
        interview_history: A list of previous turns in the conversation.
        session_id: The session ID for context.

    Yields:
        The AI's response, potentially in chunks if streaming from LLM.
    """
    global current_question_index
    print(f"[LLM Service - Session {session_id}] Simulating Gemini. Received transcript: '{transcript_segment}'")
    print(f"[LLM Service - Session {session_id}] Current history length: {len(interview_history)}")

    # Simulate LLM (Gemini) processing delay
    await asyncio.sleep(0.5 + random.uniform(0,1)) # Simulate thinking time

    # In a real Gemini implementation, you would construct a prompt from
    # transcript_segment and interview_history, then call:
    # response_stream = await model.generate_content_async(prompt_parts, stream=True)
    # async for chunk in response_stream:
    #     yield chunk.text
    # For this placeholder, we use the predefined question list.

    ai_response_text = ""
    if not transcript_segment and not interview_history: # Start of interview
        ai_response_text = "Hello! Welcome to your VocaHire interview. Let's begin. " + interview_questions[current_question_index]
        current_question_index = (current_question_index + 1) % len(interview_questions)
    elif "question for me" in transcript_segment.lower() or current_question_index >= len(interview_questions) -1 : # End of questions
         ai_response_text = "Thank you for your responses. That concludes the main part of the interview. Do you have any final questions for VocaHire?"
         # In a real scenario, Gemini might decide to end or ask for candidate questions.
    elif transcript_segment: # Candidate responded
        # Simple logic: Acknowledge and ask next question
        acknowledgements = ["Okay, thank you.", "Understood.", "Thanks for sharing that.", "I see.", "Alright."]
        ai_response_text = f"{random.choice(acknowledgements)} Now, {interview_questions[current_question_index]}"
        current_question_index = (current_question_index + 1) % len(interview_questions)
    else: # Fallback or error
        ai_response_text = "I'm sorry, I didn't quite catch that. Could you please repeat?"

    # Simulate streaming response (Gemini API can stream responses)
    words = ai_response_text.split()
    for i, word in enumerate(words):
        yield word + (" " if i < len(words) -1 else "")
        await asyncio.sleep(0.05) # Simulate word-by-word generation

    print(f"[LLM Service - Session {session_id}] Simulated Gemini AI response: '{ai_response_text}'")

async def reset_interview_state():
    """Resets the question index for a new interview session."""
    global current_question_index
    current_question_index = 0
    print("[LLM Service] Interview state (question index) reset.")

