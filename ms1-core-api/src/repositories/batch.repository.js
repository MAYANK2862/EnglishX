const { query } = require('../config/database');

const batchRepository = {
  async create({ id, name, adminId, description }) {
    const result = await query(
      `INSERT INTO batches (id, name, admin_id, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name, adminId, description || null]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query('SELECT * FROM batches WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByAdminId(adminId) {
    const result = await query(
      `SELECT b.*, COUNT(u.id)::int as student_count
       FROM batches b
       LEFT JOIN users u ON u.batch_id = b.id AND u.role = 'learner'
       WHERE b.admin_id = $1
       GROUP BY b.id
       ORDER BY b.created_at DESC`,
      [adminId]
    );
    return result.rows;
  },

  async findAll() {
    const result = await query(
      `SELECT b.*, COUNT(u.id)::int as student_count, adm.name as admin_name
       FROM batches b
       LEFT JOIN users u ON u.batch_id = b.id AND u.role = 'learner'
       LEFT JOIN users adm ON b.admin_id = adm.id
       GROUP BY b.id, adm.name
       ORDER BY b.created_at DESC`
    );
    return result.rows;
  },

  async findByName(name) {
    const result = await query('SELECT * FROM batches WHERE name = $1', [name]);
    return result.rows[0] || null;
  },
};

module.exports = batchRepository;
