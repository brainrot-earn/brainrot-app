# Brainrot

**Scroll-to-earn.** You spend hours on TikTok, Reels and Shorts making them money. Brainrot flips it so your watch time pays you back in $ROT.

Website: [brainrotcoin.me](https://brainrotcoin.me) · X: [@rotdotfun](https://x.com/rotdotfun)

---

## Status: early prototype

This repo is the start of the Brainrot app. Right now it contains the **rewards engine**, the part that decides how much $ROT a day of scrolling is worth.

| Part | Status |
|---|---|
| Rewards engine (`src/`) | ✅ Working prototype, tested |
| Earn page (`web/earn.html`) | 🧪 Preview: reads your TikTok file and shows your score, doesn't save or pay yet |
| Saving submissions (database) | ⏳ Not built yet |
| Hourly payouts to wallets | ⏳ Not built yet |
| Instagram Reels & YouTube Shorts | 🗓 Planned |

Nothing here pays out tokens yet. Brainrot launches once saving and payouts work. Updates will be posted on [@rotdotfun](https://x.com/rotdotfun) as each part is built.

## How the earn page works

1. Connect your Phantom wallet.
2. Upload the data file TikTok gives you (Settings → Account → Download your data, JSON format).
3. The page reads your watch history **in your browser**. The file is never uploaded anywhere. You can check this in [`web/earn.html`](web/earn.html): the file is only opened with `JSZip` / `file.text()` and nothing is sent over the network.
4. It estimates your watch time from the gaps between videos and scores it with the same rules as the engine below.

## How the rewards engine works

1. **Watch events in.** Each video view comes in as `{ platform, videoId, start, end }`.
2. **Sessions.** Views close together are merged into one session. A gap of more than 2 minutes starts a new one. Overlapping views are only counted once.
3. **Anti-abuse checks.**
   - Sessions under 1 minute earn nothing.
   - A session where one video "plays" for ages (phone left on a loop) is flagged as idle and earns nothing.
4. **Diminishing returns.** The first 2 hours of the day earn the full rate, the next 2 hours earn half, and anything after that earns 10%.
5. **Daily cap.** Nobody can earn more than the daily cap, no matter how long they scroll.

All the numbers live in `DEFAULT_CONFIG` in [`src/rewards.js`](src/rewards.js) and will be tuned before launch of the app.

## Try it

Needs [Node.js](https://nodejs.org) 18 or newer. No other installs.

```bash
npm run demo   # runs a sample day of scrolling through the engine
npm test       # runs the test suite
```

Demo output:

```
08:00  tiktok   0h 17m  ->   166.67 $ROT
12:30  tiktok   0h 30m  ->      300 $ROT
15:00  tiktok    1h 0m  ->        0 $ROT  (looks idle, not counted)
18:00  tiktok    0h 1m  ->        0 $ROT  (too short, not counted)
22:00  tiktok   1h 50m  ->   916.67 $ROT

counted watch time: 2h 37m
total: 1383.33 $ROT
```

## Project layout

```
src/sessions.js      watch events -> sessions
src/rewards.js       sessions -> $ROT (tiers, anti-abuse, daily cap)
src/index.js         full pipeline for one user's day
examples/demo.js     sample day
web/earn.html        the earn page on brainrotcoin.me
test/                tests
```

## Disclaimer

$ROT is a cryptocurrency token and its price can go to zero. Nothing here is financial advice or a promise of returns. Brainrot is not affiliated with TikTok, Instagram or YouTube.

## License

MIT
