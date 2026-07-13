const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const config = require('../config');
const inviteRepository = require('../repositories/invite.repository');
const batchRepository = require('../repositories/batch.repository');
const userRepository = require('../repositories/user.repository');
const emailService = require('./email.service');

const INVITE_EXPIRY_DAYS = 7;

const inviteService = {
  async createInvite({ email, batchId, adminId }) {
    const batch = await batchRepository.findById(batchId);
    if (!batch) {
      throw new Error('Batch not found');
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingInvites = await inviteRepository.findByEmail(email);
    const pendingInvite = existingInvites.find((i) => i.status === 'pending');
    if (pendingInvite) {
      throw new Error('A pending invite already exists for this email');
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await inviteRepository.create({
      id: uuidv4(),
      email,
      batchId,
      invitedBy: adminId,
      token,
      expiresAt,
    });

    const inviteLink = `${config.frontend.url}/join?token=${token}`;

    await emailService.sendInviteEmail({
      to: email,
      batchName: batch.name,
      inviteLink,
    });

    return invite;
  },

  async getInvitesByAdmin(adminId) {
    return inviteRepository.findAllByAdmin(adminId);
  },

  async getInvitesByBatch(batchId) {
    return inviteRepository.findByBatchId(batchId);
  },

  async validateInviteToken(token) {
    const invite = await inviteRepository.findByToken(token);
    if (!invite) {
      throw new Error('Invalid invite token');
    }
    if (invite.status !== 'pending') {
      throw new Error('Invite has already been used or expired');
    }
    if (new Date(invite.expires_at) < new Date()) {
      await inviteRepository.markExpired(invite.id);
      throw new Error('Invite has expired');
    }
    return {
      email: invite.email,
      batchId: invite.batch_id,
      status: invite.status,
    };
  },
};

module.exports = inviteService;
