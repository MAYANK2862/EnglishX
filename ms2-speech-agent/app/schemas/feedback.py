from pydantic import BaseModel, Field
from typing import Optional


class PronunciationFeedback(BaseModel):
    mispronounced_words: list[dict] = Field(default_factory=list)
    problem_phonemes: list[str] = Field(default_factory=list)
    pace_assessment: str = ""
    filler_sounds: list[str] = Field(default_factory=list)
    score: int = Field(default=50, ge=0, le=100)


class VocabularyFeedback(BaseModel):
    repeated_words: list[dict] = Field(default_factory=list)
    better_alternatives: list[dict] = Field(default_factory=list)
    word_variety_score: float = 0.0
    register_notes: str = ""
    score: int = Field(default=50, ge=0, le=100)


class GrammarFeedback(BaseModel):
    errors: list[dict] = Field(default_factory=list)
    error_categories: list[str] = Field(default_factory=list)
    score: int = Field(default=50, ge=0, le=100)


class FeedbackReport(BaseModel):
    pronunciation: PronunciationFeedback
    vocabulary: VocabularyFeedback
    grammar: GrammarFeedback
    strengths: list[str] = Field(default_factory=list)
    overall_score: int = Field(default=50, ge=0, le=100)
    encouragement: str = ""


class ScoringResult(BaseModel):
    pronunciation_score: int = Field(ge=0, le=100)
    vocabulary_score: int = Field(ge=0, le=100)
    grammar_score: int = Field(ge=0, le=100)
    overall_score: int = Field(ge=0, le=100)
    pronunciation_level: int = Field(ge=1, le=6)
    vocabulary_level: int = Field(ge=1, le=6)
    grammar_level: int = Field(ge=1, le=6)
    overall_level: int = Field(ge=1, le=6)
