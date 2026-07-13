const { query } = require('../config/database');

const levelRepository = {
  async createFeedbackReport({
    id, sessionId, userId,
    pronunciationScore, vocabularyScore, grammarScore, overallScore,
    pronunciationDetails, vocabularyDetails, grammarDetails, strengths,
  }) {
    const result = await query(
      `INSERT INTO feedback_reports (
        id, session_id, user_id,
        pronunciation_score, vocabulary_score, grammar_score, overall_score,
        pronunciation_details, vocabulary_details, grammar_details, strengths
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        id, sessionId, userId,
        pronunciationScore, vocabularyScore, grammarScore, overallScore,
        JSON.stringify(pronunciationDetails),
        JSON.stringify(vocabularyDetails),
        JSON.stringify(grammarDetails),
        JSON.stringify(strengths),
      ]
    );
    return result.rows[0];
  },

  async findFeedbackBySessionId(sessionId) {
    const result = await query(
      'SELECT * FROM feedback_reports WHERE session_id = $1',
      [sessionId]
    );
    return result.rows[0] || null;
  },

  async findFeedbackByUserId(userId, limit = 10) {
    const result = await query(
      `SELECT fr.*, s.mode, s.started_at as session_date
       FROM feedback_reports fr
       JOIN sessions s ON fr.session_id = s.id
       WHERE fr.user_id = $1
       ORDER BY fr.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async recordLevelHistory({ id, userId, dimension, level, score, sessionId }) {
    const result = await query(
      `INSERT INTO level_history (id, user_id, dimension, level, score, session_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, userId, dimension, level, score, sessionId]
    );
    return result.rows[0];
  },

  async getLevelHistory(userId, dimension, limit = 10) {
    const result = await query(
      `SELECT * FROM level_history 
       WHERE user_id = $1 AND dimension = $2
       ORDER BY recorded_at DESC
       LIMIT $3`,
      [userId, dimension, limit]
    );
    return result.rows;
  },

  async getRecentScores(userId, dimension, limit = 5) {
    const result = await query(
      `SELECT score FROM level_history
       WHERE user_id = $1 AND dimension = $2
       ORDER BY recorded_at DESC
       LIMIT $3`,
      [userId, dimension, limit]
    );
    return result.rows.map((r) => r.score);
  },

  async saveRefreshToken({ id, userId, tokenHash, expiresAt }) {
    await query(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [id, userId, tokenHash, expiresAt]
    );
  },

  async findRefreshToken(tokenHash) {
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND is_revoked = false AND expires_at > NOW()',
      [tokenHash]
    );
    return result.rows[0] || null;
  },

  async revokeRefreshToken(id) {
    await query('UPDATE refresh_tokens SET is_revoked = true WHERE id = $1', [id]);
  },

  async revokeAllUserTokens(userId) {
    await query('UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1', [userId]);
  },
};

module.exports = levelRepository;
