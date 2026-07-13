const { Router } = require('express');
const batchService = require('../services/batch.service');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { batchSchema } = require('../schemas');

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(batchSchema),
  async (req, res) => {
    try {
      const batch = await batchService.createBatch({
        name: req.validated.name,
        description: req.validated.description,
        adminId: req.user.id,
      });
      res.status(201).json(batch);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const batches = await batchService.getBatchesByAdmin(req.user.id);
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const batch = await batchService.getBatchById(req.params.id);
    res.json(batch);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

module.exports = router;
