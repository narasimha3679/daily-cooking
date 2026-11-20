# Daily Cooking

A static, mobile-first PWA for planning a South Indian week and shopping from it.
No backend, no AI, no account. All planning and shopping logic is plain
JavaScript in `app.js`, and all recipe data is bundled in `recipes.json`.

## What it does

- Browse, search and filter 49 vegetarian and egg recipes from Vismai Food
  by category (breakfast, rice, curry, egg), time and name. Each recipe
  shows time, base servings, ingredients, steps and a source link.
- A phone-first shell: deep green masthead, sticky search and filters, a
  fixed bottom bar for Recipes, Planner and Shopping list, and 44 px
  controls throughout.
- Weekly planner: day cards with up to 3 dish rows, add, swap and remove,
  and a searchable dish picker. A week has 7 days in a new week; the
  pre-filled Week 1 runs Nov 19 to 26, 2026 with 19 dishes. Servings are
  1 to 6, default 2. The site never auto-generates a plan.
- Recipe sheet: a bottom sheet on the phone with scaled ingredient amounts
  for the chosen servings, the source amounts kept behind a disclosure,
  numbered steps, a source link, and large Add, Swap, Remove, Loved and
  Not for me actions.
- Shopping list: generated purely from the planned dishes, recomputed
  instantly on every add, remove, change or serving change. Identical
  ingredients are summed across dishes, scaled by servings, grouped by
  Produce, Dairy and eggs, Grains, dals and nuts, and Pantry. Every item
  shows a total quantity and a practical buy amount. Picked items get a
  clear checked state and a progress count. Starting a new week resets
  the ticks.
- Loved and Not for me marks persist in localStorage. Loved dishes are
  highlighted. Not for me dishes stay visible in Recipes with a Restore
  action and are hidden from planner picks.
- PWA: `manifest.json`, a service worker for offline use, and an SVG icon.
  After the first load the whole app works offline. No network calls at
  runtime except source links to vismaifood.com, which you tap.
- Print and Copy for the shopping list.

## Recipe data

49 recipes in total.

- 31 from the Daily Cooking Space. The Space seed text says 32, but
  `getstate` returned 31 recipes, so the base count here is 31.
- 18 newly verified from vismaifood.com/en, each read from its own
  recipe page on Nov 19, 2026: Tomato Rasam, Rice Rava Upma, Moong Dal
  Sambar, Tindora Curry, Vangi Bath Curry, Brinjal Fenugreek Fry, Chilli
  Paneer Gravy, Schezwan Veg Fried Rice, Khuska Pulao, Tamarind Rice,
  Dhaba Style Spicy Okra, Hotel Style Puri Curry, Chilli Garlic Veg
  Noodles, Okra Garlic Fry, Ridged Gourd Scrambled Eggs, Katte Pongal,
  Curd Idly, Tomato Dal.

Not covered: the rest of vismaifood.com, which has hundreds of recipes
across many more search pages. Three candidates were checked and left
out: Cluster Beans Fry (the page crawl had ingredients but no steps),
Carrot Peanut Fry (the page returned a bot check, so it could not be
verified), and Tomato Rice (the page crawl had no instructions section).

Amounts are as written on Vismai Food, treated as one household batch
for 2 people. Where the site gave no exact quantity, the data uses a
sensible standard amount and marks it approx. Poppy seeds are restricted
in Canada, so recipes that list them carry a note to skip them or use
roasted Bengal gram instead.

## Week 1

The planner is pre-filled with the Week 1 plan from the Space,
Nov 19 to 26, 2026, 19 dishes. Verified Week 1 shopping totals at
2 servings: potato 950 g (buy 1 kg), tomato 19 pcs (buy 20),
eggs 19, curd 380 g, cashew 100 g, onion 15 pcs. Plain rice companions
add 0.33 cup uncooked rice each.

## Design

The UI is a warm kitchen ledger: deep green, warm cream and terracotta,
with Georgia for dish names and dates and a system humanist sans for
controls. All fonts, icons and surfaces are local. The design system is
recorded in `DESIGN.md`; the product truth is in `PRODUCT.md`.

## Run it locally

```sh
python -m http.server 8000
```

Then open http://localhost:8000

## Test it

```sh
node test.js
```

The test checks the recipe data, the Week 1 totals, serving scaling,
and that removing a dish recomputes the list.

To check the offline shell, load the site once, stop the server, then
reload. The service worker cache is `daily-cooking-v4`; bump it whenever
a cached file changes.

## Deploy

This repo is a static site. On GitHub Pages it is served from the
`main` branch root. The live URL is
https://narasimha3679.github.io/daily-cooking/

## Files

- `index.html` - page shell and the local SVG icon sprite
- `styles.css` - the phone-first design system
- `app.js` - all logic, including the shopping list aggregation
- `recipes.json` - all 49 recipes, structured ingredients
- `manifest.json`, `sw.js`, `icons/` - PWA. The manifest uses an SVG
  icon so the whole repo stays plain text.
- `PRODUCT.md` - confirmed product truth
- `DESIGN.md` - the recorded visual system
- `test.js` - Node test for the data and the shopping logic
