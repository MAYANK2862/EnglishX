const { Router } = require('express');
const sessionService = require('../services/session.service');
const { validate } = require('../middleware/validation.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { startSessionSchema } = require('../schemas');

const router = Router();

router.post(
  '/start',
  authenticate,
  validate(startSessionSchema),
  async (req, res) => {
    try {
      const session = await sessionService.startSession({
        userId: req.user.id,
        mode: req.validated.mode,
      });
      res.status(201).json(session);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

router.post('/:id/end', authenticate, async (req, res) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your session' });
    }

    const ended = await sessionService.endSession(req.params.id, {
      durationSeconds: req.body.durationSeconds,
      turnCount: req.body.turnCount,
      transcript: req.body.transcript,
      audioUrl: req.body.audioUrl,
    });
    res.json(ended);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/feedback', authenticate, async (req, res) => {
  try {
    const session = await sessionService.getSessionById(req.params.id);
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your session' });
    }

    const result = await sessionService.saveFeedbackAndUpdateLevels(
      req.params.id,
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/feedback', authenticate, async (req, res) => {
  try {
    const feedback = await sessionService.getFeedbackBySession(req.params.id);
    res.json(feedback);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const sessions = await sessionService.getSessionHistory(req.user.id, limit);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
