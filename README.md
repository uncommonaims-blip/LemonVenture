# LemonVenture

A phone-friendly lemonade business game for Road Home. Framework v0.1 includes stand customization, supply purchases, pricing, deterministic weather and demand, daily sales reports, upgrades, a virtual community fund, and browser-local saved progress.

## Run

Use Node.js 20+ for tests and Python 3 for the development server. No package installation or build is needed.

```sh
npm test
npm run dev
```

Open http://localhost:3000. Serve the repository root on any static host. ES modules require HTTP, so opening index.html directly from disk is unsupported.

## Structure

- `src/game.js`: pure state transitions, balancing constants, save validation.
- `src/app.js`: DOM rendering, input handling, browser persistence.
- `style.css`: responsive visual design and CSS stand illustration.
- `tests/game.test.js`: economy, inventory, upgrade, and persistence checks.

## Economy

Start with $40. Supplies cost $0.50 per cup. Five percent of sales moves to the virtual community fund. The journal reports cup margin after ingredient usage and community contribution; this is not net business profit, since upgrades and spoiled inventory also cost money. Weather cycles predictably for early balancing. There are no real purchases or real donations.

## Next milestones

1. Playtest pricing, progression, and age-appropriate learning prompts.
2. Add animated customers and an interactive service phase.
3. Expand recipes, locations, stand tiers, and community projects.
4. Connect educational activities to real Road Home stands.

Progress is saved only in this browser; there are no accounts or cloud saves. Reset asks for confirmation. External Google Fonts are optional, with local font fallbacks. No analytics or backend services are included.
