const { v4: uuidv4 } = require('uuid');
const batchRepository = require('../repositories/batch.repository');

const batchService = {
  async createBatch({ name, description, adminId }) {
    const existing = await batchRepository.findByName(name);
    if (existing) {
      throw new Error('A batch with this name already exists');
    }

    return batchRepository.create({
      id: uuidv4(),
      name,
      adminId,
      description,
    });
  },

  async getBatchesByAdmin(adminId) {
    return batchRepository.findByAdminId(adminId);
  },

  async getAllBatches() {
    return batchRepository.findAll();
  },

  async getBatchById(id) {
    const batch = await batchRepository.findById(id);
    if (!batch) {
      throw new Error('Batch not found');
    }
    return batch;
  },
};

module.exports = batchService;
