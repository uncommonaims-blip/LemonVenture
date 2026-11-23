# LemonVenture

A phone-friendly Road Home lemonade business game. v0.5 includes the instant sales calculator with a live, top-down stand: a walking player, animated customers, timed station actions, ingredients, drink preparation, earnings pickup, and upgrades.

## Play

Press and hold anywhere in the courtyard for 80 ms, then drag to move. The faint floating joystick anchors to the initial press. Drag farther to walk faster; release to stop. Pointer cancellation, lost capture, window blur, opening the stand menu, pausing, and hiding the page all clear movement. Only the first active pointer controls the avatar. Desktop players can also use arrows or WASD.

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

## Rearranging stations

Hold still on a station or its ring for 650 ms to enter wobble mode. Drag any of the six stations, then tap Done to resume. The world pauses while editing. Equipment and work rings move together; customer queues follow the serving counter. Positions stay inside the courtyard, and overlapping drops return to the previous position. Reset layout restores the original arrangement. Layout and business progress save together. A drag started on a station cancels the edit hold, so normal movement remains available there.

Movement speed is 30% higher (247 world units/second, previously 190), and the joystick activation hold is reduced from 180 to 80 ms.

## v0.5: team, shop and village

The shop has 14 one-time purchases across Equipment, Team and Customers, with three cards per page. Shoes improve walking speed, crates expand ingredient capacity, the mixer and counter shorten action time, flyers and banners increase arrivals, and benches extend customer patience. The existing sign, cooler and stand remain compatible with older saves.

Four animated employees can be hired: a supply runner, lemonade maker, server and cashier. They travel to stations and perform real resource transactions. They respect moved layouts, pause with the game, and resume after reload. Hiring is a one-time game purchase, without recurring wages.

Tap the community chest in the HUD or the Village tab to see the settlement. Every sale adds 5% to unspent community funds. The Contribute & build button spends only the displayed project cost and adds a permanent village feature. Early projects cost $0.50, $1, $2, $3, $5, $8, $12 and $18. Features include a second home, road, trees, garden, another home, well, school and market. Later contributions keep expanding homes and greenery. Each build plays a growth/confetti animation. The village remains visible above the stand. Unspent funds, invested funds and village level all persist.

Tests include upgrade effects, a full autonomous employee economy, layout-aware workers, legacy migration, and conservation of community funds.

## v0.6: town, rent, reputation and live pricing

Open the town map from the map button or Town tab. Select a location marker to compare terms, then explicitly move there. Locations are Backyard lane ($0/day), Riverside park ($3), School corner ($5), Market square ($9), and Beach boardwalk ($14). Visibility and baseline traffic increase with rent. Moving pays the first rent immediately and starts a new 120-second active-play timer; the next rent is charged at each new game day. Menus, wobble mode, pause, and hidden tabs stop that clock. There are no offline rent charges. If cash cannot cover rent, the game returns to the free backyard without debt; pending customer earnings remain to be collected. Moving forfeits unused prepaid time.

Invested community funds and completed village projects raise notoriety. Higher notoriety increases arrivals and customer willingness to pay. Locations also influence budgets and exposure. Customers have individual price limits and leave with a visible message if the current price is too high; their drink is not consumed. The server follows the same budget rule.

The play screen has minus/plus price buttons in $0.25 steps from $0.50 to $5, plus a typical-budget and fame indicator. Stand settings retain the price slider. Location, paid rent, day timer, reputation source data, price, and all prior business progress persist.

## v0.7: community profit share and location artwork

The Village tab has a 0–100% operating-profit share slider (default 5%). Each completed sale recognizes price minus $0.50 of ingredients used as operating profit. Rent reduces that profit. Contributions are based on newly earned positive profit above the prior high-water mark, so rent must be recovered before allocating more funds and the same profit is not shared twice. Equipment and employee purchases are treated as investments rather than operating costs. Rate changes affect future profit only. Existing saves retain their chest, invested funds and village, and begin the new operating-profit ledger at zero. Earnings and contributions are rounded to cents per sale.

Each location now has its own storefront architecture, colors and surroundings: a handmade backyard stall with a picket fence, green-roofed park kiosk by water, colorful school stand with brick and chalk details, striped market booth with lanterns, and a beach hut with palms and surf. The selected accent color remains visible. Resource stations now use drawn fruit crates, ice bins, glass mixing jugs and a cash register. Soft shadows, highlights, planks and trim add depth. Everything is drawn in the existing canvas with no image downloads, WebGL, extra framework, or large textures.

### v0.8: Lemonade empire
42 shop choices: 20 new ten-level investments with escalating prices, four additional staff hires, and four visible courtyard decorations. Tiered purchases retain level and cost across saves. Bulk contracts reduce ingredient prices, tips add sales income, premium recipes raise budgets, and staff training accelerates real work. Cup pricing now supports $0.50–$20 for premium brands. Starter upgrades and existing saves remain intact.

### v0.9: The massif village and supply road
Use the tree button to switch between stand and village. The same floating stick controls movement. Tree rings water or harvest; the shed ring dispatches lemons. Village works offers an accessible harvest action plus grove, road and transport projects. Begin with two trees, expand to twelve, buy irrigation and gardeners, and increase cart capacity. Upgraded carts depart automatically. Harvested lemons delivered to the stand replace paid lemons, including their savings in operating profit.
Road projects use the community chest: rockfalls, drainage, steep sections, a ravine bridge and surfacing. Delivery durations are 90 → 72 → 58 → 45 → 32 → 20 seconds; improvements apply to new shipments. In-flight loads retain their original ETA. Stand employees keep working while you visit the village. Growth, rent and deliveries pause in menus or while away; existing saves migrate without losing balances.

### v0.10: Original chiptune soundtrack
An original 32-bar, 104 BPM C-major loop uses soft square-wave melody, triangle accompaniment and bass. The village drops the rhythmic ticks and softens the arrangement. Web Audio generates it locally with no external tracks or downloads. Music starts after interaction; the music button and Settings volume persist independently of game saves. Manual pause and backgrounding silence the soundtrack.
