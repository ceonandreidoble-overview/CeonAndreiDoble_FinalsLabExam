
const KEY = "levelingFitness";

const DEFAULTS = {
  name: "",
  xp: 0,
  profile: null,
  quests: [
    { id: 1, title: "10 Push-ups", cat: "Strength", xp: 20, done: false },
    { id: 2, title: "10 Sit-ups", cat: "Core", xp: 20, done: false },
    { id: 3, title: "10 Squats", cat: "Legs", xp: 20, done: false },
    { id: 4, title: "10 Minute Walk", cat: "Cardio", xp: 25, done: false },
    { id: 5, title: "5 Minute Stretching", cat: "Recovery", xp: 15, done: false }
  ]
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved) return cloneDefaults();

    const state = { ...cloneDefaults(), ...saved };

    if (!Array.isArray(state.quests)) {
      state.quests = cloneDefaults().quests;
    }

    state.xp = state.quests.reduce(
      (sum, q) => sum + (q.done ? q.xp : 0), 0
    );

    return state;
  } catch {
    return cloneDefaults();
  }
}

let S = load();

function save() {
  localStorage.setItem(KEY, JSON.stringify(S));
}

function level(xp) {
  let lvl = 1;
  let needed = 100;

  while (xp >= needed) {
    xp -= needed;
    lvl++;
    needed = 100 + (lvl - 1) * 50;
  }

  return { lvl, current: xp, needed };
}

function rank(lvl) {
  if (lvl >= 30) return "S";
  if (lvl >= 20) return "A";
  if (lvl >= 15) return "B";
  if (lvl >= 10) return "C";
  if (lvl >= 5) return "D";
  return "E";
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("active");
  });

  const index = { home: 0, quests: 1, profile: 2 }[id];

  document.querySelectorAll(".nav-link")[index].classList.add("active");

  if (id === "home") renderStatus();
  if (id === "quests") renderQuests();
  if (id === "profile") renderProfile();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toast(message) {
  const t = document.getElementById("toast");
  if (!t) return;

  t.textContent = message;
  t.classList.remove("d-none");

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    t.classList.add("d-none");
  }, 3000);
}

function renderStatus() {
  const L = level(S.xp);

  document.getElementById("welcomeName").textContent =
    S.name ? S.name + "!" : "Player!";

  document.getElementById("hunterName").textContent =
    S.name || "Unregistered";

  document.getElementById("lvl").textContent = L.lvl;
  document.getElementById("rank").textContent = rank(L.lvl);
  document.getElementById("totalXp").textContent = S.xp;

  document.getElementById("xpbar").style.width =
    (L.current / L.needed * 100) + "%";

  document.getElementById("xpText").textContent =
    L.current + " / " + L.needed + " XP";

  document.getElementById("doneCount").textContent =
    S.quests.filter(q => q.done).length;

  document.getElementById("profileGoal").textContent =
    S.profile?.goal || "Not set";

  const ul = document.getElementById("previewList");
  ul.innerHTML = "";

  const pending = S.quests.filter(q => !q.done).slice(0, 4);

  if (!pending.length) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = "All quests completed! Great job! 🌸";
    ul.appendChild(li);
  }

  pending.forEach(q => {
    const li = document.createElement("li");
    li.className = "list-group-item";

    const title = document.createElement("span");
    title.textContent = q.title;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "+" + q.xp + " XP";

    li.append(title, badge);
    ul.appendChild(li);
  });
}

function renderQuests() {
  const ul = document.getElementById("questList");
  const filter = document.getElementById("filter");

  const previous = filter.value || "All";

  const categories = [
    "All",
    ...new Set(S.quests.map(q => q.cat))
  ];

  filter.innerHTML = "";

  categories.forEach(category => {
    filter.add(new Option(
      category === "All" ? "All Categories" : category,
      category
    ));
  });

  filter.value = categories.includes(previous) ? previous : "All";

  const term = document.getElementById("search").value
    .trim().toLowerCase();

  const sort = document.getElementById("sort").value;

  let list = S.quests.filter(q =>
    (filter.value === "All" || q.cat === filter.value) &&
    q.title.toLowerCase().includes(term)
  );

  if (sort === "xp") {
    list.sort((a, b) => b.xp - a.xp);
  } else if (sort === "title") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    list.sort((a, b) => a.id - b.id);
  }

  ul.innerHTML = "";

  if (!list.length) {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = "No quests found.";
    ul.appendChild(li);
    return;
  }

  list.forEach(q => {
    const li = document.createElement("li");
    li.className = "list-group-item" + (q.done ? " done" : "");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "form-check-input";
    cb.checked = q.done;
    cb.setAttribute("aria-label", "Complete " + q.title);

    const details = document.createElement("div");
    details.className = "qt";

    const title = document.createElement("div");
    title.className = "fw-bold";
    title.textContent = q.title;

    const cat = document.createElement("small");
    cat.textContent = q.cat;

    details.append(title, cat);

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = "+" + q.xp + " XP";

    const del = document.createElement("button");
    del.className = "btn btn-sm btn-outline-danger";
    del.textContent = "✕";
    del.setAttribute("aria-label", "Delete " + q.title);

    cb.onchange = () => toggleQuest(q.id);
    del.onclick = () => removeQuest(q.id);

    li.append(cb, details, badge, del);
    ul.appendChild(li);
  });
}

function toggleQuest(id) {
  const q = S.quests.find(x => x.id === id);
  if (!q) return;

  const before = level(S.xp).lvl;

  q.done = !q.done;

  S.xp = Math.max(0, S.xp + (q.done ? q.xp : -q.xp));

  save();

  const after = level(S.xp).lvl;

  if (after > before) {
    toast("LEVEL UP! Level " + after + " Rank " + rank(after) + " ✨");
  } else if (q.done) {
    toast("Quest completed! +" + q.xp + " XP 🌸");
  } else {
    toast("Quest marked incomplete.");
  }

  renderQuests();
  renderStatus();
  renderProfile();
}

function removeQuest(id) {
  if (!confirm("Delete this quest?")) return;

  S.quests = S.quests.filter(q => q.id !== id);

  S.xp = S.quests.reduce(
    (sum, q) => sum + (q.done ? q.xp : 0), 0
  );

  save();
  renderQuests();
  renderStatus();
  renderProfile();

  toast("Quest deleted.");
}

document.getElementById("questForm").addEventListener("submit", e => {
  e.preventDefault();

  const form = e.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const title = document.getElementById("qTitle").value.trim();
  const cat = document.getElementById("qCat").value;
  const xp = Number(document.getElementById("qXp").value);

  if (title.length < 3 || title.length > 40 || xp < 5 || xp > 100) {
    return;
  }

  S.quests.push({
    id: Date.now(),
    title,
    cat,
    xp,
    done: false
  });

  save();
  form.reset();

  renderQuests();
  renderStatus();

  toast("New quest created! 💗");
});

function resetProgress() {
  if (!confirm("Reset all quests and progress?")) return;

  S = cloneDefaults();

  save();
  renderQuests();
  renderStatus();
  renderProfile();

  toast("Progress reset successfully.");
}

document.getElementById("profileForm").addEventListener("submit", e => {
  e.preventDefault();

  const form = e.target;

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  S.profile = {
    name: document.getElementById("pName").value.trim(),
    age: Number(document.getElementById("pAge").value),
    goal: document.getElementById("pGoal").value,
    focus: document.getElementById("pFocus").value
  };

  S.name = S.profile.name;

  save();
  renderProfile();
  renderStatus();

  toast("Profile saved successfully! 🌸");
});

function renderProfile() {
  const p = S.profile;
  const L = level(S.xp);

  document.getElementById("profileName").textContent =
    p?.name || "Unregistered Player";

  document.getElementById("profileAge").textContent =
    p?.age || "Not set";

  document.getElementById("profileGoalCard").textContent =
    p?.goal || "Not set";

  document.getElementById("profileFocus").textContent =
    p?.focus || "Not set";

  document.getElementById("profileLevel").textContent = L.lvl;
  document.getElementById("profileRank").textContent = rank(L.lvl);

  if (p) {
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pAge").value = p.age || "";
    document.getElementById("pGoal").value = p.goal || "";
    document.getElementById("pFocus").value = p.focus || "";
  }
}

renderStatus();
renderQuests();
renderProfile();
