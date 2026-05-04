/**
 * Global CTA label — change this single value to update every
 * call-to-action button across the site.
 */
window.CTA_LABEL = 'Coming Soon';

// Apply CTA label to all [data-cta] elements
document.querySelectorAll('[data-cta]').forEach((el) => {
  el.textContent = window.CTA_LABEL;
});

// ── live ticker — duplicated content for seamless loop ──
const tickerData = [
  { who: 'KADE',  amt: 595,  room: '9F·K2T' },
  { who: 'MIRA',  amt: 170,  room: '2K·X9P' },
  { who: 'AIKO',  amt: 425,  room: '7H·R8M' },
  { who: 'JONAH', amt: 850,  room: '5G·LN3' },
  { who: 'SAM',   amt: 240,  room: '1A·QQ7' },
  { who: 'NOORA', amt: 1180, room: '4D·M9X' },
  { who: 'MARCO', amt: 320,  room: '6P·V2L' },
  { who: 'JULES', amt: 95,   room: '8R·T3K' },
];

function fmtNum(n) {
  return n.toLocaleString('en-US').replace(/,/g, '\u202F');
}

const items = tickerData
  .map(
    (t) =>
      `<span class="item"><span class="dot"></span><span class="winner">${t.who}</span> won <strong>${fmtNum(t.amt)} CR</strong> · ${t.room}</span>`
  )
  .join('');

document.getElementById('tickerTrack').innerHTML = items + items; // doubled for loop

// ── live pot ticker — slow random walk on hero pot ──
const heroPot = document.getElementById('heroPot');
let pot = 1240;
setInterval(() => {
  if (Math.random() < 0.7) {
    pot += Math.random() < 0.4 ? 100 : Math.floor(Math.random() * 20);
    heroPot.textContent = fmtNum(pot);
  }
}, 1800);

// ── live pot in stats also nudges ──
const statLive = document.getElementById('statLive');
let live = 3800;
setInterval(() => {
  live += Math.floor(Math.random() * 50) - 10;
  statLive.textContent = fmtNum(Math.max(0, live));
}, 2400);

// ── paid out counter — slowly counts up ──
const statPaid = document.getElementById('statPaid');
let paid = 2184050;
setInterval(() => {
  paid += Math.floor(Math.random() * 200) + 50;
  statPaid.textContent = fmtNum(paid);
}, 2000);

// ── players online — small flutter ──
const statPlayers = document.getElementById('statPlayers');
let players = 1247;
setInterval(() => {
  players += Math.floor(Math.random() * 7) - 3;
  statPlayers.textContent = fmtNum(Math.max(0, players));
}, 3200);
