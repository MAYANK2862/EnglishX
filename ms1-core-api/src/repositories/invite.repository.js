const { query } = require('../config/database');

const inviteRepository = {
  async create({ id, email, batchId, invitedBy, token, expiresAt }) {
    const result = await query(
      `INSERT INTO invites (id, email, batch_id, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, email, batchId, invitedBy, token, expiresAt]
    );
    return result.rows[0];
  },

  async findByToken(token) {
    const result = await query(
      'SELECT * FROM invites WHERE token = $1',
      [token]
    );
    return result.rows[0] || null;
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM invites WHERE email = $1 ORDER BY created_at DESC',
      [email]
    );
    return result.rows;
  },

  async markAccepted(id) {
    await query(
      "UPDATE invites SET status = 'accepted' WHERE id = $1",
      [id]
    );
  },

  async markExpired(id) {
    await query(
      "UPDATE invites SET status = 'expired' WHERE id = $1",
      [id]
    );
  },

  async findByBatchId(batchId) {
    const result = await query(
      `SELECT i.*, u.name as invited_by_name 
       FROM invites i
       LEFT JOIN users u ON i.invited_by = u.id
       WHERE i.batch_id = $1
       ORDER BY i.created_at DESC`,
      [batchId]
    );
    return result.rows;
  },

  async findAllByAdmin(adminId) {
    const result = await query(
      `SELECT i.*, b.name as batch_name
       FROM invites i
       LEFT JOIN batches b ON i.batch_id = b.id
       WHERE i.invited_by = $1
       ORDER BY i.created_at DESC`,
      [adminId]
    );
    return result.rows;
  },
};

module.exports = inviteRepository;
