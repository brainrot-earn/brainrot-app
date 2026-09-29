const test = require("node:test");
const assert = require("node:assert");
const { buildSessions } = require("../src/sessions");
const { calculateDailyRewards, tieredMinutes, DEFAULT_CONFIG } = require("../src/rewards");
const { scoreDay } = require("../src");

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

function views(start, count, secs, platform = "tiktok") {
  const out = [];
  let t = start;
  for (let i = 0; i < count; i++) {
    out.push({ platform, videoId: `${start}-${i}`, start: t, end: t + secs * 1000 });
    t += secs * 1000 + 1000;
  }
  return out;
}

test("back-to-back views merge into one session", () => {
  const { sessions } = buildSessions(views(0, 10, 30));
  assert.strictEqual(sessions.length, 1);
  assert.strictEqual(sessions[0].videoCount, 10);
  assert.strictEqual(sessions[0].watchMs, 10 * 30 * 1000);
});

test("a long break starts a new session", () => {
  const events = [...views(0, 5, 30), ...views(60 * MIN, 5, 30)];
  assert.strictEqual(buildSessions(events).sessions.length, 2);
});

test("overlapping views are not double counted", () => {
  const events = [
    { platform: "tiktok", videoId: "a", start: 0, end: 60000 },
    { platform: "tiktok", videoId: "b", start: 30000, end: 90000 },
  ];
  const [s] = buildSessions(events).sessions;
  assert.strictEqual(s.watchMs, 90000);
});

test("bad events are rejected, not counted", () => {
  const { sessions, rejected } = buildSessions([
    { platform: "tiktok", videoId: "a", start: 100, end: 50 },
    { platform: "", videoId: "b", start: 0, end: 10 },
  ]);
  assert.strictEqual(sessions.length, 0);
  assert.strictEqual(rejected.length, 2);
});

test("first tier pays the full rate", () => {
  assert.strictEqual(tieredMinutes(60 * MIN, 0, DEFAULT_CONFIG.tiers), 60);
});

test("rewards shrink after the first tier", () => {
  // 1h already counted, 2h more: 1h at x1, 1h at x0.5
  assert.strictEqual(tieredMinutes(2 * HOUR, HOUR, DEFAULT_CONFIG.tiers), 90);
});

test("short sessions earn nothing", () => {
  const r = calculateDailyRewards(buildSessions(views(0, 1, 20)).sessions);
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.breakdown[0].flag, "too short");
});

test("one video playing for an hour is flagged as idle", () => {
  const r = scoreDay([{ platform: "tiktok", videoId: "loop", start: 0, end: HOUR }]);
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.breakdown[0].flag, "looks idle");
});

test("daily cap is enforced", () => {
  const r = scoreDay(views(0, 1500, 25));
  assert.strictEqual(r.total, DEFAULT_CONFIG.dailyCap);
  assert.strictEqual(r.capped, true);
});
