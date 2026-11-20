/* Daily Cooking - pure logic, no backend, no AI.
   Recipes are stored in recipes.json. Amounts are for one household
   batch for 2 people. The shopping list scales by servings / 2.
   This file works in the browser and in Node for testing:
   the DOM code only runs when document exists. */

var CANON = {
  "onion": "pc", "tomato": "pc", "potato": "g", "garlic": "g",
  "ginger": "g", "carrot": "pc", "capsicum": "pc",
  "coriander-leaves": "tbsp", "mint-leaves": "tbsp",
  "coconut": "cup", "cashew": "g", "peanuts": "g", "rice": "cup",
  "curd": "g", "milk": "ml", "cream": "ml", "coconut-milk": "ml",
  "oil": "ml", "ghee": "g", "butter": "g", "salt": "tsp",
  "sugar": "tsp", "turmeric": "tsp", "red-chilli-powder": "tsp",
  "cumin-powder": "tsp", "coriander-powder": "tsp",
  "garam-masala": "tsp", "black-pepper": "tsp"
};

/* Convert an amount in a given unit to the canonical unit for a key.
   Returns null when the unit cannot be converted. */
function toCanon(key, amount, unit) {
  var canon = CANON[key] || unit;
  if (unit === canon) return amount;
  if (canon === "ml") {
    if (unit === "cup") return amount * 240;
    if (unit === "tbsp") return amount * 15;
    if (unit === "tsp") return amount * 5;
    if (unit === "l") return amount * 1000;
  }
  if (canon === "g") {
    if (unit === "kg") return amount * 1000;
    if (unit === "cup") return amount * 200;
    if (unit === "tbsp") return amount * 15;
    if (unit === "tsp") return amount * 5;
    if (unit === "ml") return amount;
  }
  if (canon === "tsp") {
    if (unit === "tbsp") return amount * 3;
  }
  if (canon === "tbsp") {
    if (unit === "tsp") return amount / 3;
    if (unit === "cup") return amount * 16;
    if (unit === "bunch") return amount * 8;
  }
  if (canon === "cup") {
    if (unit === "tbsp") return amount / 16;
    if (unit === "tsp") return amount / 48;
    if (unit === "g") return amount / 80;
    if (unit === "ml") return amount / 240;
  }
  if (key === "onion" && unit === "g") return amount / 150;
  if (key === "tomato" && unit === "g") return amount / 90;
  if (key === "tomato" && unit === "cup") return amount * 2;
  if (key === "potato" && unit === "pc") return amount * 150;
  if (key === "garlic" && unit === "pc") return amount * 3;
  if (key === "ginger" && unit === "tsp") return amount * 5;
  if (key === "ginger" && unit === "tbsp") return amount * 15;
  if (key === "carrot" && unit === "cup") return amount * 1;
  if (key === "capsicum" && unit === "cup") return amount * 1;
  if (key === "rice" && unit === "g") return amount / 185;
  if (key === "curd" && unit === "cup") return amount * 250;
  if (key === "curd" && unit === "ml") return amount;
  if (key === "curd" && unit === "tbsp") return amount * 15;
  if (key === "cashew" && unit === "cup") return amount * 140;
  if (key === "cashew" && unit === "tbsp") return amount * 10;
  if (key === "peanuts" && unit === "cup") return amount * 140;
  if (key === "peanuts" && unit === "tbsp") return amount * 10;
  if (key === "ghee" && unit === "ml") return amount;
  return null;
}

function roundAmount(n) {
  if (n >= 100) return Math.round(n / 10) * 10;
  if (n >= 10) return Math.round(n * 2) / 2;
  return Math.round(n * 100) / 100;
}

/* Practical buy amount: round up to a pack size the store sells. */
function buyAmount(key, amount, unit) {
  if (unit === "pc" && key === "eggs") return Math.ceil(amount / 6) * 6;
  if (unit === "pc") return Math.ceil(amount);
  if (unit === "g") return Math.ceil(amount / 50) * 50;
  if (unit === "ml") return Math.ceil(amount / 50) * 50;
  if (unit === "cup") return Math.ceil(amount * 2) / 2;
  if (unit === "tbsp") return Math.ceil(amount);
  if (unit === "tsp") return Math.ceil(amount * 2) / 2;
  return Math.ceil(amount);
}

function formatAmount(amount, unit) {
  var a = roundAmount(amount);
  if (unit === "g" && a >= 1000) return (Math.round(a / 100) / 10) + " kg";
  if (unit === "ml" && a >= 1000) return (Math.round(a / 100) / 10) + " L";
  if (unit === "cup" && a >= 1) return a + " cup" + (a === 1 ? "" : "s");
  if (unit === "pc") return a + " pc" + (a === 1 ? "" : "s");
  if (unit === "slice") return a + " slice" + (a === 1 ? "" : "s");
  if (unit === "bunch") return a + " bunch" + (a === 1 ? "" : "es");
  if (unit === "sprig") return a + " sprig" + (a === 1 ? "" : "s");
  return a + " " + unit;
}

/* Aggregate shopping items from planned recipe slugs.
   recipesBySlug: map slug -> recipe. servings: number of people.
   companions: map slug -> "Plain rice" etc, adds 0.33 cup uncooked rice.
   Returns a list grouped later by the caller. */
function aggregateShopping(recipesBySlug, plannedSlugs, servings, companions) {
  var scale = servings / 2;
  var map = {};
  plannedSlugs.forEach(function (slug) {
    var r = recipesBySlug[slug];
    if (!r) return;
    r.ingredients.forEach(function (ing) {
      if (ing.shop === false) return;
      var canon = CANON[ing.k] || ing.u;
      var amt = toCanon(ing.k, ing.a, ing.u);
      var unit = canon;
      if (amt === null) { amt = ing.a; unit = ing.u; }
      var id = ing.k + "|" + unit;
      if (!map[id]) {
        map[id] = { key: ing.k, name: ing.n, group: ing.g, amount: 0, unit: unit, dishes: [], approx: false };
      }
      map[id].amount += amt * scale;
      map[id].approx = map[id].approx || !!ing.approx;
      if (map[id].dishes.indexOf(r.name) === -1) map[id].dishes.push(r.name);
    });
    var comp = companions && companions[slug];
    if (comp) {
      var id = "rice|cup";
      if (!map[id]) map[id] = { key: "rice", name: "Rice", group: "Grains, dals and nuts", amount: 0, unit: "cup", dishes: [], approx: true };
      map[id].amount += 0.33 * scale;
      map[id].approx = true;
      if (map[id].dishes.indexOf(r.name + " (plain rice)") === -1) map[id].dishes.push(r.name + " (plain rice)");
    }
  });
  var list = Object.keys(map).map(function (id) { return map[id]; });
  list.forEach(function (item) {
    item.amount = roundAmount(item.amount);
    item.buy = buyAmount(item.key, item.amount, item.unit);
    item.buyLabel = formatAmount(item.buy, item.unit);
    item.label = formatAmount(item.amount, item.unit);
  });
  list.sort(function (a, b) {
    if (a.group !== b.group) return a.group < b.group ? -1 : 1;
    return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  });
  return list;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { aggregateShopping: aggregateShopping, formatAmount: formatAmount, buyAmount: buyAmount, toCanon: toCanon, CANON: CANON };
}

/* ---- Browser app below ---- */
if (typeof document !== "undefined") {
  var DATA = null;
  var recipesBySlug = {};
  var state = { servings: 2, week: null, marks: {}, ticks: {}, tab: "recipes", search: "", cat: "all", time: "all", detail: null };

  var WEEK1 = null;
  var GROUP_ORDER = ["Produce", "Dairy and eggs", "Grains, dals and nuts", "Pantry"];

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem("daily-cooking-v1") || "{}");
      if (saved.servings) state.servings = saved.servings;
      if (saved.week) state.week = saved.week;
      if (saved.marks) state.marks = saved.marks;
      if (saved.ticks) state.ticks = saved.ticks;
    } catch (e) { /* start fresh */ }
  }
  function saveState() {
    try { localStorage.setItem("daily-cooking-v1", JSON.stringify({ servings: state.servings, week: state.week, marks: state.marks, ticks: state.ticks })); } catch (e) { /* storage full or blocked */ }
  }

  function defaultWeek() {
    return JSON.parse(JSON.stringify(WEEK1));
  }

  function plannedSlugs() {
    var out = [];
    state.week.days.forEach(function (d) { d.dishes.forEach(function (s) { if (s) out.push(s); }); });
    return out;
  }
  function companionsMap() {
    var out = {};
    state.week.days.forEach(function (d) {
      d.dishes.forEach(function (s) {
        if (s && d.companions && d.companions[s]) out[s] = d.companions[s];
      });
    });
    return out;
  }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function recipeList() {
    var q = state.search.trim().toLowerCase();
    return DATA.recipes.filter(function (r) {
      if (state.marks[r.slug] === "no") return false;
      if (state.cat !== "all" && r.cat !== state.cat) return false;
      if (state.time === "under20" && !(r.timeMin !== null && r.timeMin < 20)) return false;
      if (state.time === "20to30" && !(r.timeMin !== null && r.timeMin >= 20 && r.timeMin <= 30)) return false;
      if (state.time === "over30" && !(r.timeMin !== null && r.timeMin > 30)) return false;
      if (q && r.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }

  function render() {
    var root = document.getElementById("app");
    var lovedCount = Object.keys(state.marks).filter(function (k) { return state.marks[k] === "loved"; }).length;
    var html = "";
    html += '<header><h1>Daily Cooking</h1><p class="sub">Vegetarian and egg recipes from Vismai Food. Pick your week, the shopping list builds itself.</p>';
    html += '<div class="servings"><label for="servings">Servings</label><select id="servings">' + [1,2,3,4,5,6].map(function (n) { return '<option value="' + n + '"' + (state.servings === n ? " selected" : "") + '>' + n + ' people</option>'; }).join("") + '</select>';
    html += '<span class="hint">' + DATA.recipes.length + ' recipes, ' + lovedCount + ' loved</span></div></header>';
    html += '<nav class="tabs">';
    [["recipes","Recipes"],["planner","Planner"],["shopping","Shopping list"]].forEach(function (t) {
      html += '<button data-tab="' + t[0] + '" class="' + (state.tab === t[0] ? "active" : "") + '">' + t[1] + '</button>';
    });
    html += '</nav>';
    if (state.tab === "recipes") html += renderRecipes();
    if (state.tab === "planner") html += renderPlanner();
    if (state.tab === "shopping") html += renderShopping();
    if (state.detail) html += renderDetail();
    root.innerHTML = html;
    bind();
  }

  function renderRecipes() {
    var h = '<div class="filters"><input id="search" type="search" placeholder="Search recipes" value="' + esc(state.search) + '" aria-label="Search recipes">';
    h += '<div class="chiprow">' + [["all","All"],["breakfast","Breakfast"],["rice","Rice"],["curry","Curry"],["egg","Egg"]].map(function (c) {
      return '<button data-cat="' + c[0] + '" class="chip' + (state.cat === c[0] ? " active" : "") + '">' + c[1] + '</button>';
    }).join("") + '</div>';
    h += '<div class="chiprow">' + [["all","Any time"],["under20","Under 20 min"],["20to30","20 to 30 min"],["over30","Over 30 min"]].map(function (c) {
      return '<button data-time="' + c[0] + '" class="chip' + (state.time === c[0] ? " active" : "") + '">' + c[1] + '</button>';
    }).join("") + '</div></div>';
    var list = recipeList();
    h += '<p class="count">' + list.length + ' recipes shown. Not for me dishes are hidden from picks.</p>';
    h += '<div class="cards">';
    list.forEach(function (r) {
      var mark = state.marks[r.slug];
      h += '<article class="card' + (mark === "loved" ? " loved" : "") + '"><button class="cardmain" data-view="' + r.slug + '"><span class="cat">' + r.cat + '</span><h3>' + esc(r.name) + '</h3><p>' + esc(r.timeLabel) + '</p>' + (mark === "loved" ? '<p class="lovedtag">Loved</p>' : '') + '</button>';
      h += '<div class="markrow"><button data-mark="loved" data-slug="' + r.slug + '">' + (mark === "loved" ? "Loved ✓" : "Love it") + '</button><button data-mark="no" data-slug="' + r.slug + '">Not for me</button></div></article>';
    });
    h += '</div>';
    return h;
  }

  function renderPlanner() {
    var h = '<div class="weekbar"><p><strong>' + esc(state.week.label) + '</strong><br>' + state.week.start + ' to ' + state.week.end + '</p>';
    h += '<button id="load-week1">Load Week 1 plan</button><button id="new-week">Start a new week</button></div>';
    h += '<p class="hint">Up to 3 dishes per day, in at most 2 cooking sessions. A session can make more than one dish. Add dishes from the Recipes tab, or change a dish here. The shopping list updates every time you change anything.</p>';
    h += '<div class="days">';
    state.week.days.forEach(function (day, di) {
      h += '<section class="day"><h3>' + esc(day.label) + ' <span>' + esc(day.date) + '</span></h3>';
      for (var i = 0; i < 3; i++) {
        var slug = day.dishes[i] || "";
        h += '<div class="slot"><select data-day="' + di + '" data-slot="' + i + '"><option value="">Empty slot</option>' +
          DATA.recipes.filter(function (r) { return state.marks[r.slug] !== "no"; }).map(function (r) {
            return '<option value="' + r.slug + '"' + (slug === r.slug ? " selected" : "") + '>' + esc(r.name) + '</option>';
          }).join("") + '</select>';
        if (slug) h += '<button data-remove="' + di + ':' + i + '">Remove</button>';
        h += '</div>';
      }
      h += '</section>';
    });
    h += '</div>';
    return h;
  }

  function renderShopping() {
    var items = aggregateShopping(recipesBySlug, plannedSlugs(), state.servings, companionsMap());
    var h = '<div class="weekbar"><p><strong>Shopping list</strong><br>' + items.length + ' items for ' + plannedSlugs().length + ' dishes, ' + state.servings + ' people</p>';
    h += '<button id="print-list">Print</button><button id="copy-list">Copy list</button></div>';
    if (!items.length) return h + '<p class="hint">No dishes planned yet. Add dishes in the Planner or Recipes tab.</p>';
    h += '<p class="hint">Amounts are totals for the whole week. Buy amounts are rounded up to a pack size. Pantry items are listed so you can check them at home first.</p>';
    GROUP_ORDER.forEach(function (g) {
      var groupItems = items.filter(function (it) { return it.group === g; });
      if (!groupItems.length) return;
      h += '<h2>' + g + '</h2><ul class="shop">';
      groupItems.forEach(function (it) {
        var id = it.key + "|" + it.unit;
        var checked = !!state.ticks[id];
        h += '<li class="' + (checked ? "done" : "") + '"><label><input type="checkbox" data-tick="' + esc(id) + '"' + (checked ? " checked" : "") + '><span><strong>' + esc(it.name) + '</strong> - ' + esc(it.label) + (it.approx ? ' <em>(approx)</em>' : '') + '<br><span class="buy">Buy: ' + esc(it.buyLabel) + '</span><br><span class="dishes">For: ' + esc(it.dishes.join(", ")) + '</span></span></label></li>';
      });
      h += '</ul>';
    });
    return h;
  }

  function renderDetail() {
    var r = recipesBySlug[state.detail];
    if (!r) return "";
    var h = '<div class="modal"><div class="modalcard"><button id="close-detail">Close</button>';
    h += '<span class="cat">' + r.cat + '</span><h2>' + esc(r.name) + '</h2><p>' + esc(r.timeLabel) + ' - amounts are for 2 people</p>';
    if (r.note) h += '<p class="note">' + esc(r.note) + '</p>';
    h += '<h3>Ingredients</h3><ul>' + r.ingredients.map(function (ing) { return '<li>' + esc(ing.d) + (ing.approx ? ' <em>(approx)</em>' : '') + '</li>'; }).join("") + '</ul>';
    h += '<h3>Steps</h3><ol>' + r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ol>';
    h += '<p><a href="' + esc(r.url) + '" target="_blank" rel="noopener">Source on Vismai Food</a></p>';
    h += '<h3>Add to planner</h3><div class="addrow"><select id="add-day">' + state.week.days.map(function (d, i) { return '<option value="' + i + '">' + esc(d.label) + ' ' + esc(d.date) + '</option>'; }).join("") + '</select>';
    h += '<select id="add-slot"><option value="0">Dish 1</option><option value="1">Dish 2</option><option value="2">Dish 3</option></select><button id="add-to-plan" data-slug="' + r.slug + '">Add dish</button></div>';
    h += '<div class="markrow"><button data-mark="loved" data-slug="' + r.slug + '">' + (state.marks[r.slug] === "loved" ? "Loved ✓" : "Love it") + '</button><button data-mark="no" data-slug="' + r.slug + '">Not for me</button></div>';
    h += '</div></div>';
    return h;
  }

  function bind() {
    document.querySelectorAll("[data-tab]").forEach(function (b) { b.addEventListener("click", function () { state.tab = b.getAttribute("data-tab"); state.detail = null; render(); }); });
    var s = document.getElementById("servings");
    if (s) s.addEventListener("change", function () { state.servings = parseInt(s.value, 10); saveState(); render(); });
    var search = document.getElementById("search");
    if (search) search.addEventListener("input", function () { state.search = search.value; var pos = search.selectionStart; render(); var n = document.getElementById("search"); if (n) { n.focus(); n.setSelectionRange(pos, pos); } });
    document.querySelectorAll("[data-cat]").forEach(function (b) { b.addEventListener("click", function () { state.cat = b.getAttribute("data-cat"); render(); }); });
    document.querySelectorAll("[data-time]").forEach(function (b) { b.addEventListener("click", function () { state.time = b.getAttribute("data-time"); render(); }); });
    document.querySelectorAll("[data-view]").forEach(function (b) { b.addEventListener("click", function () { state.detail = b.getAttribute("data-view"); render(); }); });
    document.querySelectorAll("[data-mark]").forEach(function (b) { b.addEventListener("click", function () {
      var slug = b.getAttribute("data-slug"); var m = b.getAttribute("data-mark");
      if (state.marks[slug] === m) delete state.marks[slug]; else state.marks[slug] = m;
      saveState(); render();
    }); });
    var closeBtn = document.getElementById("close-detail");
    if (closeBtn) closeBtn.addEventListener("click", function () { state.detail = null; render(); });
    var addBtn = document.getElementById("add-to-plan");
    if (addBtn) addBtn.addEventListener("click", function () {
      var di = parseInt(document.getElementById("add-day").value, 10);
      var si = parseInt(document.getElementById("add-slot").value, 10);
      state.week.days[di].dishes[si] = addBtn.getAttribute("data-slug");
      state.detail = null; state.tab = "planner"; saveState(); render();
    });
    document.querySelectorAll("select[data-day]").forEach(function (sel) { sel.addEventListener("change", function () {
      var di = parseInt(sel.getAttribute("data-day"), 10); var si = parseInt(sel.getAttribute("data-slot"), 10);
      state.week.days[di].dishes[si] = sel.value || null; saveState(); render();
    }); });
    document.querySelectorAll("[data-remove]").forEach(function (b) { b.addEventListener("click", function () {
      var parts = b.getAttribute("data-remove").split(":");
      state.week.days[parseInt(parts[0], 10)].dishes[parseInt(parts[1], 10)] = null; saveState(); render();
    }); });
    var loadBtn = document.getElementById("load-week1");
    if (loadBtn) loadBtn.addEventListener("click", function () { state.week = defaultWeek(); saveState(); render(); });
    var newBtn = document.getElementById("new-week");
    if (newBtn) newBtn.addEventListener("click", function () {
      var days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(function (label, i) {
        var d = new Date(); d.setDate(d.getDate() + i);
        return { date: d.toISOString().slice(0, 10), dishes: [null, null, null], label: label, companions: {} };
      });
      state.week = { label: "New week", start: days[0].date, end: days[6].date, days: days };
      saveState(); render();
    });
    document.querySelectorAll("[data-tick]").forEach(function (cb) { cb.addEventListener("change", function () {
      var id = cb.getAttribute("data-tick");
      if (cb.checked) state.ticks[id] = true; else delete state.ticks[id];
      saveState(); render();
    }); });
    var printBtn = document.getElementById("print-list");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });
    var copyBtn = document.getElementById("copy-list");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      var items = aggregateShopping(recipesBySlug, plannedSlugs(), state.servings, companionsMap());
      var text = "Daily Cooking shopping list (" + state.servings + " people)\n" + items.map(function (it) { return "- " + it.name + ": " + it.buyLabel; }).join("\n");
      if (navigator.clipboard) navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copied";
    });
  }

  fetch("recipes.json").then(function (res) { return res.json(); }).then(function (data) {
    DATA = data;
    WEEK1 = { label: "Week 1", start: data.meta.week1.start, end: data.meta.week1.end, days: data.meta.week1.days.map(function (d) {
      return { date: d.date, label: d.label, companions: d.companions || {}, dishes: d.dishes.slice() };
    }) };
    DATA.recipes.forEach(function (r) { recipesBySlug[r.slug] = r; });
    loadState();
    if (!state.week) state.week = defaultWeek();
    if (state.marks && Object.keys(state.marks).length === 0) {
      // Seed the one Loved mark from the Space: Godhuma Rava Upma.
      state.marks["godhuma-rava-upma"] = "loved";
    }
    render();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () { /* offline use is a bonus, not a blocker */ });
  }).catch(function () {
    document.getElementById("app").innerHTML = "<p>Could not load recipes.json. Check that the file sits next to index.html.</p>";
  });
}
