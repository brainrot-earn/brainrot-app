// Runs a made-up day of scrolling through the rewards engine.
// Run it with:  node examples/demo.js

const { scoreDay } = require("../src");

const MIN = 60 * 1000;
const day = Date.UTC(2026, 9, 1, 0, 0, 0);

// Builds back-to-back video views: `count` videos of `secs` seconds each.
function scroll(startMin, count, secs) {
  const out = [];
  let t = day + startMin * MIN;
  for (let i = 0; i < count; i++) {
    out.push({ platform: "tiktok", videoId: `v${startMin}-${i}`, start: t, end: t + secs * 1000 });
    t += secs * 1000 + 1500; // 1.5s to swipe to the next video
  }
  return out;
}

const events = [
  ...scroll(8 * 60, 40, 25),       // morning scroll on the bus
  ...scroll(12 * 60 + 30, 90, 20), // lunch break
  ...scroll(22 * 60, 300, 22),     // the 10pm doomscroll
  ...scroll(18 * 60, 1, 45),       // opened the app for 45 seconds
  // phone left playing one video on loop for an hour
  { platform: "tiktok", videoId: "loop", start: day + 15 * 60 * MIN, end: day + 16 * 60 * MIN },
];

const result = scoreDay(events);

const fmt = (ms) => `${Math.floor(ms / 3600000)}h ${Math.round((ms % 3600000) / 60000)}m`;
console.log("brainrot rewards engine: demo day\n");
for (const s of result.breakdown) {
  const time = new Date(s.start).toISOString().slice(11, 16);
  const note = s.flag ? `  (${s.flag}, not counted)` : "";
  console.log(`${time}  ${s.platform.padEnd(7)} ${fmt(s.watchMs).padStart(7)}  ->  ${String(s.earned).padStart(7)} $ROT${note}`);
}
console.log(`\ncounted watch time: ${fmt(result.countedMs)}`);
console.log(`total: ${result.total} $ROT${result.capped ? " (hit daily cap)" : ""}`);
