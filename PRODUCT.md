# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Home cooks planning busy weeknights for one or two people, primarily on a phone (360 to 430 px wide). They are often standing in a kitchen or shopping, one handed, with limited attention. They want to decide the week's South Indian vegetarian and egg dishes quickly, then walk into a shop with a trustworthy list.

The same planner must also serve households of 3 to 6 without changing how it works.

## Product Purpose

Daily Cooking is a static, offline-first weekly planner and shopping list for 49 verified South Indian vegetarian and egg recipes. It exists so a cook can choose dishes for a 7 day week and get an accurate, practical shopping list without a backend, an account, or an algorithm.

Success means the cook can add a dish and see the shopping list update instantly, understand every quantity and buy amount at a glance, and use the whole app with one thumb in a shop or a kitchen.

## Positioning

The shopping list is derived purely from the dishes the cook actually planned, recomputed on every add, remove, change and serving change, with identical ingredients summed across dishes and scaled by servings. Nothing is auto-generated and no plan is suggested. Recipes are verified against Vismai Food source pages and stay linked to them.

## Operating Context

- Week 1, Nov 19 to 26 2026, 19 dishes, stays pre-filled on first use.
- A week has 7 days, up to 3 dishes a day in at most 2 cooking sessions. Servings are 1 to 6, default 2.
- The shopping list groups items by Produce; Dairy and eggs; Grains, dals and nuts; and Pantry. Every item shows a total quantity and a practical buy amount.
- Loved and Not for me marks persist in localStorage. Loved dishes are highlighted and Not for me dishes are hidden from planner picks.
- Ticks on shopping items persist. The list can be printed.
- The app is installed to a phone home screen and used offline, including adding dishes and recomputing the list.

## Capabilities and Constraints

- Static site: `index.html`, `styles.css`, `app.js`, `recipes.json`, `manifest.json`, `sw.js`, `icons/icon.svg`. No backend, no build step, no framework.
- No AI, no account, no analytics, no runtime network calls except source links to vismaifood.com that the user taps.
- No external fonts, images or CDN links. System fonts and local inline SVG icons only.
- All planner and shopping logic in `app.js` must keep working exactly as it does: the aggregation, canonical units, buy rounding and serving scale are not to change.
- `recipes.json` must keep all 49 recipes and every ingredient quantity, step, time and source link. Only a proven data error from the linked Vismai Food page may be corrected.
- Service worker must cache every local asset on first load, bump its cache version on change, delete old caches on activate, and serve cached files offline.
- Manifest stays valid, standalone, SVG icon, `start_url` `./index.html`.
- Verified Week 1 totals at 2 servings must not change: potato 950 g (buy 1 kg), tomato 19 pcs (buy 20), eggs 19, curd 380 g, cashew 100 g, onion 15 pcs.

## Brand Commitments

- Name: Daily Cooking.
- Voice: plain, warm, practical, kitchen language. No hype, no em dashes.
- The look must feel like a good South Indian cooking app: warm, appetising, polished. Deep green and warm cream with a terracotta accent. No purple to blue gradients, no generic grey cards in cards, no Inter, no rounded square icon tile above every heading.

## Evidence on Hand

- 49 real recipes in `recipes.json`, each with structured ingredients, steps, time, category and a vismaifood.com source URL.
- 31 recipes from the Daily Cooking Space and 18 verified from Vismai Food.
- Verified Week 1 plan and shopping totals, exercised by `test.js`.
- No photography, no logo assets beyond `icons/icon.svg`, no testimonials, no commercial claims. Do not invent any.

## Product Principles

1. The plan is the cook's, never the app's: the cook chooses every dish.
2. The shopping list must be instantly trustworthy: same ingredients summed, servings scaled, every total and buy amount visible.
3. One thumb, one screen: the primary actions stay large, reachable and obvious on a phone.
4. Kitchen readable: high contrast, generous type, no clutter, no tiny controls.
5. Offline is the product, not a fallback.

## Accessibility & Inclusion

WCAG AA on the phone: 4.5:1 body contrast, 3:1 large text, functional 44 px touch targets, visible keyboard focus, reduced motion alternative, no horizontal scrolling, and a layout that survives 200 percent text zoom.
