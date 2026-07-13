const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const sessionRepository = require('../repositories/session.repository');
const levelRepository = require('../repositories/level.repository');
const userRepository = require('../repositories/user.repository');

// Level thresholds: score ranges for L1-L6
const LEVEL_THRESHOLDS = [
  { level: 1, min: 0, max: 16 },
  { level: 2, min: 17, max: 33 },
  { level: 3, min: 34, max: 50 },
  { level: 4, min: 51, max: 67 },
  { level: 5, min: 68, max: 84 },
  { level: 6, min: 85, max: 100 },
];

function scoreToLevel(score) {
  const threshold = LEVEL_THRESHOLDS.find((t) => score >= t.min && score <= t.max);
  return threshold ? threshold.level : 1;
}

// Weighted rolling average: recent sessions weighted more heavily
function weightedRollingAverage(scores) {
  if (scores.length === 0) return 0;
  const weights = [5, 4, 3, 2, 1]; // most recent = highest weight
  let totalWeight = 0;
  let totalScore = 0;

  scores.forEach((score, index) => {
    const weight = weights[index] || 1;
    totalScore += score * weight;
    totalWeight += weight;
  });

  return Math.round(totalScore / totalWeight);
}

const sessionService = {
  async startSession({ userId, mode }) {
    const session = await sessionRepository.create({
      id: uuidv4(),
      userId,
      mode,
    });
    return session;
  },

  async addTurn(sessionId, turn) {
    return sessionRepository.addTurn(sessionId, turn);
  },

  async endSession(sessionId, { durationSeconds, turnCount, transcript, audioUrl }) {
    return sessionRepository.endSession(sessionId, {
      durationSeconds,
      turnCount,
      transcript,
      audioUrl,
    });
  },

  async getSessionById(sessionId) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  },

  async getSessionHistory(userId, limit) {
    return sessionRepository.findByUserId(userId, limit);
  },

  async getRecentSessions(userId, limit) {
    return sessionRepository.findRecentByUserId(userId, limit);
  },

  async saveFeedbackAndUpdateLevels(sessionId, userId, feedbackData) {
    const {
      pronunciationScore, vocabularyScore, grammarScore,
      pronunciationDetails, vocabularyDetails, grammarDetails, strengths,
    } = feedbackData;

    const overallScore = Math.round(
      (pronunciationScore + vocabularyScore + grammarScore) / 3
    );

    const report = await levelRepository.createFeedbackReport({
      id: uuidv4(),
      sessionId,
      userId,
      pronunciationScore,
      vocabularyScore,
      grammarScore,
      overallScore,
      pronunciationDetails,
      vocabularyDetails,
      grammarDetails,
      strengths,
    });

    // Record level history for each dimension
    const dimensions = [
      { dimension: 'pronunciation', score: pronunciationScore },
      { dimension: 'vocabulary', score: vocabularyScore },
      { dimension: 'grammar', score: grammarScore },
      { dimension: 'overall', score: overallScore },
    ];

    const levelUpdates = {};

    for (const dim of dimensions) {
      const recentScores = await levelRepository.getRecentScores(userId, dim.dimension, 5);
      recentScores.unshift(dim.score);
      const rollingAvg = weightedRollingAverage(recentScores.slice(0, 5));
      const level = scoreToLevel(rollingAvg);

      await levelRepository.recordLevelHistory({
        id: uuidv4(),
        userId,
        dimension: dim.dimension,
        level,
        score: rollingAvg,
        sessionId,
      });

      levelUpdates[`${dim.dimension}Level`] = level;
    }

    await userRepository.updateLevels(userId, {
      pronunciationLevel: levelUpdates.pronunciationLevel,
      vocabularyLevel: levelUpdates.vocabularyLevel,
      grammarLevel: levelUpdates.grammarLevel,
      overallLevel: levelUpdates.overallLevel,
    });

    await userRepository.updateLastPracticed(userId);

    return {
      report,
      levels: levelUpdates,
    };
  },

  async getFeedbackBySession(sessionId) {
    const report = await levelRepository.findFeedbackBySessionId(sessionId);
    if (!report) throw new Error('Feedback report not found');
    return report;
  },

  async getFeedbackHistory(userId, limit) {
    return levelRepository.findFeedbackByUserId(userId, limit);
  },

  async getLevelTrend(userId, dimension) {
    return levelRepository.getLevelHistory(userId, dimension, 20);
  },
};

module.exports = sessionService;
