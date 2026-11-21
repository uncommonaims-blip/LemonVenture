# LemonVenture

A phone-friendly Road Home lemonade business game. v0.3 replaces the instant sales calculator with a live, top-down stand: a walking player, animated customers, timed station actions, ingredients, drink preparation, earnings pickup, and upgrades.

## Play

Press and hold anywhere in the courtyard for 180 ms, then drag to move. The faint floating joystick anchors to the initial press. Drag farther to walk faster; release to stop. Pointer cancellation, lost capture, window blur, opening the stand menu, pausing, and hiding the page all clear movement. Only the first active pointer controls the avatar. Desktop players can also use arrows or WASD.

Stand still in a floor ring to work. Progress rings show the action completing:

1. LEMONS: gather one lemon for $0.25, up to bag capacity.
2. ICE: gather one ice for $0.25, up to bag capacity.
3. MIX: use one of each ingredient to make a drink.
4. SERVE: hand a drink to the first waiting customer. Customers walk in, queue, wait, take their drink, and leave.
5. CASH: collect earnings left by customers.
6. UPGRADE: open upgrades after standing on the marker.

Five percent of each sale goes to the virtual community fund. Money remains at the cash station until collected. A practice grant is available if the player runs out of working capital and cannot finish a drink. All money and contributions are fictional.

Stand settings allow changing the name, color, and price, purchasing upgrades, reviewing totals, or starting fresh after confirmation. The live world pauses while settings are open. The game fits the viewport with no page scrolling.

## Run and test

Node.js 20+ and Python 3, with no package installation or build needed:

```sh
npm test
npm run dev
```

Open http://localhost:3000. Serve the repository root on a static host. GitHub Actions tests and deploys to GitHub Pages on pushes to main.

## Source

- `src/stand.js`: resource transactions, upgrades, save migration, and input math.
- `src/walkabout.js`: canvas illustration and animation, customer queue, movement, station interactions, UI, and browser persistence.
- `src/game.js`: retained original daily-simulation rules for future balancing reference.
- `src/app.js`: retained original dashboard controller, no longer loaded by the page.
- `tests/`: economy, persistence, and floating-joystick behavior.

Progress saves locally after each transaction. The first visit migrates legacy v1 balances, stock, customizations, and upgrades into the separate v3 save key; the old save remains intact. There are no accounts, cloud saves, analytics, or external assets. Visible customer positions and the avatar position reset on reload; ingredients, drinks, pending earnings, and business totals persist.
