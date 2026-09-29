// Turns raw watch events into watch sessions.
//
// A watch event is one video view reported by a platform:
//   { platform: "tiktok", videoId: "abc", start: <ms timestamp>, end: <ms timestamp> }
//
// Views that follow each other with a short gap are merged into one session.
// A long gap means the user put the phone down, so a new session starts.

const DEFAULT_MAX_GAP_MS = 2 * 60 * 1000; // 2 minutes

function validateEvent(e) {
  if (!e || typeof e !== "object") return "event must be an object";
  if (typeof e.platform !== "string" || !e.platform) return "missing platform";
  if (typeof e.videoId !== "string" || !e.videoId) return "missing videoId";
  if (!Number.isFinite(e.start) || !Number.isFinite(e.end)) return "start and end must be numbers";
  if (e.end <= e.start) return "end must be after start";
  return null;
}

function buildSessions(events, { maxGapMs = DEFAULT_MAX_GAP_MS } = {}) {
  const valid = [];
  const rejected = [];
  for (const e of events) {
    const err = validateEvent(e);
    if (err) rejected.push({ event: e, reason: err });
    else valid.push(e);
  }

  valid.sort((a, b) => a.start - b.start);

  const sessions = [];
  let current = null;

  for (const e of valid) {
    // Overlapping views (two videos "playing" at once) only count once.
    if (current && e.start - current.end <= maxGapMs && e.platform === current.platform) {
      const overlap = Math.max(0, current.end - e.start);
      const add = Math.max(0, e.end - Math.max(e.start, current.end));
      current.watchMs += add;
      current.overlapMs += Math.min(overlap, e.end - e.start);
      current.end = Math.max(current.end, e.end);
      current.videos.add(e.videoId);
    } else {
      current = {
        platform: e.platform,
        start: e.start,
        end: e.end,
        watchMs: e.end - e.start,
        overlapMs: 0,
        videos: new Set([e.videoId]),
      };
      sessions.push(current);
    }
  }

  return {
    sessions: sessions.map((s) => ({ ...s, videoCount: s.videos.size, videos: undefined })),
    rejected,
  };
}

module.exports = { buildSessions, validateEvent, DEFAULT_MAX_GAP_MS };
