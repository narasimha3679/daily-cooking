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
  if (unit === "pc") return amount >= 10 ? Math.ceil(amount / 5) * 5 : Math.ceil(amount);
  if (unit === "g") return amount >= 500 ? Math.ceil(amount / 100) * 100 : Math.ceil(amount / 50) * 50;
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
  var WEEK1 = null;
  var bound = false;
  var toastTimer = null;

  var state = {
    servings: 2,
    week: null,
    marks: {},
    ticks: {},
    tab: "recipes",
    search: "",
    cat: "all",
    time: "all",
    detail: null,
    returnFocus: null,
    picker: null,
    pickerQuery: "",
    pickerReturn: null,
    pickerOrigin: "planner"
  };

  var GROUP_ORDER = ["Produce", "Dairy and eggs", "Grains, dals and nuts", "Pantry"];
  var CATEGORIES = [["all", "All"], ["breakfast", "Breakfast"], ["rice", "Rice"], ["curry", "Curry"], ["egg", "Egg"]];
  var TIMES = [["all", "Any time"], ["under20", "Under 20 min"], ["20to30", "20 to 30 min"], ["over30", "Over 30 min"]];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function icon(name, className) {
    return '<svg class="icon ' + (className || "") + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"></use></svg>';
  }

  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem("daily-cooking-v1") || "{}");
      if (saved.servings) state.servings = Math.min(6, Math.max(1, parseInt(saved.servings, 10) || 2));
      if (saved.week && Array.isArray(saved.week.days)) state.week = saved.week;
      if (saved.marks && typeof saved.marks === "object") state.marks = saved.marks;
      if (saved.ticks && typeof saved.ticks === "object") state.ticks = saved.ticks;
    } catch (e) { /* start fresh */ }
  }

  function saveState() {
    try {
      localStorage.setItem("daily-cooking-v1", JSON.stringify({ servings: state.servings, week: state.week, marks: state.marks, ticks: state.ticks }));
    } catch (e) { /* storage full or blocked */ }
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

  function recipeList() {
    var q = state.search.trim().toLowerCase();
    return DATA.recipes.filter(function (r) {
      if (state.cat !== "all" && r.cat !== state.cat) return false;
      if (state.time === "under20" && !(r.timeMin !== null && r.timeMin < 20)) return false;
      if (state.time === "20to30" && !(r.timeMin !== null && r.timeMin >= 20 && r.timeMin <= 30)) return false;
      if (state.time === "over30" && !(r.timeMin !== null && r.timeMin > 30)) return false;
      if (q && r.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function savedHasState() {
    try { return !!localStorage.getItem("daily-cooking-v1"); } catch (e) { return false; }
  }

  function localISO(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function todayISO() {
    return localISO(new Date());
  }

  function dateParts(iso) {
    var d = new Date(String(iso) + "T12:00:00");
    if (isNaN(d.getTime())) return null;
    return {
      dow: d.toLocaleDateString("en-GB", { weekday: "short" }),
      num: d.getDate(),
      mon: d.toLocaleDateString("en-GB", { month: "short" }),
      year: d.getFullYear()
    };
  }

  function dayInfo(day) {
    var p = dateParts(day.date);
    if (!p) return { dow: String(day.label || "").split(" ")[0] || "Day", num: "", mon: "", long: day.label || day.date, today: false };
    return {
      dow: p.dow,
      num: p.num,
      mon: p.mon,
      long: p.dow + " " + p.num + " " + p.mon,
      today: day.date === todayISO()
    };
  }

  function formatRange(week) {
    var a = dateParts(week.start);
    var b = dateParts(week.end);
    if (!a || !b) return String(week.start) + " to " + String(week.end);
    if (a.year !== b.year) return a.num + " " + a.mon + " " + a.year + " to " + b.num + " " + b.mon + " " + b.year;
    if (a.mon !== b.mon) return a.num + " " + a.mon + " to " + b.num + " " + b.mon + " " + b.year;
    return a.num + " to " + b.num + " " + a.mon + " " + a.year;
  }

  function shortTime(r) {
    if (r.timeMin !== null && r.timeMin !== undefined) return r.timeMin + " min";
    var text = String(r.timeLabel || "");
    var total = text.match(/total\s+(\d+)\s*min/i);
    if (total) return total[1] + " min";
    var first = text.match(/(\d+)\s*min/i);
    if (first) return first[1] + " min";
    return "Time varies";
  }

  function categoryLabel(cat) {
    return String(cat).charAt(0).toUpperCase() + String(cat).slice(1);
  }

  function plural(n, one, many) {
    return n + " " + (n === 1 ? one : (many || one + "s"));
  }

  function plannedFor(slug) {
    var out = [];
    state.week.days.forEach(function (day, di) {
      day.dishes.forEach(function (s, si) {
        if (s === slug) out.push({ di: di, si: si, day: day });
      });
    });
    return out;
  }

  function markCount(kind) {
    return Object.keys(state.marks).filter(function (k) { return state.marks[k] === kind; }).length;
  }

  function servingsControl() {
    return '<div class="servings" role="group" aria-label="Servings">' +
      '<button type="button" class="servings-btn" data-servings="-1" data-focus-key="servings-minus"' + (state.servings <= 1 ? " disabled" : "") + ' aria-label="Fewer servings">' + icon("minus") + '</button>' +
      '<span class="servings-val"><strong>' + state.servings + '</strong> ' + (state.servings === 1 ? "person" : "people") + '</span>' +
      '<button type="button" class="servings-btn" data-servings="1" data-focus-key="servings-plus"' + (state.servings >= 6 ? " disabled" : "") + ' aria-label="More servings">' + icon("plus") + '</button>' +
      '</div>';
  }

  function renderHeader() {
    var count = plannedSlugs().length;
    return '<header class="site-header">' +
      '<div class="brand">' +
        '<span class="brand-mark" aria-hidden="true">' + icon("pot") + '</span>' +
        '<div class="brand-text"><h1 class="brand-name">Daily Cooking</h1><p class="brand-sub">South Indian kitchen</p></div>' +
      '</div>' +
      '<button type="button" class="week-chip" data-tab="planner" data-focus-key="week-chip" aria-label="Open the planner, ' + esc(state.week.label) + ', ' + plural(count, "dish", "dishes") + '">' +
        icon("calendar") + '<span>' + esc(state.week.label) + '</span>' +
      '</button>' +
    '</header>';
  }

  function renderTabbar() {
    var tabs = [["recipes", "Recipes", "book"], ["planner", "Planner", "calendar"], ["shopping", "Shopping list", "basket"]];
    return '<nav class="tabbar" aria-label="Main">' + tabs.map(function (t) {
      var active = state.tab === t[0];
      return '<button type="button" class="tab" data-tab="' + t[0] + '" data-focus-key="tab-' + t[0] + '"' + (active ? ' aria-current="page"' : "") + '>' +
        icon(t[2], "tab-icon") + '<span>' + t[1] + '</span></button>';
    }).join("") + '</nav>';
  }

  function recipeCardHTML(r) {
    var mark = state.marks[r.slug];
    var planned = plannedFor(r.slug).length;
    var classes = "recipe-card" + (mark === "loved" ? " is-loved" : "") + (mark === "no" ? " is-no" : "");
    var badges = "";
    if (mark === "loved") badges += '<span class="loved-badge">' + icon("heart-fill") + 'Loved</span>';
    if (mark === "no") badges += '<span class="no-badge">Not for me</span>';
    return '<article class="' + classes + '">' +
      '<a class="card-open" href="#recipe-' + esc(r.slug) + '" data-view="' + esc(r.slug) + '" data-focus-key="view-' + esc(r.slug) + '" aria-label="Open ' + esc(r.name) + ', ' + esc(categoryLabel(r.cat)) + ', ' + esc(shortTime(r)) + ', base for 2, ' + plural(r.ingredients.length, "ingredient") + '">' +
        '<span class="card-top"><span class="cat">' + esc(categoryLabel(r.cat)) + '</span>' + badges + '</span>' +
        '<h3 class="dish-name">' + esc(r.name) + '</h3>' +
        '<span class="card-meta">' +
          '<span>' + icon("clock") + esc(shortTime(r)) + '</span>' +
          '<span>' + icon("users") + 'Base for 2</span>' +
          '<span>' + plural(r.ingredients.length, "ingredient") + '</span>' +
        '</span>' +
        (planned ? '<span class="planned-badge">' + icon("calendar") + 'Planned ' + (planned > 1 ? planned + " times" : "this week") + '</span>' : "") +
      '</a>' +
      '<div class="card-actions">' +
        (mark === "no" ? '<button type="button" class="text-btn restore-btn" data-mark="no" data-slug="' + esc(r.slug) + '" data-focus-key="restore-' + esc(r.slug) + '">Restore</button>' : "") +
        '<button type="button" class="icon-btn love-btn' + (mark === "loved" ? " is-on" : "") + '" data-mark="loved" data-slug="' + esc(r.slug) + '" data-focus-key="mark-' + esc(r.slug) + '-loved" aria-pressed="' + (mark === "loved" ? "true" : "false") + '" aria-label="' + (mark === "loved" ? "Remove the Loved mark from " : "Mark ") + esc(r.name) + (mark === "loved" ? "" : " as Loved") + '">' + icon(mark === "loved" ? "heart-fill" : "heart") + '</button>' +
        (mark === "no" ? "" : '<button type="button" class="icon-btn add-btn" data-quick-add="' + esc(r.slug) + '" data-focus-key="quick-add-' + esc(r.slug) + '" aria-label="Add ' + esc(r.name) + ' to the planner">' + icon("plus") + '</button>') +
      '</div>' +
    '</article>';
  }

  function emptyRecipesHTML() {
    return '<div class="empty">' +
      '<h2>No dishes match</h2>' +
      '<p>Try a different word, or clear the filters. All 49 recipes are still in the book.</p>' +
      '<button type="button" class="btn btn-primary" data-clear-all="1">Clear filters</button>' +
    '</div>';
  }

  function resultCountText(list) {
    if (state.search.trim()) return plural(list.length, "recipe") + ' for "' + state.search.trim() + '"';
    return plural(list.length, "recipe");
  }

  function markNoteHTML() {
    var no = markCount("no");
    if (!no) return "";
    return '<p class="mark-note">' + plural(no, "dish", "dishes") + ' marked Not for me. They stay in Recipes so you can change your mind, and stay out of planner picks.</p>';
  }

  function renderRecipes() {
    var list = recipeList();
    var filtered = state.search.trim() || state.cat !== "all" || state.time !== "all";
    var h = '<h2 class="sr-only">Recipes</h2>';
    h += '<div class="toolbar"><div class="toolbar-inner">';
    h += '<label class="sr-only" for="search">Search recipes</label>';
    h += '<div class="searchbox">' + icon("search") + '<input id="search" type="search" placeholder="Search recipes" value="' + esc(state.search) + '" autocomplete="off" spellcheck="false"></div>';
    h += '<div class="chiprow" role="group" aria-label="Recipe category">' + CATEGORIES.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + c[0] + '" data-focus-key="cat-' + c[0] + '" aria-pressed="' + (state.cat === c[0] ? "true" : "false") + '">' + c[1] + '</button>';
    }).join("") + '</div>';
    h += '<div class="filter-row">';
    h += '<span class="select-wrap"><label class="sr-only" for="time-select">Cooking time</label><select id="time-select" data-focus-key="time-select">' + TIMES.map(function (t) {
      return '<option value="' + t[0] + '"' + (state.time === t[0] ? " selected" : "") + '>' + t[1] + '</option>';
    }).join("") + '</select>' + icon("chevron") + '</span>';
    h += '<p class="result-count" id="result-count" aria-live="polite">' + esc(resultCountText(list)) + '</p>';
    h += '<button type="button" class="text-btn" data-clear-all="1"' + (filtered ? "" : " hidden") + ' data-focus-key="clear-filters">Clear</button>';
    h += '</div>';
    if (state.time !== "all") h += '<p class="filter-note">Recipes without a listed time are hidden while a time filter is on.</p>';
    h += '</div></div>';
    h += markNoteHTML();
    h += '<div class="recipe-grid" id="recipe-results">' + (list.length ? list.map(recipeCardHTML).join("") : emptyRecipesHTML()) + '</div>';
    return h;
  }

  function renderPlanner() {
    var count = plannedSlugs().length;
    var h = '<div class="toolbar"><div class="toolbar-inner toolbar-row">';
    h += '<div class="toolbar-title"><h2>' + esc(state.week.label) + '</h2><p>' + esc(formatRange(state.week)) + ' · ' + plural(count, "dish", "dishes") + '</p></div>';
    h += servingsControl();
    h += '</div></div>';
    h += '<p class="ledger-note">Up to 3 dishes a day in at most 2 cooking sessions. Add, swap or remove a dish and the shopping list updates right away.</p>';
    h += '<div class="days">';
    state.week.days.forEach(function (day, di) {
      var info = dayInfo(day);
      var filled = day.dishes.map(function (s, si) { return { slug: s, si: si }; }).filter(function (x) { return !!x.slug; });
      h += '<section class="day-card' + (info.today ? " is-today" : "") + '" aria-labelledby="day-' + di + '">';
      h += '<header class="day-head">';
      h += '<div class="day-date" aria-hidden="true"><span class="dnum">' + esc(info.num) + '</span><span class="dmon">' + esc(info.mon) + '</span></div>';
      h += '<div class="day-title"><h3 id="day-' + di + '">' + esc(info.long) + '</h3><p>' + (filled.length ? plural(filled.length, "dish", "dishes") + ' planned' : "No dishes yet") + '</p></div>';
      if (info.today) h += '<span class="today-pill">Today</span>';
      h += '</header>';
      if (filled.length) {
        h += '<ul class="dish-rows">';
        filled.forEach(function (item) {
          var r = recipesBySlug[item.slug];
          var name = r ? r.name : item.slug;
          var no = state.marks[item.slug] === "no";
          h += '<li class="dish-row' + (no ? " is-no" : "") + '">';
          h += '<span class="slot-num" aria-hidden="true">' + (item.si + 1) + '</span>';
          h += '<span class="dish-info"><span class="dish-title">' + esc(name) + '</span><span class="dish-sub">' + (r ? esc(shortTime(r)) : "Recipe") + (no ? " · Not for me" : "") + '</span></span>';
          h += '<button type="button" class="icon-btn" data-swap="' + di + ':' + item.si + '" data-focus-key="swap-' + di + '-' + item.si + '" aria-label="Swap ' + esc(name) + ' on ' + esc(info.long) + '">' + icon("swap") + '</button>';
          h += '<button type="button" class="icon-btn danger-ghost" data-remove="' + di + ':' + item.si + '" data-focus-key="remove-' + di + '-' + item.si + '" aria-label="Remove ' + esc(name) + ' from ' + esc(info.long) + '">' + icon("trash") + '</button>';
          h += '</li>';
        });
        h += '</ul>';
      }
      if (filled.length < 3) {
        h += '<button type="button" class="add-dish" data-add-dish="' + di + '" data-focus-key="add-' + di + '">' + icon("plus") + 'Add a dish</button>';
      }
      h += '</section>';
    });
    h += '</div>';
    h += '<details class="week-actions"><summary><span>Week actions</span>' + icon("chevron", "chev") + '</summary>' +
      '<div class="week-actions-body">' +
        '<button type="button" class="btn btn-secondary" data-load-week1="1">Load the Week 1 plan</button>' +
        '<button type="button" class="btn btn-danger-ghost" data-new-week="1">Start a new week</button>' +
        '<p>Either action replaces the dishes in the current week and resets the shopping ticks. The shopping list follows the new plan.</p>' +
      '</div></details>';
    return h;
  }

  function shoppingStats(items) {
    var done = items.filter(function (it) { return !!state.ticks[it.key + "|" + it.unit]; }).length;
    return { done: done, total: items.length };
  }

  function groupItems(items) {
    var groups = GROUP_ORDER.map(function (g) {
      return { name: g, items: items.filter(function (it) { return it.group === g; }) };
    }).filter(function (g) { return g.items.length; });
    var known = {};
    GROUP_ORDER.forEach(function (g) { known[g] = true; });
    var rest = items.filter(function (it) { return !known[it.group]; });
    if (rest.length) groups.push({ name: "Other", items: rest });
    return groups;
  }

  function shopItemHTML(it) {
    var id = it.key + "|" + it.unit;
    var checked = !!state.ticks[id];
    var forText = it.dishes.join(", ");
    var shown = it.dishes.slice(0, 2).join(", ") + (it.dishes.length > 2 ? " +" + (it.dishes.length - 2) + " more" : "");
    return '<li class="shop-item' + (checked ? " done" : "") + '">' +
      '<label class="shop-label">' +
        '<input type="checkbox" data-tick="' + esc(id) + '"' + (checked ? " checked" : "") + ' aria-label="' + esc(it.name + ", " + it.label + ", buy " + it.buyLabel) + '">' +
        '<span class="shop-check" aria-hidden="true">' + icon("check") + '</span>' +
        '<span class="shop-main"><span class="shop-name">' + esc(it.name) + '</span><span class="shop-for" title="' + esc(forText) + '">For ' + esc(shown) + '</span></span>' +
        '<span class="shop-qty"><strong class="shop-total">' + esc(it.label) + '</strong><span class="shop-buy">Buy ' + esc(it.buyLabel) + '</span></span>' +
      '</label>' +
    '</li>';
  }

  function renderShopping() {
    var items = aggregateShopping(recipesBySlug, plannedSlugs(), state.servings, companionsMap());
    var stats = shoppingStats(items);
    var pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
    var h = '<div class="toolbar"><div class="toolbar-inner">';
    h += '<div class="toolbar-row">';
    h += '<div class="toolbar-title"><h2>Shopping list</h2><p>' + plural(plannedSlugs().length, "dish", "dishes") + ' · ' + state.servings + (state.servings === 1 ? " person" : " people") + '</p></div>';
    h += servingsControl();
    h += '</div>';
    if (stats.total) {
      h += '<div class="progress-wrap" id="shop-progress-wrap" role="progressbar" aria-valuemin="0" aria-valuemax="' + stats.total + '" aria-valuenow="' + stats.done + '" aria-label="Shopping items picked">';
      h += '<div class="progress-track"><span class="progress-fill" id="shop-progress-fill" style="width:' + pct + '%"></span></div>';
      h += '<p class="progress-label" id="shop-progress">' + (stats.done === stats.total ? "All " + stats.total + " items picked" : stats.done + " of " + stats.total + " picked") + '</p>';
      h += '</div>';
    }
    h += '</div></div>';
    if (!items.length) {
      return h + '<div class="empty"><h2>No dishes planned yet</h2><p>The shopping list is built only from the dishes in your week. Add a dish and the totals, servings and buy amounts appear here.</p><button type="button" class="btn btn-primary" data-tab="planner">Open the planner</button></div>';
    }
    h += '<p class="ledger-note">Weekly totals for the whole plan. Buy amounts round up to the next practical amount. Pantry items are listed so you can check them at home first.</p>';
    groupItems(items).forEach(function (group) {
      h += '<section class="shop-group" aria-labelledby="group-' + esc(group.name.replace(/\s+/g, "-").toLowerCase()) + '">';
      h += '<div class="group-head"><h3 id="group-' + esc(group.name.replace(/\s+/g, "-").toLowerCase()) + '">' + esc(group.name) + '</h3><span class="group-count">' + plural(group.items.length, "item") + '</span></div>';
      h += '<ul class="shop-list">' + group.items.map(shopItemHTML).join("") + '</ul>';
      h += '</section>';
    });
    h += '<div class="list-actions">' +
      '<button type="button" class="btn btn-secondary" data-print="1">' + icon("printer") + 'Print list</button>' +
      '<button type="button" class="btn btn-secondary" data-copy="1">' + icon("copy") + 'Copy list</button>' +
    '</div>';
    return h;
  }

  function renderDetail() {
    var r = recipesBySlug[state.detail];
    if (!r) return "";
    var occurrences = plannedFor(r.slug);
    var mark = state.marks[r.slug];
    var h = '<dialog id="detail-dialog" class="sheet detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title">';
    h += '<div class="sheet-head"><div><span class="cat">' + esc(categoryLabel(r.cat)) + '</span><h2 id="detail-title">' + esc(r.name) + '</h2><p class="sheet-sub">' + esc(shortTime(r)) + ' · For ' + state.servings + (state.servings === 1 ? " person" : " people") + ' · ' + plural(r.ingredients.length, "ingredient") + '</p></div>';
    h += '<button type="button" class="icon-btn" data-close-detail="1" autofocus aria-label="Close recipe">' + icon("close") + '</button></div>';
    h += '<div class="sheet-body" tabindex="0" aria-label="Recipe details">';
    if (r.timeLabel && !/^~?\s*\d+\s*min$/i.test(String(r.timeLabel).trim())) h += '<p class="source-time">Source timing: ' + esc(r.timeLabel) + '</p>';
    if (r.note) h += '<p class="note">' + esc(r.note) + '</p>';
    var scale = state.servings / 2;
    h += '<section class="detail-section"><h3>Ingredients</h3><p class="detail-hint">Source amounts for a base batch of 2 are kept below.</p><ul class="ingredients">';
    r.ingredients.forEach(function (ing) {
      var amount = ing.a > 0 ? formatAmount(ing.a * scale, ing.u) : "As needed";
      h += '<li><span class="ing-name">' + esc(ing.n || ing.d) + '</span> <span class="ing-tags">' +
        '<span class="ing-amount">' + esc(amount) + '</span>' +
        (ing.approx ? ' <span class="approx">approx</span>' : "") +
      '</span></li>';
    });
    h += '</ul>';
    h += '<details class="source-amounts"><summary><span>Source amounts for 2</span>' + icon("chevron", "chev") + '</summary><ul class="source-list">';
    r.ingredients.forEach(function (ing) {
      h += '<li><span>' + esc(ing.d) + '</span>' + (ing.approx ? ' <span class="approx">approx</span>' : "") + '</li>';
    });
    h += '</ul></details></section>';
    h += '<section class="detail-section"><h3>Steps</h3><ol class="steps">' + r.steps.map(function (s) { return '<li><p>' + esc(s) + '</p></li>'; }).join("") + '</ol></section>';
    h += '<p class="source-link-wrap"><a class="source-link" href="' + esc(r.url) + '" target="_blank" rel="noopener">Source on Vismai Food' + icon("arrow") + '</a></p>';
    if (occurrences.length) {
      h += '<section class="planned-block"><h3>In your week</h3>';
      occurrences.forEach(function (o) {
        var info = dayInfo(o.day);
        h += '<div class="planned-row"><span><strong>' + esc(info.long) + '</strong><span>Dish ' + (o.si + 1) + '</span></span><span class="planned-actions">';
        h += '<button type="button" class="icon-btn" data-swap="' + o.di + ':' + o.si + '" aria-label="Swap this dish on ' + esc(info.long) + '">' + icon("swap") + '</button>';
        h += '<button type="button" class="icon-btn danger-ghost" data-remove="' + o.di + ':' + o.si + '" aria-label="Remove this dish from ' + esc(info.long) + '">' + icon("trash") + '</button>';
        h += '</span></div>';
      });
      h += '</section>';
    }
    h += '</div>';
    h += '<div class="sheet-actions">';
    h += '<button type="button" class="btn btn-primary sheet-primary" data-detail-add="' + esc(r.slug) + '">' + icon("plus") + (mark === "no" ? "Restore and add" : "Add to plan") + '</button>';
    h += '<button type="button" class="btn btn-secondary mark-btn' + (mark === "loved" ? " is-on" : "") + '" data-mark="loved" data-slug="' + esc(r.slug) + '" data-focus-key="detail-mark-loved" aria-pressed="' + (mark === "loved" ? "true" : "false") + '">' + icon(mark === "loved" ? "heart-fill" : "heart") + (mark === "loved" ? "Loved" : "Love it") + '</button>';
    h += '<button type="button" class="btn btn-secondary mark-btn' + (mark === "no" ? " is-no" : "") + '" data-mark="no" data-slug="' + esc(r.slug) + '" data-focus-key="detail-mark-no" aria-pressed="' + (mark === "no" ? "true" : "false") + '">' + icon(mark === "no" ? "check" : "eye-off") + 'Not for me</button>';
    h += '</div>';
    h += '</dialog>';
    return h;
  }

  function pickerRecipes() {
    var q = state.pickerQuery.trim().toLowerCase();
    return DATA.recipes.filter(function (r) {
      if (state.marks[r.slug] === "no") return false;
      if (q && r.name.toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  }

  function pickerRecipeRow(r) {
    var planned = plannedFor(r.slug).length;
    return '<button type="button" class="picker-row" data-pick-recipe="' + esc(r.slug) + '" aria-label="Choose ' + esc(r.name) + ', ' + esc(categoryLabel(r.cat)) + ', ' + esc(shortTime(r)) + (planned ? ', already planned' : "") + '">' +
      '<span class="picker-row-main"><span class="picker-name">' + esc(r.name) + '</span><span class="picker-meta">' + esc(categoryLabel(r.cat)) + ' · ' + esc(shortTime(r)) + (planned ? ' · Planned' : "") + '</span></span>' +
      '<span class="picker-add" aria-hidden="true">' + icon("plus") + '</span>' +
    '</button>';
  }

  function pickerRecipeListHTML() {
    var list = pickerRecipes();
    return '<div class="picker-list" id="picker-results">' +
      (list.length ? list.map(pickerRecipeRow).join("") : '<div class="picker-empty"><p>No dishes match.</p></div>') +
      '</div>';
  }

  function pickerDayListHTML() {
    return '<div class="picker-list">' + state.week.days.map(function (day, di) {
      var info = dayInfo(day);
      var filled = day.dishes.filter(Boolean).length;
      var full = filled >= 3;
      return '<button type="button" class="day-pick" data-pick-day="' + di + '"' + (full ? " disabled" : "") + ' aria-label="' + esc(info.long) + ', ' + filled + ' of 3 dishes' + (full ? ", full" : "") + '">' +
        '<span class="day-pick-date" aria-hidden="true"><span class="dnum">' + esc(info.num) + '</span><span class="dmon">' + esc(info.mon) + '</span></span>' +
        '<span class="day-pick-main"><strong>' + esc(info.long) + '</strong><span>' + filled + ' of 3 dishes</span></span>' +
        '<span class="day-pick-status">' + (full ? "Full" : "Choose") + '</span>' +
      '</button>';
    }).join("") + '</div>';
  }

  function pickerSlotListHTML() {
    var p = state.picker;
    var day = state.week.days[p.day];
    var info = dayInfo(day);
    var h = '<button type="button" class="text-btn back-btn" data-pick-back="1">' + icon("arrow", "back-icon") + 'Choose another day</button>';
    h += '<div class="picker-list">' + [0, 1, 2].map(function (si) {
      var slug = day.dishes[si] || null;
      var r = slug ? recipesBySlug[slug] : null;
      return '<button type="button" class="slot-pick" data-pick-slot="' + si + '"' + (slug ? " disabled" : "") + ' aria-label="Dish ' + (si + 1) + ', ' + (r ? esc(r.name) : "empty") + '">' +
        '<span class="slot-pick-num" aria-hidden="true">' + (si + 1) + '</span>' +
        '<span class="slot-pick-main"><strong>Dish ' + (si + 1) + '</strong><span>' + (r ? esc(r.name) : "Empty") + '</span></span>' +
        '<span class="slot-pick-status">' + (slug ? "Filled" : "Choose") + '</span>' +
      '</button>';
    }).join("") + '</div>';
    h += '<p class="picker-hint">Adding to ' + esc(info.long) + '. The shopping list updates as soon as you choose.</p>';
    return h;
  }

  function pickerHeading() {
    var p = state.picker;
    if (!p) return { title: "", sub: "" };
    if (p.mode === "add") {
      return { title: "Add a dish", sub: dayInfo(state.week.days[p.day]).long + " · Dish " + (p.slot + 1) };
    }
    if (p.mode === "swap") {
      return { title: "Swap a dish", sub: dayInfo(state.week.days[p.day]).long + " · Dish " + (p.slot + 1) };
    }
    var r = recipesBySlug[p.slug];
    if (p.step === 0) return { title: "Add " + (r ? r.name : "a dish"), sub: "Choose a day and a dish slot." };
    if (p.day === null || p.day === undefined) return { title: "Choose a dish slot", sub: "Choose a day first." };
    return { title: "Choose a dish slot", sub: dayInfo(state.week.days[p.day]).long + " for " + (r ? r.name : "this dish") };
  }

  function pickerBodyHTML() {
    var p = state.picker;
    if (!p) return "";
    if (p.mode === "add" || p.mode === "swap") {
      var list = pickerRecipes();
      var hidden = markCount("no");
      return '<label class="sr-only" for="picker-search">Search recipes</label>' +
        '<div class="searchbox picker-search">' + icon("search") + '<input id="picker-search" type="search" placeholder="Search dishes" value="' + esc(state.pickerQuery) + '" autocomplete="off" spellcheck="false" autofocus></div>' +
        '<p class="picker-count" id="picker-count" aria-live="polite">' + plural(list.length, "dish", "dishes") + ' available' + (hidden ? ' · ' + plural(hidden, "dish", "dishes") + ' hidden by Not for me' : "") + '</p>' +
        pickerRecipeListHTML();
    }
    if (p.step === 0) return pickerDayListHTML();
    return pickerSlotListHTML();
  }

  function renderPicker() {
    var head = pickerHeading();
    return '<dialog id="picker-dialog" class="sheet picker-sheet" role="dialog" aria-modal="true" aria-labelledby="picker-title">' +
      '<div class="sheet-head"><div><span class="cat">' + (state.picker.mode === "swap" ? "Swap" : "Planner") + '</span><h2 id="picker-title">' + esc(head.title) + '</h2><p class="sheet-sub" id="picker-sub">' + esc(head.sub) + '</p></div>' +
      '<button type="button" class="icon-btn" data-close-picker="1"' + ((state.picker.mode === "add" || state.picker.mode === "swap") ? "" : " autofocus") + ' aria-label="Close picker">' + icon("close") + '</button></div>' +
      '<div class="sheet-body" id="picker-body" tabindex="0" aria-label="Choose a dish">' + pickerBodyHTML() + '</div>' +
      '</dialog>';
  }

  function render(opts) {
    opts = opts || {};
    var root = document.getElementById("app");
    var y = window.scrollY;
    var active = document.activeElement;
    var focusKey = active && active.getAttribute ? active.getAttribute("data-focus-key") : null;
    var html = renderHeader();
    html += '<main class="view" id="view" tabindex="-1">';
    if (state.tab === "recipes") html += renderRecipes();
    if (state.tab === "planner") html += renderPlanner();
    if (state.tab === "shopping") html += renderShopping();
    html += '</main>';
    html += renderTabbar();
    if (state.detail) html += renderDetail();
    if (state.picker) html += renderPicker();
    root.innerHTML = html;
    if (opts.top) window.scrollTo(0, 0); else window.scrollTo(0, y);
    if (state.detail) openDetailDialog();
    if (state.picker) openPickerDialog();
    if (focusKey && !state.detail && !state.picker) {
      var el = document.querySelector('[data-focus-key="' + focusKey + '"]');
      if (el) el.focus({ preventScroll: true });
    }
  }

  function openDetailDialog() {
    var d = document.getElementById("detail-dialog");
    if (!d || d.open) return;
    document.body.classList.add("modal-open");
    d.showModal();
    d.addEventListener("close", function () {
      if (d !== document.getElementById("detail-dialog")) return;
      if (state.detail) {
        var slug = state.returnFocus;
        state.detail = null;
        document.body.classList.remove("modal-open");
        render({ keepScroll: true });
        if (slug) focusReturn("view-" + slug);
      }
    }, { once: true });
    d.addEventListener("click", function (e) {
      if (e.target === d) closeDetail();
    });
  }

  function closeDetail() {
    var slug = state.returnFocus || state.detail;
    state.detail = null;
    document.body.classList.remove("modal-open");
    var d = document.getElementById("detail-dialog");
    if (d && d.open) d.close();
    render({ keepScroll: true });
    if (slug) focusReturn("view-" + slug);
  }

  function openPickerDialog() {
    var d = document.getElementById("picker-dialog");
    if (!d || d.open) return;
    document.body.classList.add("modal-open");
    d.showModal();
    d.addEventListener("close", function () {
      if (d !== document.getElementById("picker-dialog")) return;
      if (state.picker) {
        var key = state.pickerReturn;
        state.picker = null;
        document.body.classList.remove("modal-open");
        render({ keepScroll: true });
        if (key) focusReturn(key);
      }
    }, { once: true });
    d.addEventListener("click", function (e) {
      if (e.target === d) closePicker();
    });
  }

  function closePicker() {
    state.picker = null;
    document.body.classList.remove("modal-open");
    var d = document.getElementById("picker-dialog");
    if (d && d.open) d.close();
    render({ keepScroll: true });
    if (state.pickerReturn) focusReturn(state.pickerReturn);
  }

  function focusReturn(key) {
    window.requestAnimationFrame(function () {
      var el = document.querySelector('[data-focus-key="' + key + '"]');
      if (el) el.focus({ preventScroll: true });
      else {
        var view = document.getElementById("view");
        if (view) view.focus({ preventScroll: true });
      }
    });
  }

  function updateRecipeResults() {
    var list = recipeList();
    var results = document.getElementById("recipe-results");
    if (results) results.innerHTML = list.length ? list.map(recipeCardHTML).join("") : emptyRecipesHTML();
    var count = document.getElementById("result-count");
    if (count) count.textContent = resultCountText(list);
    var clear = document.querySelector('[data-clear-all]');
    var filtered = state.search.trim() || state.cat !== "all" || state.time !== "all";
    if (clear) clear.hidden = !filtered;
  }

  function updatePicker() {
    if (!state.picker) return;
    var head = pickerHeading();
    var title = document.getElementById("picker-title");
    var sub = document.getElementById("picker-sub");
    var cat = document.querySelector("#picker-dialog .cat");
    var body = document.getElementById("picker-body");
    if (title) title.textContent = head.title;
    if (sub) sub.textContent = head.sub;
    if (cat) cat.textContent = state.picker.mode === "swap" ? "Swap" : "Planner";
    if (body) body.innerHTML = pickerBodyHTML();
    var focusTarget = state.picker.step === 1
      ? document.querySelector('[data-pick-slot]:not(:disabled)')
      : document.querySelector('[data-pick-day]:not(:disabled)');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  }

  function updatePickerResults() {
    var list = pickerRecipes();
    var results = document.getElementById("picker-results");
    if (results) results.innerHTML = list.length ? list.map(pickerRecipeRow).join("") : '<div class="picker-empty"><p>No dishes match.</p></div>';
    var count = document.getElementById("picker-count");
    if (count) count.textContent = plural(list.length, "dish", "dishes") + " available";
  }

  function updateShoppingProgress(items) {
    var stats = shoppingStats(items);
    var wrap = document.getElementById("shop-progress-wrap");
    var fill = document.getElementById("shop-progress-fill");
    var label = document.getElementById("shop-progress");
    if (!wrap || !fill || !label) return;
    var pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;
    fill.style.width = pct + "%";
    wrap.setAttribute("aria-valuenow", String(stats.done));
    label.textContent = stats.done === stats.total ? "All " + stats.total + " items picked" : stats.done + " of " + stats.total + " picked";
  }

  function showToast(text, actionLabel, action) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.innerHTML = '<span>' + esc(text) + '</span>' + (actionLabel ? '<button type="button" class="toast-action" data-toast-action="1">' + esc(actionLabel) + '</button>' : "");
    t.classList.add("is-on");
    if (actionLabel && action) {
      var b = t.querySelector("[data-toast-action]");
      if (b) b.addEventListener("click", function () {
        action();
        t.classList.remove("is-on");
      }, { once: true });
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 7000);
  }

  function announce(message) {
    var live = document.getElementById("live");
    if (!live) return;
    live.textContent = "";
    setTimeout(function () { live.textContent = message; }, 40);
  }

  function setServings(delta) {
    var next = Math.min(6, Math.max(1, state.servings + Number(delta)));
    if (next === state.servings) return;
    state.servings = next;
    saveState();
    render({ keepScroll: true });
    announce("Servings set to " + next + ". The shopping list has been updated.");
  }

  function toggleMark(slug, mark) {
    var r = recipesBySlug[slug];
    var name = r ? r.name : slug;
    var on = state.marks[slug] === mark;
    var inDetail = !!state.detail;
    if (on) delete state.marks[slug];
    else state.marks[slug] = mark;
    saveState();
    render({ keepScroll: true });
    if (inDetail) focusReturn(mark === "no" ? "detail-mark-no" : "detail-mark-loved");
    else if (mark === "no") focusReturn(on ? "view-" + slug : "restore-" + slug);
    else focusReturn("mark-" + slug + "-loved");
    var message = on ? "Removed the " + (mark === "loved" ? "Loved" : "Not for me") + " mark from " + name : (mark === "loved" ? "Marked " + name + " as Loved" : "Marked " + name + " as Not for me. It stays in Recipes and out of planner picks.");
    showToast(message);
  }

  function openAdd(day) {
    var dishes = state.week.days[day].dishes;
    var si = 0;
    while (si < 3 && dishes[si]) si++;
    if (si === 3) { showToast("This day already has 3 dishes."); return; }
    state.picker = { mode: "add", day: day, slot: si, step: 0 };
    state.pickerQuery = "";
    state.pickerReturn = "add-" + day;
    state.pickerOrigin = "planner";
    render({ keepScroll: true });
  }

  function openSwap(di, si) {
    state.detail = null;
    state.picker = { mode: "swap", day: di, slot: si, step: 0 };
    state.pickerQuery = "";
    state.pickerReturn = "swap-" + di + "-" + si;
    state.pickerOrigin = "planner";
    render({ keepScroll: true });
  }

  function openRecipePicker(slug) {
    state.detail = null;
    state.picker = { mode: "recipe", slug: slug, step: 0, day: null };
    state.pickerQuery = "";
    state.pickerReturn = "view-" + slug;
    state.pickerOrigin = "recipes";
    render({ keepScroll: true });
  }

  function assignDish(di, si, slug) {
    var day = state.week.days[di];
    var previous = day.dishes[si];
    var r = recipesBySlug[slug];
    var focusKey = state.pickerOrigin === "planner" ? "swap-" + di + "-" + si : "view-" + slug;
    day.dishes[si] = slug;
    saveState();
    state.picker = null;
    state.detail = null;
    document.body.classList.remove("modal-open");
    var d = document.getElementById("picker-dialog");
    if (d && d.open) d.close();
    render({ keepScroll: true });
    focusReturn(focusKey);
    var info = dayInfo(day);
    var name = r ? r.name : slug;
    var message = previous ? "Swapped in " + name + " on " + info.long : "Added " + name + " to " + info.long;
    showToast(message, "View plan", function () {
      state.tab = "planner";
      render({ top: true });
      focusReturn("tab-planner");
    });
  }

  function removeDish(di, si) {
    var day = state.week.days[di];
    var slug = day.dishes[si];
    if (!slug) return;
    var inDetail = !!state.detail;
    var r = recipesBySlug[slug];
    var name = r ? r.name : slug;
    day.dishes[si] = null;
    saveState();
    render({ keepScroll: true });
    if (!inDetail) focusReturn("add-" + di);
    showToast("Removed " + name, "Undo", function () {
      var keepDetail = !!state.detail;
      state.week.days[di].dishes[si] = slug;
      saveState();
      render({ keepScroll: true });
      if (!keepDetail) focusReturn("swap-" + di + "-" + si);
      announce("Restored " + name + " on " + dayInfo(state.week.days[di]).long);
    });
  }

  function clearFilters() {
    state.search = "";
    state.cat = "all";
    state.time = "all";
    render({ keepScroll: true });
    var input = document.getElementById("search");
    if (input) input.focus({ preventScroll: true });
  }

  function copyList() {
    var items = aggregateShopping(recipesBySlug, plannedSlugs(), state.servings, companionsMap());
    var lines = ["Daily Cooking shopping list", state.servings + (state.servings === 1 ? " person" : " people"), ""];
    groupItems(items).forEach(function (group) {
      lines.push(group.name);
      group.items.forEach(function (it) {
        lines.push("- " + it.name + ": " + it.label + " (buy " + it.buyLabel + ")");
      });
      lines.push("");
    });
    var text = lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast("Shopping list copied");
      }).catch(function () { legacyCopy(text); });
    } else {
      legacyCopy(text);
    }
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); showToast("Shopping list copied"); }
    catch (e) { showToast("Copy did not work. Select the list and copy it by hand."); }
    document.body.removeChild(ta);
  }

  function loadWeek1() {
    if (!window.confirm("Load the Week 1 plan? This replaces the dishes currently in your week.")) return;
    state.week = defaultWeek();
    state.ticks = {};
    state.detail = null;
    state.picker = null;
    state.tab = "planner";
    saveState();
    render({ top: true });
    focusReturn("tab-planner");
    showToast("Week 1 plan loaded. Shopping ticks reset.");
  }

  function startNewWeek() {
    if (!window.confirm("Start a new week? This clears the dishes in the current week.")) return;
    var today = new Date();
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      days.push({ date: localISO(d), dishes: [null, null, null], label: d.toLocaleDateString("en-GB", { weekday: "short" }), companions: {} });
    }
    state.week = { label: "New week", start: days[0].date, end: days[6].date, days: days };
    state.ticks = {};
    state.detail = null;
    state.picker = null;
    state.tab = "planner";
    saveState();
    render({ top: true });
    focusReturn("tab-planner");
    showToast("Started a new week. Shopping ticks reset.");
  }

  function handleClick(e) {
    var el;
    if ((el = e.target.closest("[data-tab]"))) {
      e.preventDefault();
      state.tab = el.getAttribute("data-tab");
      state.detail = null;
      state.picker = null;
      render({ top: true });
      focusReturn("tab-" + state.tab);
      return;
    }
    if ((el = e.target.closest("[data-view]"))) {
      e.preventDefault();
      state.detail = el.getAttribute("data-view");
      state.returnFocus = state.detail;
      state.picker = null;
      render({ keepScroll: true });
      return;
    }
    if ((el = e.target.closest("[data-quick-add]"))) {
      openRecipePicker(el.getAttribute("data-quick-add"));
      return;
    }
    if ((el = e.target.closest("[data-mark]"))) {
      toggleMark(el.getAttribute("data-slug"), el.getAttribute("data-mark"));
      return;
    }
    if ((el = e.target.closest("[data-add-dish]"))) {
      openAdd(parseInt(el.getAttribute("data-add-dish"), 10));
      return;
    }
    if ((el = e.target.closest("[data-swap]"))) {
      var sp = el.getAttribute("data-swap").split(":");
      openSwap(parseInt(sp[0], 10), parseInt(sp[1], 10));
      return;
    }
    if ((el = e.target.closest("[data-remove]"))) {
      var rp = el.getAttribute("data-remove").split(":");
      removeDish(parseInt(rp[0], 10), parseInt(rp[1], 10));
      return;
    }
    if ((el = e.target.closest("[data-servings]"))) {
      setServings(el.getAttribute("data-servings"));
      return;
    }
    if ((el = e.target.closest("[data-cat]"))) {
      state.cat = el.getAttribute("data-cat");
      render({ keepScroll: true });
      focusReturn("cat-" + state.cat);
      return;
    }
    if (e.target.closest("[data-clear-all]")) {
      clearFilters();
      return;
    }
    if ((el = e.target.closest("[data-close-detail]"))) {
      closeDetail();
      return;
    }
    if ((el = e.target.closest("[data-close-picker]"))) {
      closePicker();
      return;
    }
    if ((el = e.target.closest("[data-detail-add]"))) {
      var addSlug = el.getAttribute("data-detail-add");
      if (state.marks[addSlug] === "no") {
        delete state.marks[addSlug];
        saveState();
      }
      openRecipePicker(addSlug);
      return;
    }
    if ((el = e.target.closest("[data-pick-day]"))) {
      state.picker.day = parseInt(el.getAttribute("data-pick-day"), 10);
      state.picker.step = 1;
      updatePicker();
      return;
    }
    if ((el = e.target.closest("[data-pick-back]"))) {
      state.picker.step = 0;
      state.picker.day = null;
      updatePicker();
      return;
    }
    if ((el = e.target.closest("[data-pick-slot]"))) {
      assignDish(state.picker.day, parseInt(el.getAttribute("data-pick-slot"), 10), state.picker.slug);
      return;
    }
    if ((el = e.target.closest("[data-pick-recipe]"))) {
      assignDish(state.picker.day, state.picker.slot, el.getAttribute("data-pick-recipe"));
      return;
    }
    if (e.target.closest("[data-print]")) {
      window.print();
      return;
    }
    if (e.target.closest("[data-copy]")) {
      copyList();
      return;
    }
    if (e.target.closest("[data-load-week1]")) {
      loadWeek1();
      return;
    }
    if (e.target.closest("[data-new-week]")) {
      startNewWeek();
      return;
    }
    if (e.target.closest("[data-retry]")) {
      startLoad();
    }
  }

  function handleInput(e) {
    if (e.target.id === "search") {
      state.search = e.target.value;
      updateRecipeResults();
      return;
    }
    if (e.target.id === "picker-search") {
      state.pickerQuery = e.target.value;
      updatePickerResults();
    }
  }

  function handleChange(e) {
    if (e.target.id === "time-select") {
      state.time = e.target.value;
      render({ keepScroll: true });
      focusReturn("time-select");
      return;
    }
    if (e.target.matches("[data-tick]")) {
      var id = e.target.getAttribute("data-tick");
      if (e.target.checked) state.ticks[id] = true; else delete state.ticks[id];
      saveState();
      var row = e.target.closest(".shop-item");
      if (row) row.classList.toggle("done", e.target.checked);
      var items = aggregateShopping(recipesBySlug, plannedSlugs(), state.servings, companionsMap());
      updateShoppingProgress(items);
      var label = e.target.getAttribute("aria-label") || "Item";
      announce((e.target.checked ? "Checked " : "Unchecked ") + label.split(",")[0]);
    }
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
    var root = document.getElementById("app");
    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleChange);
  }

  function renderFatal() {
    var root = document.getElementById("app");
    root.innerHTML = '<div class="fatal"><div class="fatal-inner"><span class="fatal-mark" aria-hidden="true">' + icon("pot") + '</span><h1>Daily Cooking</h1><p>The recipes did not open. Check your connection once, then try again. After the first load the whole book works offline.</p><button type="button" class="btn btn-primary" data-retry="1">Try again</button></div></div>';
  }

  function startLoad() {
    bindOnce();
    var root = document.getElementById("app");
    root.innerHTML = '<div class="boot" role="status"><span class="boot-mark" aria-hidden="true">' + icon("pot") + '</span><p>Opening the kitchen book...</p></div>';
    fetch("recipes.json").then(function (res) {
      if (!res.ok) throw new Error("recipes did not load");
      return res.json();
    }).then(function (data) {
      DATA = data;
      WEEK1 = { label: "Week 1", start: data.meta.week1.start, end: data.meta.week1.end, days: data.meta.week1.days.map(function (d) {
        return { date: d.date, label: d.label, companions: d.companions || {}, dishes: d.dishes.slice() };
      }) };
      DATA.recipes.forEach(function (r) { recipesBySlug[r.slug] = r; });
      var hadSaved = savedHasState();
      loadState();
      if (!state.week || !Array.isArray(state.week.days) || !state.week.days.length) state.week = defaultWeek();
      if (!hadSaved) state.marks["godhuma-rava-upma"] = "loved";
      render();
      if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () { /* offline use is a bonus, not a blocker */ });
    }).catch(renderFatal);
  }

  startLoad();
}
