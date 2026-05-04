# Final Tap Wins — Website

Landing page for the Final Tap Wins Telegram mini-app game.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview   # preview the production build
```

## CTA Configuration

All call-to-action buttons are driven by a single global variable in `js/main.js`:

```js
window.CTA_LABEL = 'Coming Soon';
```

Change this value to update every CTA across the site. Each button carries a `data-cta` attribute for targeted styling or future per-button labels.
