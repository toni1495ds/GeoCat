// =====================
// ESTAT GLOBAL
// =====================
let currentUser = null;
let selectedDataset = 'catalunya';

let map = null;
let geojsonLayer = null;
let capitals = {};
let municipisByProvincia = { Girona: {}, Barcelona: {}, Lleida: {}, Tarragona: {} };
let municipis = {};
let activeProvincia = '';
let currentAnswer = null;
let gameMode = 'CAPITAL';
let activeDataset = 'catalunya';
let pendingAnswers = [];
let completedAnswers = new Set();
let activeVegueria = null;
let scoreCorrect = 0;
let scoreWrong = 0;

// =====================
// DADES ESTÀTIQUES
// =====================
const vegueries = {
    "Alt Pirineu i Aran": ["Alta Ribagorça", "Alt Urgell", "Cerdanya", "Pallars Jussà", "Pallars Sobirà", "Aran"],
    "Girona": ["Alt Empordà", "Baix Empordà", "Garrotxa", "Gironès", "Pla de l'Estany", "Selva"],
    "Catalunya Central": ["Bages", "Berguedà", "Moianès", "Osona", "Solsonès"],
    "Barcelona": ["Barcelonès", "Baix Llobregat", "Maresme", "Vallès Occidental", "Vallès Oriental", "Anoia", "Garraf", "Alt Penedès"],
    "Lleida": ["Garrigues", "Noguera", "Pla d'Urgell", "Segarra", "Segrià", "Urgell"],
    "Camp de Tarragona": ["Alt Camp", "Baix Camp", "Conca de Barberà", "Priorat", "Tarragonès"],
    "Terres de l'Ebre": ["Baix Ebre", "Montsià", "Ribera d'Ebre", "Terra Alta"]
};
const vegueriaColors = {
    "Alt Pirineu i Aran": "#90caf9",
    "Girona": "#81c784",
    "Catalunya Central": "#ffcc80",
    "Barcelona": "#ce93d8",
    "Lleida": "#fff176",
    "Camp de Tarragona": "#ffab91",
    "Terres de l'Ebre": "#80deea"
};
const usaRegions = {
    west_coast: ["California", "Oregon", "Washington"],
    rocky_mountain: ["Idaho", "Montana", "Wyoming", "Utah", "Colorado"],
    southwest: ["Arizona", "New Mexico", "Texas", "Nevada"],
    great_plains: ["North Dakota", "South Dakota", "Nebraska", "Kansas", "Oklahoma"],
    midwest: ["Minnesota", "Iowa", "Missouri", "Wisconsin", "Illinois", "Indiana", "Michigan", "Ohio"],
    south: ["Arkansas", "Louisiana", "Mississippi", "Alabama", "Georgia", "Florida", "South Carolina", "North Carolina", "Tennessee", "Kentucky", "West Virginia", "Virginia"],
    mid_atlantic: ["Pennsylvania", "New Jersey", "Delaware", "Maryland", "District of Columbia", "New York"],
    new_england: ["Maine", "New Hampshire", "Vermont", "Massachusetts", "Rhode Island", "Connecticut"]
};
const usaRegionColors = {
    west_coast: "#d16ba5",
    rocky_mountain: "#4d96d7",
    great_plains: "#b5c800",
    midwest: "#4db6ac",
    southwest: "#4caf50",
    south: "#ff9800",
    mid_atlantic: "#fbc02d",
    new_england: "#e53935"
};

// =====================
// AUTH
// =====================
let isRegisterMode = false;

document.getElementById('login-toggle-link').addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    document.getElementById('btn-login-submit').textContent = isRegisterMode ? "Registra't" : 'Entrar';
    document.getElementById('login-toggle-link').textContent = isRegisterMode ? 'Inicia sessió' : "Registra't";
    document.getElementById('login-toggle-text').textContent = isRegisterMode ? 'Ja tens compte? ' : 'No tens compte? ';
    document.getElementById('login-error').textContent = '';
});

document.getElementById('btn-login-submit').addEventListener('click', handleAuth);
document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
document.getElementById('login-username').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-password').focus(); });

function handleAuth() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const err = document.getElementById('login-error');

    if (!username || !password) { err.textContent = 'Omple tots els camps'; return; }
    if (username.length < 3) { err.textContent = "Nom d'usuari massa curt (mínim 3 caràcters)"; return; }

    const users = getUsers();

    if (isRegisterMode) {
        if (users[username]) { err.textContent = 'Aquest usuari ja existeix'; return; }
        if (password.length < 4) { err.textContent = 'Contrasenya massa curta (mínim 4 caràcters)'; return; }
        users[username] = { password };
        saveUsers(users);
        setSession(username);
        currentUser = username;
        enterHome();
    } else {
        if (!users[username]) { err.textContent = 'Usuari no trobat'; return; }
        if (users[username].password !== password) { err.textContent = 'Contrasenya incorrecta'; return; }
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
    document.querySelectorAll('.mode-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.dataset === ds);
    });
}

function startGame() {
    activeDataset = selectedDataset;
    document.getElementById('dataset-select').value = activeDataset;
    showScreen('screen-game');
    setTimeout(() => {
        initMap();
        loadDataset(activeDataset);
        updateModeLabels();
        updateFiltersUI();
    }, 100);
}

function goHome() {
    if (scoreCorrect + scoreWrong > 0) {
        saveScore(currentUser, scoreCorrect, scoreCorrect + scoreWrong);
    }
    document.getElementById('modal-gameover').classList.remove('show');
    scoreCorrect = 0;
    scoreWrong = 0;
    showScreen('screen-home');
}

function restartGame() {
    document.getElementById('modal-gameover').classList.remove('show');
    loadDataset(activeDataset);
}

// =====================
// MAPA
// =====================
function initMap() {
    if (map) return;
    map = L.map('map').setView([41.7, 1.8], 7);
}

function styleFeature(feature) {
    const name = feature.properties.nom_comar || feature.properties.name;
    if (completedAnswers.has(name)) {
        return { fillColor: '#2ecc71', fillOpacity: 0.85, color: '#1a7a43', weight: 1.5 };
    }
    if (activeDataset === 'usa') {
        return { fillColor: usaRegionColors[getUSARegion(name)] || '#555', fillOpacity: 0.6, color: '#333', weight: 1 };
    }
    return { fillColor: vegueriaColors[getVegueria(name)] || '#90caf9', fillOpacity: 0.5, color: '#333', weight: 1 };
}

function onEachFeature(feature, layer) {
    layer.on('click', () => {
        const name = feature.properties.nom_comar || feature.properties.name;
        if (completedAnswers.has(name)) return;

        if (name === currentAnswer) {
            completedAnswers.add(name);
            pendingAnswers = pendingAnswers.filter(n => n !== name);
            scoreCorrect++;
            updateScore();
            geojsonLayer.setStyle(styleFeature);
            showFeedback(true);
            if (pendingAnswers.length === 0) {
                setTimeout(showGameOver, 700);
            } else {
                setTimeout(newQuestion, 900);
            }
        } else {
            scoreWrong++;
            updateScore();
            layer.setStyle({ fillColor: '#D62828', fillOpacity: 0.75 });
            showFeedback(false);
            setTimeout(() => { if (geojsonLayer) geojsonLayer.setStyle(styleFeature); }, 700);
        }
    });

    layer.on('mouseover', function () {
        const name = feature.properties.nom_comar || feature.properties.name;
        if (!completedAnswers.has(name)) this.setStyle({ weight: 2.5, fillOpacity: 0.8 });
    });
    layer.on('mouseout', function () {
        if (geojsonLayer) geojsonLayer.setStyle(styleFeature);
    });
}

// =====================
// NOVA PREGUNTA
// =====================
function newQuestion() {
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = '';

    if (pendingAnswers.length === 0) { showGameOver(); return; }

    if (gameMode === 'MUNICIPI') {
        updateMunicipisByProvincia();
        updateProvinciaFilterOnMap();
        const municipi = randomFrom(Object.keys(municipis));
        currentAnswer = municipis[municipi];
        document.getElementById('question').textContent = '📍 On és el municipi: ' + municipi;
        return;
    }

    const filtered = activeVegueria
        ? pendingAnswers.filter(n => getVegueria(n) === activeVegueria)
        : pendingAnswers;
    currentAnswer = randomFrom(filtered.length > 0 ? filtered : pendingAnswers);

    if (gameMode === 'CAPITAL') {
        document.getElementById('question').textContent = activeDataset === 'usa'
            ? "🦅 Clica l'estat amb capital: " + capitals[currentAnswer]
            : '🏛️ Clica la comarca amb capital: ' + capitals[currentAnswer];
    } else {
        document.getElementById('question').textContent = '🗺️ Clica la comarca: ' + currentAnswer;
    }
}

// =====================
// CÀRREGA DE DADES
// =====================
function loadDataset(dataset) {
    activeDataset = dataset;
    completedAnswers.clear();
    scoreCorrect = 0;
    scoreWrong = 0;
    updateScore();
    document.getElementById('feedback').textContent = '';
    document.getElementById('question').textContent = 'Carregant…';

    if (geojsonLayer) { map.removeLayer(geojsonLayer); geojsonLayer = null; }

    const config = dataset === 'usa'
        ? { geo: 'data/usa/states.json', capitals: 'data/usa/capitals.json', name: f => f.properties.name }
        : { geo: 'data/catalunya/comarques.geojson', capitals: 'data/catalunya/capitals.json', name: f => f.properties.nom_comar };

    Promise.all([
        fetch(config.geo).then(r => r.json()),
        fetch(config.capitals).then(r => r.json())
    ]).then(([geoData, capsData]) => {
        capitals = capsData;
        pendingAnswers = geoData.features.map(config.name);
        geojsonLayer = L.geoJSON(geoData, { style: styleFeature, onEachFeature }).addTo(map);
        map.fitBounds(geojsonLayer.getBounds());
        newQuestion();
    });
}

// Càrrega municipis en paral·lel
Promise.all([
    fetch('data/catalunya/municipis_girona.json').then(r => r.json()).catch(() => ({})),
    fetch('data/catalunya/municipis_barcelona.json').then(r => r.json()).catch(() => ({})),
    fetch('data/catalunya/municipis_lleida.json').then(r => r.json()).catch(() => ({})),
    fetch('data/catalunya/municipis_tarragona.json').then(r => r.json()).catch(() => ({}))
]).then(([g, b, l, t]) => {
    municipisByProvincia.Girona = g;
    municipisByProvincia.Barcelona = b;
    municipisByProvincia.Lleida = l;
    municipisByProvincia.Tarragona = t;
    municipis = { ...g, ...b, ...l, ...t };
});

// =====================
// CONTROLS JOC
// =====================
function setMode(mode) {
    gameMode = mode;
    document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
    document.getElementById({ COMARCA: 'mode-comarca', CAPITAL: 'mode-capital', MUNICIPI: 'mode-municipi' }[mode]).classList.add('active');
    activeVegueria = null;
    activeProvincia = '';
    document.getElementById('vegueria-select').value = '';
    document.getElementById('provincia-select').value = '';
    updateFiltersUI();
    newQuestion();
}

function changeDataset() {
    activeDataset = document.getElementById('dataset-select').value;
    if (activeDataset === 'usa') {
        gameMode = 'CAPITAL';
        document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
        document.getElementById('mode-capital').classList.add('active');
    }
    updateModeLabels();
    updateFiltersUI();
    loadDataset(activeDataset);
}

function changeVegueria() {
    activeVegueria = document.getElementById('vegueria-select').value || null;
    updateVegueriaFilter();
    newQuestion();
}

function changeProvincia() {
    activeProvincia = document.getElementById('provincia-select').value;
    newQuestion();
}

// =====================
// INIT
// =====================
window.addEventListener('DOMContentLoaded', () => {
    const session = getSession();
    if (session && getUsers()[session]) {
        currentUser = session;
        enterHome();
    } else {
        showScreen('screen-login');
    }
});
