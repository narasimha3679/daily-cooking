# Daily Cooking

A static, mobile-first PWA. No backend, no AI, no account. All of the
planning and shopping list logic is plain JavaScript in `app.js`, and all
recipe data is bundled in `recipes.json`.

## What it does

- Browse, search and filter 49 vegetarian and egg recipes from Vismai Food
  by category (breakfast, rice, curry, egg), time and name. Each recipe
  shows ingredients with quantities, steps, time and a source link.
- Weekly planner: pick dishes for a 7-day week, up to 3 dishes a day in
  at most 2 cooking sessions. Servings are 1 to 6, default 2. The site
  never auto-generates a plan, you add the dishes.
- Shopping list: generated purely from the planned dishes, recomputed
  instantly on every add, remove, change or serving change. Identical
  ingredients are summed across dishes, scaled by servings, grouped by
  Produce, Dairy and eggs, Grains, dals and nuts, and Pantry. Every item
  shows a total quantity and a practical buy amount. Ticks persist in
  localStorage, and there is a print-friendly view.
- Loved and Not for me marks persist in localStorage. Loved dishes are
  highlighted, Not for me dishes are hidden from planner picks.
- PWA: `manifest.json`, a service worker for offline use, and app icons.
  After the first load it works offline. No network calls at runtime
  except source links to vismaifood.com, which you tap.

## Recipe data

49 recipes in total.

- 31 from the Daily Cooking Space. The Space seed text says 32, but
  `getstate` returned 31 recipes, so the base count here is 31.
- 18 newly verified from vismaifood.com/en, each read from its own
  recipe page on Nov 19, 2026: Tomato Rasam, Rice Rava Upma, Moong Dal
  Sambar, Tindora Curry, Vangi Bath Curry, Brinjal Fenugreek Fry,
  Chilli Paneer Gravy, Schezwan Veg Fried Rice, Khuska Pulao, Tamarind
  Rice, Dhaba Style Spicy Okra, Hotel Style Puri Curry, Chilli Garlic
  Veg Noodles, Okra Garlic Fry, Ridged Gourd Scrambled Eggs, Katte
  Pongal, Curd Idly, Tomato Dal.

Not covered: the rest of vismaifood.com, which has hundreds of recipes
across many more search pages. This site covers the 31 Space recipes
plus the 18 above. Three candidates were checked and left out:
Cluster Beans Fry (the page crawl had ingredients but no steps),
Carrot Peanut Fry (the page returned a bot check, so it could not be
verified), and Tomato Rice (the page crawl had no instructions section).

Amounts are as written on Vismai Food, treated as one household batch
for 2 people. Where the site gave no exact quantity, the data uses a
sensible standard amount and marks it approx. Poppy seeds are
restricted in Canada, so recipes that list them carry a note to skip
them or use roasted Bengal gram instead.

## Week 1

The planner is pre-filled with the Week 1 plan from the Space,
Nov 19-26, 2026, 19 dishes. Verified Week 1 shopping totals at
2 servings: potato about 950 g (buy 1 kg), tomato 19 pcs (buy 20),
eggs 19, curd about 375 g, cashew about 100 g, onion about 15 pcs.
Plain rice companions add 0.33 cup uncooked rice each.

## Run it locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000

## Test it

```sh
node test.js
```

The test checks the recipe data, the Week 1 totals above, serving
scaling, and that removing a dish recomputes the list.

## Deploy

This repo is a static site. On GitHub Pages it is served from the
`main` branch root. The live URL is
https://narasimha3679.github.io/daily-cooking/

## Files

- `index.html` - page shell
- `styles.css` - phone-first styles
- `app.js` - all logic, including the shopping list aggregation
- `recipes.json` - all 49 recipes, structured ingredients
- `manifest.json`, `sw.js`, `icons/` - PWA. The manifest uses an SVG
  icon so the whole repo stays plain text. PNG icons (192, 512 and 180)
  are generated in `icons/` in the workspace; upload them to `icons/`
  through the GitHub web UI if you want PNG manifest entries and an
  Apple touch icon, then add them back to `manifest.json`, `index.html`
  and the service worker file list.
- `test.js` - Node test for the data and the shopping logic
