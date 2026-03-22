// =====================
// ESTAT GLOBAL
// =====================
let currentUser = null;
let selectedDataset = "catalunya";
let map = null;
let geojsonLayer = null;
let extraLayer = null;
let extraHitboxLayer = null;
let hoveredFeature = null;
let pendingTimers = [];
let riuComarques = {};

function scheduleTimer(fn, delay) {
  const id = setTimeout(fn, delay);
  pendingTimers.push(id);
  return id;
}
let capitals = {};
let municipisByProvincia = {
  Girona: {},
  Barcelona: {},
  Lleida: {},
  Tarragona: {},
};
let municipis = {};
let activeProvincia = "";
let currentAnswer = null;
let gameMode = "CAPITAL";
let activeDataset = "catalunya";
let pendingAnswers = [];
let completedAnswers = new Set();
let activeVegueria = null;
let scoreCorrect = 0;
let scoreWrong = 0;
let scoreSaved = false;
// =====================
// DADES ESTÀTIQUES
// =====================
const vegueries = {
  "Alt Pirineu i Aran": [
    "Alta Ribagorça",
    "Alt Urgell",
    "Cerdanya",
    "Pallars Jussà",
    "Pallars Sobirà",
    "Val d'Aran",
  ],
  Girona: [
    "Alt Empordà",
    "Baix Empordà",
    "Garrotxa",
    "Gironès",
    "Pla de l'Estany",
    "Ripollès",
    "Selva",
  ],
  "Catalunya Central": [
    "Bages",
    "Berguedà",
    "Lluçanès",
    "Moianès",
    "Osona",
    "Solsonès",
  ],
  Barcelona: [
    "Barcelonès",
    "Baix Llobregat",
    "Maresme",
    "Vallès Occidental",
    "Vallès Oriental",
    "Anoia",
    "Garraf",
    "Alt Penedès",
    "Baix Penedès",
  ],
  Lleida: [
    "Garrigues",
    "Noguera",
    "Pla d'Urgell",
    "Segarra",
    "Segrià",
    "Urgell",
  ],
  "Camp de Tarragona": [
    "Alt Camp",
    "Baix Camp",
    "Conca de Barberà",
    "Priorat",
    "Tarragonès",
  ],
  "Terres de l'Ebre": ["Baix Ebre", "Montsià", "Ribera d'Ebre", "Terra Alta"],
};
const vegueriaColors = {
  "Alt Pirineu i Aran": "#90caf9",
  Girona: "#81c784",
  "Catalunya Central": "#ffcc80",
  Barcelona: "#ce93d8",
  Lleida: "#fff176",
  "Camp de Tarragona": "#ffab91",
  "Terres de l'Ebre": "#80deea",
};
const usaRegions = {
  west_coast: ["California", "Oregon", "Washington"],
  rocky_mountain: ["Idaho", "Montana", "Wyoming", "Utah", "Colorado"],
  southwest: ["Arizona", "New Mexico", "Texas", "Nevada"],
  great_plains: [
    "North Dakota",
    "South Dakota",
    "Nebraska",
    "Kansas",
    "Oklahoma",
  ],
  midwest: [
    "Minnesota",
    "Iowa",
    "Missouri",
    "Wisconsin",
    "Illinois",
    "Indiana",
    "Michigan",
    "Ohio",
  ],
  south: [
    "Arkansas",
    "Louisiana",
    "Mississippi",
    "Alabama",
    "Georgia",
    "Florida",
    "South Carolina",
    "North Carolina",
    "Tennessee",
    "Kentucky",
    "West Virginia",
    "Virginia",
  ],
  mid_atlantic: [
    "Pennsylvania",
    "New Jersey",
    "Delaware",
    "Maryland",
    "District of Columbia",
    "New York",
  ],
  new_england: [
    "Maine",
    "New Hampshire",
    "Vermont",
    "Massachusetts",
    "Rhode Island",
    "Connecticut",
  ],
};
const usaRegionColors = {
  west_coast: "#d16ba5",
  rocky_mountain: "#4d96d7",
  great_plains: "#b5c800",
  midwest: "#4db6ac",
  southwest: "#4caf50",
  south: "#ff9800",
  mid_atlantic: "#fbc02d",
  new_england: "#e53935",
};
// =====================
// AUTH
// =====================
let isRegisterMode = false;
document.getElementById("login-toggle-link").addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  document.getElementById("btn-login-submit").textContent = isRegisterMode
    ? "Registra't"
    : "Entrar";
  document.getElementById("login-toggle-link").textContent = isRegisterMode
    ? "Inicia sessió"
    : "Registra't";
  document.getElementById("login-toggle-text").textContent = isRegisterMode
    ? "Ja tens compte? "
    : "No tens compte? ";
  document.getElementById("login-error").textContent = "";
});
document
  .getElementById("btn-login-submit")
  .addEventListener("click", handleAuth);
document.getElementById("login-password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleAuth();
});
document.getElementById("login-username").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("login-password").focus();
});
async function handleAuth() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  const err = document.getElementById("login-error");
  if (!username || !password) {
    err.textContent = "Omple tots els camps";
    return;
  }
  if (username.length < 3) {
    err.textContent = "Nom d'usuari massa curt (mínim 3 caràcters)";
    return;
  }
  const users = getUsers();
  if (isRegisterMode) {
    if (users[username]) {
      err.textContent = "Aquest usuari ja existeix";
      return;
    }
    if (password.length < 4) {
      err.textContent = "Contrasenya massa curta (mínim 4 caràcters)";
      return;
    }
    users[username] = { password: await hashPassword(password) };
    saveUsers(users);
    setSession(username);
    currentUser = username;
    enterHome();
  } else {
    if (!users[username]) {
      err.textContent = "Usuari no trobat";
      return;
    }
    const ok = await verifyPassword(password, users[username].password);
    if (!ok) {
      err.textContent = "Contrasenya incorrecta";
      return;
    }
    if (!users[username].password.startsWith("sha256:")) {
      users[username].password = await hashPassword(password);
      saveUsers(users);
    }
    setSession(username);
    currentUser = username;
    enterHome();
  }
}
// =====================
// HOME
// =====================
function selectDataset(ds) {
  selectedDataset = ds;
  document.querySelectorAll(".map-card").forEach((c) => {
    c.classList.toggle("selected", c.dataset.dataset === ds);
  });
}
function startGame() {
  activeDataset = selectedDataset;
  document.getElementById("dataset-select").value = activeDataset;
  showScreen("screen-game");
  const gameScreen = document.getElementById("screen-game");
  let initialized = false;
  const init = () => {
    if (initialized) return;
    initialized = true;
    gameScreen.removeEventListener("transitionend", onTransition);
    initMap();
    loadDataset(activeDataset);
    updateModeLabels();
    updateFiltersUI();
  };
  const onTransition = (e) => {
    if (e.target === gameScreen && e.propertyName === "opacity") init();
  };
  gameScreen.addEventListener("transitionend", onTransition);
  setTimeout(init, 500);
}
function goHome() {
  if (!scoreSaved && scoreCorrect + scoreWrong > 0) {
    saveScore(currentUser, scoreCorrect, scoreCorrect + scoreWrong);
  }
  scoreSaved = false;
  document.getElementById("modal-gameover").classList.remove("show");
  scoreCorrect = 0;
  scoreWrong = 0;
  showScreen("screen-home");
}
function restartGame() {
  document.getElementById("modal-gameover").classList.remove("show");
  loadDataset(activeDataset);
}
// =====================
// MAPA
// =====================
function initMap() {
  if (map) return;
  map = L.map("map", { inertia: false }).setView([41.7, 1.8], 7);
}
const EXTRA_MODES = ["RIU", "SERRALADA", "CARRETERA"];

function styleFeature(feature) {
  if (EXTRA_MODES.includes(gameMode)) {
    return { fillColor: "#555", fillOpacity: 0.08, color: "#444", weight: 0.5 };
  }
  const name = feature.properties.nom_comar || feature.properties.name;
  if (completedAnswers.has(name)) {
    return {
      fillColor: "#2ecc71",
      fillOpacity: 0.85,
      color: "#1a7a43",
      weight: 1.5,
    };
  }
  if (activeDataset === "usa") {
    return {
      fillColor: usaRegionColors[getUSARegion(name)] || "#555",
      fillOpacity: 0.6,
      color: "#333",
      weight: 1,
    };
  }
  return {
    fillColor: vegueriaColors[getVegueria(name)] || "#90caf9",
    fillOpacity: 0.5,
    color: "#333",
    weight: 1,
  };
}

const serraladaColors = {
  "Pirineus Axials":      "#7ba7bc",
  "Prepirineus":          "#8fb5c5",
  "Serralada Transversal":"#7a9e6b",
  "Serralada Prelitoral": "#8b7355",
  "Serralada Litoral":    "#9e8e6e",
  "Montseny":             "#6b8f5e",
  "Montserrat":           "#b0956a",
  "Montsant":             "#a07850",
  "Serra de Prades":      "#8b6545",
  "Ports de Tortosa-Beseit": "#7a6055",
  "Massís del Garraf":    "#8a8a75",
};

function styleExtra(feature) {
  const nom = feature.properties.nom;
  const isDone = completedAnswers.has(nom);
  if (gameMode === "RIU") {
    return isDone
      ? { color: "#2ecc71", weight: 5, opacity: 0.95 }
      : { color: "#4fc3f7", weight: 5, opacity: 0.75 };
  }
  if (gameMode === "CARRETERA") {
    return isDone
      ? { color: "#2ecc71", weight: 5, opacity: 0.95 }
      : { color: "#FFB020", weight: 5, opacity: 0.8 };
  }
  // SERRALADA
  const col = serraladaColors[nom] || "#8b7355";
  return isDone
    ? { fillColor: "#2ecc71", fillOpacity: 0.65, color: "#1a7a43", weight: 2 }
    : { fillColor: col, fillOpacity: 0.42, color: col, weight: 1.5 };
}

function onEachExtraFeature(feature, layer) {
  const isLine = gameMode === "RIU" || gameMode === "CARRETERA";
  const nom = feature.properties.nom;
  layer.on("mousedown", (e) => { L.DomEvent.stopPropagation(e); });
  layer.on("click", (e) => {
    L.DomEvent.stopPropagation(e);
    if (completedAnswers.has(nom)) return;
    if (nom === currentAnswer) {
      completedAnswers.add(nom);
      pendingAnswers = pendingAnswers.filter((n) => n !== nom);
      scoreCorrect++;
      updateScore();
      if (extraLayer) extraLayer.setStyle(styleExtra);
      showFeedback(true);
      if (pendingAnswers.length === 0) {
        scheduleTimer(showGameOver, 700);
      } else {
        scheduleTimer(newQuestion, 900);
      }
    } else {
      scoreWrong++;
      updateScore();
      if (isLine) {
        layer.setStyle({ color: "#D62828", weight: 7, opacity: 1 });
      } else {
        layer.setStyle({ fillColor: "#D62828", fillOpacity: 0.7, color: "#ff4444", weight: 2.5 });
      }
      const hint = (gameMode === "RIU" && riuComarques[currentAnswer])
        ? "Passa per: " + riuComarques[currentAnswer].join(", ")
        : null;
      showFeedback(false, hint);
      scheduleTimer(() => {
        if (extraLayer) extraLayer.setStyle(styleExtra);
      }, 700);
    }
  });
  layer.on("mouseover", function () {
    if (isLine) { this.setStyle({ weight: 8, opacity: 1 }); }
    else { this.setStyle({ fillOpacity: 0.65, weight: 2.5 }); }
  });
  layer.on("mouseout", function () {
    if (extraLayer) extraLayer.setStyle(styleExtra);
  });
}

function addExtraLayer(data) {
  extraLayer = L.geoJSON(data, {
    style: styleExtra,
    onEachFeature: onEachExtraFeature,
  }).addTo(map);
}

function extraModeUrl(mode) {
  return {
    RIU: "data/catalunya/rius.geojson",
    SERRALADA: "data/catalunya/serralades.geojson",
    CARRETERA: "data/catalunya/carreteres.geojson",
  }[mode];
}
function onEachFeature(feature, layer) {
  layer.on("click", () => {
    if (EXTRA_MODES.includes(gameMode)) return;
    const name = feature.properties.nom_comar || feature.properties.name;
    if (completedAnswers.has(name)) return;
    if (name === currentAnswer) {
      completedAnswers.add(name);
      pendingAnswers = pendingAnswers.filter((n) => n !== name);
      scoreCorrect++;
      updateScore();
      geojsonLayer.setStyle(styleFeature);
      showFeedback(true);
      if (pendingAnswers.length === 0) {
        scheduleTimer(showGameOver, 700);
      } else {
        scheduleTimer(newQuestion, 900);
      }
    } else {
      scoreWrong++;
      updateScore();
      layer.setStyle({ fillColor: "#D62828", fillOpacity: 0.75 });
      showFeedback(false);
      scheduleTimer(() => {
        if (geojsonLayer) geojsonLayer.setStyle(styleFeature);
      }, 700);
    }
  });
  layer.on("mouseover", function () {
    if (EXTRA_MODES.includes(gameMode)) return;
    const name = feature.properties.nom_comar || feature.properties.name;
    if (!completedAnswers.has(name))
      this.setStyle({ weight: 2.5, fillOpacity: 0.8 });
  });
  layer.on("mouseout", function () {
    if (EXTRA_MODES.includes(gameMode)) return;
    if (geojsonLayer) geojsonLayer.setStyle(styleFeature);
  });
}
// =====================
// NOVA PREGUNTA
// =====================
function newQuestion() {
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "";
  if (pendingAnswers.length === 0) {
    showGameOver();
    return;
  }
  if (gameMode === "MUNICIPI") {
    const availableMunicipis = Object.keys(municipis).filter(
      (m) => !completedAnswers.has(municipis[m]),
    );
    if (availableMunicipis.length === 0) {
      showGameOver();
      return;
    }
    const municipi = randomFrom(availableMunicipis);
    currentAnswer = municipis[municipi];
    document.getElementById("question").textContent =
      "📍 On és el municipi: " + municipi;
    return;
  }
  if (gameMode === "TEST") {
    if (pendingAnswers.length === 0) { showGameOver(); return; }
    const qNum = 20 - pendingAnswers.length + 1;
    document.getElementById("test-progress").textContent = "Pregunta " + qNum + " / 20";
    const comarcaList = Object.keys(capitals);
    const capitalList = Object.values(capitals);
    const types = ["COMARCA_CAPITAL", "CAPITAL_COMARCA"];
    if (municipisLoaded && Object.keys(municipis).length > 0) types.push("MUNICIPI_COMARCA");
    const type = randomFrom(types);
    let questionText, correct, pool;
    if (type === "COMARCA_CAPITAL") {
      const comarca = randomFrom(comarcaList);
      correct = capitals[comarca];
      questionText = "🏛️ Quina és la capital de " + comarca + "?";
      pool = capitalList;
    } else if (type === "CAPITAL_COMARCA") {
      const comarca = randomFrom(comarcaList);
      correct = comarca;
      questionText = "🏛️ La capital " + capitals[comarca] + " pertany a quina comarca?";
      pool = comarcaList;
    } else {
      const mList = Object.keys(municipis);
      const m = randomFrom(mList);
      correct = municipis[m];
      questionText = "📍 El municipi de " + m + " pertany a quina comarca?";
      pool = comarcaList;
    }
    currentAnswer = correct;
    document.getElementById("question").textContent = questionText;
    showTestOptions(generateTestOptions(correct, pool), correct);
    return;
  }
  if (gameMode === "RIU") {
    currentAnswer = randomFrom(pendingAnswers);
    document.getElementById("question").textContent =
      "🌊 Clica el riu: " + currentAnswer;
    return;
  }
  if (gameMode === "SERRALADA") {
    currentAnswer = randomFrom(pendingAnswers);
    document.getElementById("question").textContent =
      "⛰️ Clica la serralada: " + currentAnswer;
    return;
  }
  if (gameMode === "CARRETERA") {
    currentAnswer = randomFrom(pendingAnswers);
    document.getElementById("question").textContent =
      "🛣️ Clica la carretera: " + currentAnswer;
    return;
  }
  const filtered = activeVegueria
    ? pendingAnswers.filter((n) => getVegueria(n) === activeVegueria)
    : pendingAnswers;
  currentAnswer = randomFrom(filtered.length > 0 ? filtered : pendingAnswers);
  if (gameMode === "CAPITAL") {
    document.getElementById("question").textContent =
      activeDataset === "usa"
        ? "🦅 Clica l'estat amb capital: " + capitals[currentAnswer]
        : "🏛️ Clica la comarca amb capital: " + capitals[currentAnswer];
  } else {
    document.getElementById("question").textContent =
      "🗺️ Clica la comarca: " + currentAnswer;
  }
}
// =====================
// CÀRREGA DE DADES
// =====================
function loadDataset(dataset) {
  pendingTimers.forEach(clearTimeout);
  pendingTimers = [];
  activeDataset = dataset;
  completedAnswers.clear();
  scoreCorrect = 0;
  scoreWrong = 0;
  scoreSaved = false;
  updateScore();
  document.getElementById("feedback").textContent = "";
  document.getElementById("question").textContent = "Carregant…";
  if (geojsonLayer) {
    map.removeLayer(geojsonLayer);
    geojsonLayer = null;
  }
  if (extraLayer) {
    map.removeLayer(extraLayer);
    extraLayer = null;
  }
  if (extraHitboxLayer) {
    map.removeLayer(extraHitboxLayer);
    extraHitboxLayer = null;
  }
  hoveredFeature = null;
  const config =
    dataset === "usa"
      ? {
          geo: "data/usa/states.json",
          capitals: "data/usa/capitals.json",
          name: (f) => f.properties.name,
        }
      : {
          geo: "data/catalunya/comarques.geojson",
          capitals: "data/catalunya/capitals.json",
          name: (f) => f.properties.nom_comar,
        };
  const isExtra =
    EXTRA_MODES.includes(gameMode) && dataset === "catalunya";
  const fetches = [
    fetch(config.geo).then((r) => r.json()),
    fetch(config.capitals).then((r) => r.json()),
    ...(isExtra
      ? [fetch(extraModeUrl(gameMode)).then((r) => r.json())]
      : []),
  ];
  Promise.all(fetches)
    .then(([geoData, capsData, extraData]) => {
      capitals = capsData;
      geojsonLayer = L.geoJSON(geoData, {
        style: styleFeature,
        onEachFeature,
      }).addTo(map);
      if (isExtra && extraData) {
        pendingAnswers = extraData.features.map((f) => f.properties.nom);
        if (gameMode === "RIU") {
          riuComarques = {};
          extraData.features.forEach((f) => {
            if (f.properties.comarques) riuComarques[f.properties.nom] = f.properties.comarques;
          });
        }
        addExtraLayer(extraData);
      } else {
        pendingAnswers = geoData.features.map(config.name);
      }
      map.fitBounds(geojsonLayer.getBounds());
      newQuestion();
    })
    .catch(() => {
      document.getElementById("question").textContent =
        "Error carregant les dades. Refresca la pàgina.";
    });
}
// =====================
// CÀRREGA LAZY DE MUNICIPIS
// =====================
let municipisLoaded = false;
let municipisLoadPromise = null;
function loadMunicipis() {
  if (municipisLoaded) return Promise.resolve();
  if (municipisLoadPromise) return municipisLoadPromise;
  municipisLoadPromise = Promise.all([
    fetch("data/catalunya/municipis_girona.json")
      .then((r) => r.json())
      .catch(() => ({})),
    fetch("data/catalunya/municipis_barcelona.json")
      .then((r) => r.json())
      .catch(() => ({})),
    fetch("data/catalunya/municipis_lleida.json")
      .then((r) => r.json())
      .catch(() => ({})),
    fetch("data/catalunya/municipis_tarragona.json")
      .then((r) => r.json())
      .catch(() => ({})),
  ]).then(([g, b, l, t]) => {
    municipisByProvincia.Girona = g;
    municipisByProvincia.Barcelona = b;
    municipisByProvincia.Lleida = l;
    municipisByProvincia.Tarragona = t;
    municipis = { ...g, ...b, ...l, ...t };
    municipisLoaded = true;
  });
  return municipisLoadPromise;
}
// =====================
// MODE TEST
// =====================
function generateTestOptions(correct, pool) {
  const wrong = pool.filter(v => v !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
  return [correct, ...wrong].sort(() => Math.random() - 0.5);
}

function showTestOptions(options, correct) {
  const labels = ['a', 'b', 'c', 'd'];
  options.forEach((opt, i) => {
    const btn = document.getElementById('opt-' + i);
    btn.textContent = labels[i] + ') ' + opt;
    btn.className = 'test-option';
    btn.disabled = false;
    btn.onclick = () => handleTestAnswer(i, opt, correct, options);
  });
}

function handleTestAnswer(clickedIdx, chosen, correct, options) {
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById('opt-' + i);
    btn.disabled = true;
    btn.onclick = null;
    if (options[i] === correct) btn.classList.add('test-correct');
  }
  const isCorrect = chosen === correct;
  if (!isCorrect) {
    document.getElementById('opt-' + clickedIdx).classList.add('test-wrong');
    scoreWrong++;
  } else {
    scoreCorrect++;
  }
  updateScore();
  showFeedback(isCorrect);
  pendingAnswers.pop();
  if (pendingAnswers.length === 0) {
    scheduleTimer(showGameOver, 1200);
  } else {
    scheduleTimer(newQuestion, 1400);
  }
}

// =====================
// CONTROLS JOC
// =====================
function setMode(mode) {
  const prevMode = gameMode;
  gameMode = mode;
  document
    .querySelectorAll(".btn-mode")
    .forEach((b) => b.classList.remove("active"));
  document
    .getElementById(
      {
        COMARCA: "mode-comarca",
        CAPITAL: "mode-capital",
        MUNICIPI: "mode-municipi",
        RIU: "mode-riu",
        SERRALADA: "mode-serralada",
        CARRETERA: "mode-carretera",
        TEST: "mode-test",
      }[mode],
    )
    .classList.add("active");
  activeVegueria = null;
  activeProvincia = "";
  document.getElementById("vegueria-select").value = "";
  document.getElementById("provincia-select").value = "";
  updateFiltersUI();

  const mapEl = document.getElementById("map");
  const testPanel = document.getElementById("test-panel");
  if (mode === "TEST") {
    mapEl.style.display = "none";
    testPanel.classList.remove("hidden");
  } else {
    testPanel.classList.add("hidden");
    mapEl.style.display = "";
    if (map && prevMode === "TEST") map.invalidateSize();
  }

  const isExtra = EXTRA_MODES.includes(mode);
  const wasExtra = EXTRA_MODES.includes(prevMode);

  if (mode === "TEST") {
    pendingAnswers = Array(20).fill(null);
    scoreCorrect = 0;
    scoreWrong = 0;
    scoreSaved = false;
    updateScore();
    document.getElementById("feedback").textContent = "";
    document.getElementById("feedback").className = "";
    const startTest = () => {
      loadMunicipis().then(() => {
        updateMunicipisByProvincia();
        newQuestion();
      });
    };
    if (Object.keys(capitals).length > 0) {
      startTest();
    } else {
      document.getElementById("question").textContent = "Carregant…";
      fetch("data/catalunya/capitals.json")
        .then(r => r.json())
        .then(data => { capitals = data; startTest(); });
    }
  } else if (isExtra || wasExtra || prevMode === "TEST") {
    loadDataset(activeDataset);
  } else if (mode === "MUNICIPI") {
    document.getElementById("question").textContent = "Carregant…";
    loadMunicipis().then(() => {
      updateMunicipisByProvincia();
      updateProvinciaFilterOnMap();
      newQuestion();
    });
  } else {
    newQuestion();
  }
}
function changeDataset() {
  activeDataset = document.getElementById("dataset-select").value;
  if (activeDataset === "usa") {
    gameMode = "CAPITAL";
    document
      .querySelectorAll(".btn-mode")
      .forEach((b) => b.classList.remove("active"));
    document.getElementById("mode-capital").classList.add("active");
  }
  updateModeLabels();
  updateFiltersUI();
  loadDataset(activeDataset);
}
function changeVegueria() {
  activeVegueria = document.getElementById("vegueria-select").value || null;
  updateVegueriaFilter();
  newQuestion();
}
function changeProvincia() {
  activeProvincia = document.getElementById("provincia-select").value;
  updateMunicipisByProvincia();
  updateProvinciaFilterOnMap();
  newQuestion();
}
// =====================
// INICIALITZACIÓ SELECTS
// =====================
function initSelects() {
  const vegueriaSelect = document.getElementById("vegueria-select");
  Object.keys(vegueries).forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    vegueriaSelect.appendChild(opt);
  });
  const provinciaSelect = document.getElementById("provincia-select");
  Object.keys(municipisByProvincia).forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    provinciaSelect.appendChild(opt);
  });
}
// =====================
// INIT
// =====================
window.addEventListener("DOMContentLoaded", () => {
  initSelects();
  const session = getSession();
  if (session && getUsers()[session]) {
    currentUser = session;
    enterHome();
  } else {
    showScreen("screen-login");
  }
});
