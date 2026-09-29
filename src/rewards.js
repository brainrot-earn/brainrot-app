// Calculates how much $ROT a day of watch sessions would earn.
//
// Rules (all tunable in DEFAULT_CONFIG):
//  - Sessions shorter than minSessionMs earn nothing (stops spam-opening the app).
//  - A session where the user watches very few videos for a long time looks
//    like a phone left playing on its own, so it is flagged and earns nothing.
//  - Rewards shrink after the first hours of the day (diminishing returns).
//  - Every user has a hard daily cap.
//
// This file only does the math. It does not pay anyone.

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

const DEFAULT_CONFIG = {
  ratePerMinute: 10, // $ROT per minute in the first tier
  minSessionMs: 1 * MIN,
  maxMsPerVideo: 10 * MIN, // longer than this per video looks idle
  tiers: [
    { upToMs: 2 * HOUR, multiplier: 1 },
    { upToMs: 4 * HOUR, multiplier: 0.5 },
    { upToMs: Infinity, multiplier: 0.1 },
  ],
  dailyCap: 2000,
};

function checkSession(session, config) {
  if (session.watchMs < config.minSessionMs) return "too short";
  const msPerVideo = session.watchMs / Math.max(1, session.videoCount);
  if (msPerVideo > config.maxMsPerVideo) return "looks idle";
  return null;
}

// Applies the tiers to a block of watch time, given how much was already
// counted earlier that day.
function tieredMinutes(watchMs, alreadyCountedMs, tiers) {
  let remaining = watchMs;
  let cursor = alreadyCountedMs;
  let weighted = 0;
  let floor = 0;
  for (const tier of tiers) {
    if (remaining <= 0) break;
    const tierStart = floor;
    floor = tier.upToMs;
    if (cursor >= tier.upToMs) continue;
    const from = Math.max(cursor, tierStart);
    const room = tier.upToMs - from;
    const used = Math.min(room, remaining);
    weighted += (used / MIN) * tier.multiplier;
    remaining -= used;
    cursor = from + used;
  }
  return weighted;
}

function calculateDailyRewards(sessions, config = DEFAULT_CONFIG) {
  const ordered = [...sessions].sort((a, b) => a.start - b.start);
  let countedMs = 0;
  let raw = 0;
  const breakdown = [];

  for (const s of ordered) {
    const flag = checkSession(s, config);
    if (flag) {
      breakdown.push({ start: s.start, platform: s.platform, watchMs: s.watchMs, earned: 0, flag });
      continue;
    }
    const minutes = tieredMinutes(s.watchMs, countedMs, config.tiers);
    const earned = minutes * config.ratePerMinute;
    countedMs += s.watchMs;
    raw += earned;
    breakdown.push({ start: s.start, platform: s.platform, watchMs: s.watchMs, earned: round(earned), flag: null });
  }

  const total = Math.min(raw, config.dailyCap);
  return {
    total: round(total),
    capped: raw > config.dailyCap,
    countedMs,
    breakdown,
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { calculateDailyRewards, tieredMinutes, checkSession, DEFAULT_CONFIG };
