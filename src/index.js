const { buildSessions } = require("./sessions");
const { calculateDailyRewards, DEFAULT_CONFIG } = require("./rewards");

// Full pipeline for one user's day: raw watch events -> sessions -> $ROT.
function scoreDay(events, config = DEFAULT_CONFIG) {
  const { sessions, rejected } = buildSessions(events);
  const result = calculateDailyRewards(sessions, config);
  return { ...result, sessions: sessions.length, rejectedEvents: rejected.length };
}

module.exports = { scoreDay };
