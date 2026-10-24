const CATEGORIES = [
  { id: "potatoes" },
  { id: "tomatoes" },
  { id: "apples" }
];

const LANGS = ["pl", "fr"];

// Ikony liniowe 24x24; kolor bierze się z currentColor, więc działają w obu motywach.
const ICONS = {
  potatoes:
    '<path d="M4.5 12.5c-.3-4 3-7.5 7.500-7.500 4.500 0 8 2.500 7.500 7-.4 4.300-3.800 7-8 7-4 0-6.800-2.500-7-6.500z"/>' +
    '<path d="M9 10.500h.01M14.500 9.500h.01M12 14.500h.01M16.500 14h.01M8.500 15h.01"/>',
  tomatoes:
    '<path d="M12 7.500c-5 0-8.500 2.800-8.500 6.500s3.500 6.500 8.500 6.500 8.500-2.800 8.500-6.500S17 7.500 12 7.500z"/>' +
    '<path d="M12 7.500 9 5.500M12 7.500l3-2M12 7.500V4M12 7.500 8 8.500M12 7.500l4 1"/>',
  apples:
    '<path d="M12 8.500c-1.500-1.200-5-1.500-6.500 1.500s-.5 7.500 2 10c1.500 1.500 3 .8 4.500.8s3 .7 4.500-.8c2.500-2.500 3.500-7 2-10s-5-2.700-6.500-1.500z"/>' +
    '<path d="M12 8.500c0-2 .5-3.500 2-5M14 4.500c1.500-.5 3 0 3.500 1-1 1-2.800.9-3.500-1z"/>'
};

const iconSvg = (id) =>
  `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id]}</svg>`;

const I18N = {
  pl: {
    title: "Bazarek",
    categoriesTitle: "Wybierz kategorię",
    langLabel: "POL",
    langAria: "Wybierz język",
    themeAria: "Przełącz motyw jasny/ciemny",
    categoryNames: { apples: "Jabłka", potatoes: "Ziemniaki", tomatoes: "Pomidory" },
    back: "← Wróć do kategorii",
    searchPlaceholder: "Szukaj odmiany, smaku, zastosowania…",
    season: "Sezon",
    use: "Zastosowanie",
    taste: "Smak",
    varieties: (n) => (n === 1 ? "1 odmiana" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? `${n} odmiany` : `${n} odmian`),
    noResults: "Brak wyników. Spróbuj innej frazy.",
    loadError: "Nie udało się wczytać danych. Uruchom aplikację przez serwer (np. python3 -m http.server)."
  },
  fr: {
    title: "Bazarek",
    categoriesTitle: "Choisissez une catégorie",
    langLabel: "FRA",
    langAria: "Choisir la langue",
    themeAria: "Basculer entre thème clair et sombre",
    categoryNames: { apples: "Pommes", potatoes: "Pommes de terre", tomatoes: "Tomates" },
    back: "← Retour aux catégories",
    searchPlaceholder: "Chercher une variété, un goût, un usage…",
    season: "Saison",
    use: "Usage",
    taste: "Goût",
    varieties: (n) => (n <= 1 ? `${n} variété` : `${n} variétés`),
    noResults: "Aucun résultat. Essayez un autre mot.",
    loadError: "Impossible de charger les données. Lancez l'application via un serveur (ex. python3 -m http.server)."
  }
};

const state = {
  lang: localStorage.getItem("bazarek-lang") === "fr" ? "fr" : "pl",
  theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  category: null,
  query: "",
  cache: {}
};

const $ = (id) => document.getElementById(id);

const normalize = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");

async function loadData(category, lang) {
  const key = `${category}.${lang}`;
  if (!state.cache[key]) {
    const response = await fetch(`data/${key}.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.cache[key] = await response.json();
  }
  return state.cache[key];
}

function renderStaticTexts() {
  const t = I18N[state.lang];
  document.documentElement.lang = state.lang;
  document.title = t.title;
  $("categories-title").textContent = t.categoriesTitle;
  $("back-btn").textContent = t.back;
  $("search").placeholder = t.searchPlaceholder;
  $("search").setAttribute("aria-label", t.searchPlaceholder);
  $("lang-flag").dataset.lang = state.lang;
  $("lang-code").textContent = t.langLabel;
  $("lang-btn").setAttribute("aria-label", t.langAria);
  renderLangMenu();
  $("theme-btn").setAttribute("aria-label", t.themeAria);
}

function renderLangMenu() {
  const list = $("lang-list");
  list.replaceChildren();
  for (const lang of LANGS) {
    const item = document.createElement("li");
    const option = document.createElement("button");
    option.type = "button";
    option.className = "lang-option";
    option.innerHTML = '<span class="flag" aria-hidden="true"></span><span class="code"></span>';
    option.querySelector(".flag").dataset.lang = lang;
    option.querySelector(".code").textContent = I18N[lang].langLabel;
    if (lang === state.lang) option.setAttribute("aria-current", "true");
    option.addEventListener("click", () => {
      closeLangMenu();
      if (lang !== state.lang) setLang(lang);
    });
    item.append(option);
    list.append(item);
  }
}

function closeLangMenu() {
  $("lang-list").hidden = true;
  $("lang-btn").setAttribute("aria-expanded", "false");
}

async function renderCategories() {
  const t = I18N[state.lang];
  const container = $("categories");
  container.replaceChildren();
  for (const cat of CATEGORIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-card";
    button.innerHTML = `${iconSvg(cat.id)}<span class="name"></span>`;
    button.querySelector(".name").textContent = t.categoryNames[cat.id];
    button.addEventListener("click", () => openCategory(cat.id));
    container.append(button);
  }
}

function makeCard(item, t) {
  const card = document.createElement("article");
  card.className = "variety-card";

  const title = document.createElement("h2");
  title.textContent = item.name;

  const taste = document.createElement("p");
  taste.className = "taste";
  const tasteLabel = document.createElement("strong");
  tasteLabel.textContent = `${t.taste}: `;
  taste.append(tasteLabel, item.taste);

  const description = document.createElement("p");
  description.textContent = item.description;

  const meta = document.createElement("div");
  meta.className = "meta";
  const season = document.createElement("span");
  season.className = "tag";
  season.textContent = `${t.season}: ${item.season}`;
  const use = document.createElement("span");
  use.className = "tag";
  use.textContent = `${t.use}: ${item.use}`;
  meta.append(season, use);

  card.append(title, taste, description, meta);
  return card;
}

async function renderVarieties() {
  const t = I18N[state.lang];
  const container = $("varieties");
  $("category-title").textContent = t.categoryNames[state.category];

  let items;
  try {
    items = await loadData(state.category, state.lang);
  } catch {
    container.innerHTML = "";
    const msg = document.createElement("div");
    msg.className = "message";
    msg.textContent = t.loadError;
    container.append(msg);
    $("result-count").textContent = "";
    return;
  }

  const q = normalize(state.query.trim());
  const filtered = q
    ? items.filter((i) => normalize(`${i.name} ${i.taste} ${i.description} ${i.season} ${i.use}`).includes(q))
    : items;

  $("result-count").textContent = t.varieties(filtered.length);
  container.replaceChildren();
  if (filtered.length === 0) {
    const msg = document.createElement("div");
    msg.className = "message";
    msg.textContent = t.noResults;
    container.append(msg);
    return;
  }
  filtered.forEach((item) => container.append(makeCard(item, t)));
}

function showCategories() {
  state.category = null;
  state.query = "";
  $("search").value = "";
  $("varieties-view").hidden = true;
  $("categories-view").hidden = false;
  renderCategories();
}

function openCategory(id) {
  state.category = id;
  state.query = "";
  $("search").value = "";
  $("categories-view").hidden = true;
  $("varieties-view").hidden = false;
  renderVarieties();
  window.scrollTo(0, 0);
}

function setLang(lang) {
  state.lang = lang;
  localStorage.setItem("bazarek-lang", lang);
  renderStaticTexts();
  if (state.category) renderVarieties();
  else renderCategories();
}

function setTheme(theme) {
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("bazarek-theme", theme);
}

$("lang-btn").addEventListener("click", () => {
  const open = $("lang-list").hidden;
  $("lang-list").hidden = !open;
  $("lang-btn").setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (e) => {
  if (!$("lang-menu").contains(e.target)) closeLangMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("lang-list").hidden) {
    closeLangMenu();
    $("lang-btn").focus();
  }
});
$("theme-btn").addEventListener("click", () =>
  setTheme(state.theme === "dark" ? "light" : "dark")
);
$("search").addEventListener("input", (e) => {
  state.query = e.target.value;
  renderVarieties();
});
$("back-btn").addEventListener("click", showCategories);
$("logo").addEventListener("click", (e) => {
  e.preventDefault();
  showCategories();
});

renderStaticTexts();
renderCategories();
