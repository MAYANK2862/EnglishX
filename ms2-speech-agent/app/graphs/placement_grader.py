"""LangGraph Placement Grader.

Analyzes a placement conversation to assign initial L1-L6 levels per dimension.
"""
from app.graphs.feedback_pipeline import feedback_pipeline, FeedbackState
from app.services.scoring import score_to_level


async def grade_placement(transcript: list[dict], word_confidences: list[dict] = None) -> dict:
    """Run the feedback pipeline on a placement conversation and return starting levels."""
    state: FeedbackState = {
        "transcript": transcript,
        "word_confidences": word_confidences or [],
        "learner_level": 3,  # assume mid-level for placement analysis
        "pronunciation_result": {},
        "vocabulary_result": {},
        "grammar_result": {},
        "aggregated_report": {},
    }

    result = feedback_pipeline.invoke(state)
    report = result.get("aggregated_report", {})

    return {
        "pronunciation_level": report.get("pronunciation", {}).get("level", 2),
        "vocabulary_level": report.get("vocabulary", {}).get("level", 2),
        "grammar_level": report.get("grammar", {}).get("level", 2),
        "overall_level": report.get("overall_level", 2),
        "pronunciation_score": report.get("pronunciation", {}).get("score", 35),
        "vocabulary_score": report.get("vocabulary", {}).get("score", 35),
        "grammar_score": report.get("grammar", {}).get("score", 35),
        "overall_score": report.get("overall_score", 35),
        "feedback": report,
    }
