const CATEGORIES = [
  { id: "apples", emoji: "🍎" },
  { id: "potatoes", emoji: "🥔" },
  { id: "tomatoes", emoji: "🍅" }
];

const I18N = {
  pl: {
    title: "Bazarek",
    categoriesTitle: "Wybierz kategorię",
    categoriesSubtitle: "Poznaj odmiany owoców i warzyw z bazarku.",
    categoryNames: { apples: "Jabłka", potatoes: "Ziemniaki", tomatoes: "Pomidory" },
    back: "← Wróć do kategorii",
    searchPlaceholder: "Szukaj odmiany, smaku, zastosowania…",
    season: "Sezon",
    use: "Zastosowanie",
    varieties: (n) => (n === 1 ? "1 odmiana" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? `${n} odmiany` : `${n} odmian`),
    noResults: "Brak wyników. Spróbuj innej frazy.",
    loadError: "Nie udało się wczytać danych. Uruchom aplikację przez serwer (np. python3 -m http.server)."
  },
  fr: {
    title: "Bazarek",
    categoriesTitle: "Choisissez une catégorie",
    categoriesSubtitle: "Découvrez les variétés de fruits et légumes du marché.",
    categoryNames: { apples: "Pommes", potatoes: "Pommes de terre", tomatoes: "Tomates" },
    back: "← Retour aux catégories",
    searchPlaceholder: "Chercher une variété, un goût, un usage…",
    season: "Saison",
    use: "Usage",
    varieties: (n) => (n <= 1 ? `${n} variété` : `${n} variétés`),
    noResults: "Aucun résultat. Essayez un autre mot.",
    loadError: "Impossible de charger les données. Lancez l'application via un serveur (ex. python3 -m http.server)."
  }
};

const state = {
  lang: localStorage.getItem("bazarek-lang") === "fr" ? "fr" : "pl",
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
  $("app-title").textContent = t.title;
  $("categories-title").textContent = t.categoriesTitle;
  $("categories-subtitle").textContent = t.categoriesSubtitle;
  $("back-btn").textContent = t.back;
  $("search").placeholder = t.searchPlaceholder;
  $("search").setAttribute("aria-label", t.searchPlaceholder);
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.lang === state.lang));
  });
}

async function renderCategories() {
  const t = I18N[state.lang];
  const container = $("categories");
  container.replaceChildren();
  for (const cat of CATEGORIES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "category-card";
    button.innerHTML = '<span class="emoji"></span><span class="name"></span><span class="count"></span>';
    button.querySelector(".emoji").textContent = cat.emoji;
    button.querySelector(".name").textContent = t.categoryNames[cat.id];
    button.addEventListener("click", () => openCategory(cat.id));
    container.append(button);
    loadData(cat.id, state.lang)
      .then((items) => { button.querySelector(".count").textContent = t.varieties(items.length); })
      .catch(() => {});
  }
}

function makeCard(item, t) {
  const card = document.createElement("article");
  card.className = "variety-card";

  const title = document.createElement("h2");
  title.textContent = item.name;

  const description = document.createElement("p");
  description.textContent = item.description;

  const meta = document.createElement("div");
  meta.className = "meta";
  const season = document.createElement("span");
  season.className = "tag";
  season.textContent = `${t.season}: ${item.season}`;
  const use = document.createElement("span");
  use.className = "tag use";
  use.textContent = `${t.use}: ${item.use}`;
  meta.append(season, use);

  card.append(title, description, meta);
  return card;
}

async function renderVarieties() {
  const t = I18N[state.lang];
  const container = $("varieties");
  $("category-title").textContent = `${CATEGORIES.find((c) => c.id === state.category).emoji} ${t.categoryNames[state.category]}`;

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
    ? items.filter((i) => normalize(`${i.name} ${i.description} ${i.season} ${i.use}`).includes(q))
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

document.querySelectorAll(".lang-btn").forEach((btn) =>
  btn.addEventListener("click", () => setLang(btn.dataset.lang))
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
