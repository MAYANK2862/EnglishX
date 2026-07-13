const { Router } = require('express');
const inviteService = require('../services/invite.service');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { inviteSchema } = require('../schemas');

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('admin'),
  validate(inviteSchema),
  async (req, res) => {
    try {
      const invite = await inviteService.createInvite({
        email: req.validated.email,
        batchId: req.validated.batchId,
        adminId: req.user.id,
      });
      res.status(201).json(invite);
    } catch (err) {
      const status = err.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }
);

router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const invites = await inviteService.getInvitesByAdmin(req.user.id);
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/validate/:token', async (req, res) => {
  try {
    const result = await inviteService.validateInviteToken(req.params.token);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
