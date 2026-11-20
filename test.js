/* Node test for Daily Cooking. Run: node test.js
   Checks the recipe data and the shopping list logic in app.js,
   including the known Week 1 corrections. */
var fs = require("fs");
var assert = require("assert");
var data = JSON.parse(fs.readFileSync("recipes.json", "utf8"));
var logic = require("./app.js");

assert.strictEqual(data.recipes.length, 49, "recipe count should be 49");
assert.strictEqual(data.meta.fromSpace, 31, "base recipes from the Space");
assert.strictEqual(data.meta.newFromScouting, 18, "new recipes from scouting");

var bySlug = {};
data.recipes.forEach(function (r) { bySlug[r.slug] = r; });

// Every recipe has a name, url, steps, and structured ingredients.
data.recipes.forEach(function (r) {
  assert.ok(r.name && r.url && r.url.indexOf("https://vismaifood.com/en/") === 0, r.slug + " url");
  assert.ok(Array.isArray(r.steps) && r.steps.length >= 3, r.slug + " steps");
  assert.ok(Array.isArray(r.ingredients) && r.ingredients.length >= 3, r.slug + " ingredients");
  r.ingredients.forEach(function (ing) {
    assert.ok(ing.k && ing.n && ing.d, r.slug + " ingredient fields");
    assert.strictEqual(typeof ing.a, "number", r.slug + " ingredient amount is a number: " + ing.d);
    assert.ok(ing.u && ing.g, r.slug + " ingredient unit/group");
  });
});

// No em dashes in any site copy.
["recipes.json", "app.js", "index.html", "styles.css", "manifest.json", "sw.js", "README.md"].forEach(function (f) {
  var text = fs.readFileSync(f, "utf8");
  assert.ok(text.indexOf("\u2014") === -1, f + " must not contain an em dash");
});

// Week 1 plan: 19 dishes, Nov 19-26 2026.
var week = data.meta.week1;
var slugs = [];
week.days.forEach(function (d) { slugs = slugs.concat(d.dishes); });
assert.strictEqual(slugs.length, 19, "Week 1 has 19 dishes");
slugs.forEach(function (s) { assert.ok(bySlug[s], "Week 1 dish exists: " + s); });

// Shopping list for Week 1 at 2 servings.
var companions = {};
week.days.forEach(function (d) {
  Object.keys(d.companions || {}).forEach(function (s) { companions[s] = d.companions[s]; });
});
var list = logic.aggregateShopping(bySlug, slugs, 2, companions);
var find = function (key) { return list.filter(function (it) { return it.key === key; }); };
var total = function (key) { return find(key).reduce(function (sum, it) { return sum + it.amount; }, 0); };

assert.ok(list.length > 30, "shopping list has many items, got " + list.length);
list.forEach(function (it) {
  assert.ok(it.amount > 0, it.key + " has a quantity");
  assert.ok(it.buy > 0, it.key + " has a buy amount");
  assert.ok(it.label && it.buyLabel, it.key + " has labels");
});

// Known corrections from Week 1.
assert.ok(total("potato") >= 900 && total("potato") <= 1000, "potato total about 950 g, got " + total("potato"));
assert.ok(total("tomato") >= 18 && total("tomato") <= 20, "tomato total about 19 pcs, got " + total("tomato"));
assert.strictEqual(total("eggs"), 19, "eggs total 19, got " + total("eggs"));
assert.ok(total("curd") >= 350 && total("curd") <= 400, "curd total about 375 g, got " + total("curd"));
assert.ok(total("cashew") >= 80 && total("cashew") <= 130, "cashew total about 100 g, got " + total("cashew"));
assert.ok(total("onion") >= 14 && total("onion") <= 16, "onion total about 15 pcs, got " + total("onion"));

// Serving scaling: 4 servings doubles the Week 1 totals.
var list4 = logic.aggregateShopping(bySlug, slugs, 4, companions);
var total4 = function (key) { return list4.filter(function (it) { return it.key === key; }).reduce(function (sum, it) { return sum + it.amount; }, 0); };
assert.strictEqual(total4("eggs"), 38, "eggs double at 4 servings");

// Removing a dish changes the list: drop the omelette, eggs fall by 6.
var fewer = slugs.filter(function (s) { return s !== "cheese-bread-omelette"; });
var listFewer = logic.aggregateShopping(bySlug, fewer, 2, companions);
var eggsFewer = listFewer.filter(function (it) { return it.key === "eggs"; }).reduce(function (sum, it) { return sum + it.amount; }, 0);
assert.strictEqual(eggsFewer, 13, "eggs fall to 13 without the omelette");

console.log("All tests passed.");
console.log("Recipes:", data.recipes.length, "(31 from the Space, 18 new from scouting)");
console.log("Week 1 shopping items:", list.length);
console.log("Week 1 totals: potato", total("potato"), "g; tomato", total("tomato"), "pcs; eggs", total("eggs"), "; curd", total("curd"), "g; cashew", total("cashew"), "g; onion", total("onion"), "pcs");
