LEVEL_THRESHOLDS = [
    {"level": 1, "min": 0, "max": 16},
    {"level": 2, "min": 17, "max": 33},
    {"level": 3, "min": 34, "max": 50},
    {"level": 4, "min": 51, "max": 67},
    {"level": 5, "min": 68, "max": 84},
    {"level": 6, "min": 85, "max": 100},
]


def score_to_level(score: int) -> int:
    """Convert a 0-100 score to a 1-6 level."""
    for threshold in LEVEL_THRESHOLDS:
        if threshold["min"] <= score <= threshold["max"]:
            return threshold["level"]
    return 1


def weighted_rolling_average(scores: list[int]) -> int:
    """Calculate weighted rolling average — recent sessions weighted higher."""
    if not scores:
        return 0
    weights = [5, 4, 3, 2, 1]
    total_weight = 0
    total_score = 0
    for i, score in enumerate(scores[:5]):
        weight = weights[i] if i < len(weights) else 1
        total_score += score * weight
        total_weight += weight
    return round(total_score / total_weight)


def calculate_dimension_scores(
    pronunciation_score: int,
    vocabulary_score: int,
    grammar_score: int,
) -> dict:
    """Calculate levels from dimension scores."""
    overall_score = round((pronunciation_score + vocabulary_score + grammar_score) / 3)
    return {
        "pronunciation_score": pronunciation_score,
        "vocabulary_score": vocabulary_score,
        "grammar_score": grammar_score,
        "overall_score": overall_score,
        "pronunciation_level": score_to_level(pronunciation_score),
        "vocabulary_level": score_to_level(vocabulary_score),
        "grammar_level": score_to_level(grammar_score),
        "overall_level": score_to_level(overall_score),
    }
