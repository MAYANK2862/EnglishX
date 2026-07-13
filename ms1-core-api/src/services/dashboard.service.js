const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const levelRepository = require('../repositories/level.repository');

const dashboardService = {
  async getLearnerDashboard(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error('User not found');

    const recentSessions = await sessionRepository.findRecentByUserId(userId, 10);
    const recentFeedback = await levelRepository.findFeedbackByUserId(userId, 5);

    const pronTrend = await levelRepository.getLevelHistory(userId, 'pronunciation', 10);
    const vocabTrend = await levelRepository.getLevelHistory(userId, 'vocabulary', 10);
    const grammarTrend = await levelRepository.getLevelHistory(userId, 'grammar', 10);

    return {
      levels: {
        pronunciation: user.pronunciation_level,
        vocabulary: user.vocabulary_level,
        grammar: user.grammar_level,
        overall: user.overall_level,
      },
      trends: {
        pronunciation: pronTrend.reverse(),
        vocabulary: vocabTrend.reverse(),
        grammar: grammarTrend.reverse(),
      },
      practiceStreak: user.practice_streak,
      lastPracticedAt: user.last_practiced_at,
      recentSessions,
      recentFeedback,
    };
  },

  async getAdminDashboard(adminId) {
    const students = await userRepository.findAllLearners();

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => {
      if (!s.last_practiced_at) return false;
      const daysSincePractice = Math.floor(
        (Date.now() - new Date(s.last_practiced_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSincePractice <= 7;
    }).length;

    const inactiveStudents = students.filter((s) => {
      if (!s.last_practiced_at) return true;
      const daysSincePractice = Math.floor(
        (Date.now() - new Date(s.last_practiced_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSincePractice > 7;
    });

    return {
      totalStudents,
      activeStudents,
      inactiveCount: inactiveStudents.length,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        batchName: s.batch_name,
        batchId: s.batch_id,
        pronunciationLevel: s.pronunciation_level,
        vocabularyLevel: s.vocabulary_level,
        grammarLevel: s.grammar_level,
        overallLevel: s.overall_level,
        lastPracticedAt: s.last_practiced_at,
        practiceStreak: s.practice_streak,
        isActive: s.is_active,
      })),
      inactiveStudents: inactiveStudents.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        lastPracticedAt: s.last_practiced_at,
      })),
    };
  },
};

module.exports = dashboardService;
