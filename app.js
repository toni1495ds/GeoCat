// =====================
// 1. MAPA
// =====================
const map = L.map("map").setView([41.7, 1.8], 7);
let geojsonLayer;

// =====================
// DATASETS
// =====================
const DATASETS = {
    catalunya: {
        geojson: "data/catalunya/comarques.geojson",
        capitals: "data/catalunya/capitals.json",
        center: [41.7, 1.8],
        zoom: 7,
        featureName: f => f.properties.nom_comar
    }
};

// =====================
// 2. ESTADO GLOBAL
// =====================
let comarques = [];
let capitals = {};
let municipisByProvincia = {
    Girona: {},
    Barcelona: {},
    Lleida: {},
    Tarragona: {}
};
let municipis = {};
let activeProvincia = "";
let currentAnswer = null;
let currentQuestionText = "";
let gameMode = "CAPITAL";
let activeDataset = "usa"; // solo usa de momento
let allFeatures = [];
let pendingAnswers = [];
let completedAnswers = new Set();

const usaRegions = {
    west: ["California", "Oregon", "Washington", "Nevada", "Arizona", "Utah", "Idaho"],
    midwest: ["Illinois", "Indiana", "Iowa", "Ohio", "Michigan", "Wisconsin", "Minnesota", "Missouri"],
    south: ["Texas", "Florida", "Georgia", "Alabama", "Mississippi", "Louisiana", "Tennessee"],
    northeast: ["New York", "Massachusetts", "Pennsylvania", "New Jersey", "Connecticut"]
};

const regionColors = {
    west: "#52adedff",
    midwest: "#5dca66ff",
    south: "#d1b17eff",
    northeast: "#7a55b0ff",
    default: "#ce6868ff"
};

let activeVegueria = null;

const question = document.getElementById("question");
const feedback = document.getElementById("feedback");

let scoreCorrect = 0;
let scoreWrong = 0;

const scoreCorrectEl = document.getElementById("score-correct");
const scoreWrongEl = document.getElementById("score-wrong");

const datasetSelect = document.getElementById("dataset-select");

datasetSelect.addEventListener("change", () => {
    const dataset = datasetSelect.value;

    activeDataset = dataset;

    // reset scores
    scoreCorrect = 0;
    scoreWrong = 0;
    updateScore();

    // reset filtros
    activeVegueria = null;
    activeProvincia = "";

    // USA solo Capitals
    if (dataset === "usa") {
        gameMode = "CAPITAL";

        btnCapital.classList.add("active");
        btnComarca.classList.remove("active");
        btnMunicipi.classList.remove("active");
    }

    updateModeLabels();
    updateFiltersUI();
    loadDataset(dataset);
});

// =====================
// 3. DATOS ESTÁTICOS
// =====================
const vegueries = { "Alt Pirineu i Aran": ["Alta Ribagorça", "Alt Urgell", "Cerdanya", "Pallars Jussà", "Pallars Sobirà", "Aran"], "Girona": ["Alt Empordà", "Baix Empordà", "Garrotxa", "Gironès", "Pla de l'Estany", "Selva"], "Catalunya Central": ["Bages", "Berguedà", "Moianès", "Osona", "Solsonès"], "Barcelona": ["Barcelonès", "Baix Llobregat", "Maresme", "Vallès Occidental", "Vallès Oriental", "Anoia", "Garraf", "Alt Penedès"], "Lleida": ["Garrigues", "Noguera", "Pla d'Urgell", "Segarra", "Segrià", "Urgell"], "Camp de Tarragona": ["Alt Camp", "Baix Camp", "Conca de Barberà", "Priorat", "Tarragonès"], "Terres de l'Ebre": ["Baix Ebre", "Montsià", "Ribera d'Ebre", "Terra Alta"] };
const vegueriaColors = { "Alt Pirineu i Aran": "#90caf9", "Girona": "#81c784", "Catalunya Central": "#ffcc80", "Barcelona": "#ce93d8", "Lleida": "#fff176", "Camp de Tarragona": "#ffab91", "Terres de l'Ebre": "#80deea" };

// =====================
// 4. HELPERS
// =====================
function updateFiltersUI() {
    const vegueriaGroup = document.getElementById("vegueria-filter");
    const provinciaGroup = document.getElementById("provincia-filter");

    // =====================
    // USA → sin filtros territoriales
    // =====================
    if (activeDataset === "usa") {
        vegueriaGroup.style.display = "none";
        provinciaGroup.style.display = "none";

        // Municipis no tiene sentido en USA
        btnMunicipi.style.display = "none";

        return;
    }

    // =====================
    // CATALUNYA
    // =====================
    btnMunicipi.style.display = "inline-block";

    if (gameMode === "MUNICIPI") {
        vegueriaGroup.style.display = "none";
        provinciaGroup.style.display = "block";
    } else {
        vegueriaGroup.style.display = "block";
        provinciaGroup.style.display = "none";
    }
}


// =====================
// 5. ESTILO MAPA
// =====================
function styleFeature(feature) {
    const name =
        feature.properties.nom_comar ||
        feature.properties.name;

    if (completedAnswers.has(name)) {
        return {
            fillColor: "#4caf50",
            fillOpacity: 0.85,
            color: "#2e7d32",
            weight: 1
        };
    }

    if (activeDataset === "usa") {
        return {
            fillColor: getUSAColor(name),
            fillOpacity: 0.65,
            color: "#444",
            weight: 1
        };
    }

    const veg = getVegueria(name);
    return {
        fillColor: vegueriaColors[veg] || "#bbdefb",
        fillOpacity: 0.55,
        color: "#444",
        weight: 1
    };
}


// =====================
// 6. INTERACCIONES
// =====================
function onEachFeature(feature, layer) {
    layer.on("click", () => {
        const name =
            feature.properties.nom_comar ||
            feature.properties.name;

        // ya acertado → no hacer nada
        if (completedAnswers.has(name)) return;

        if (name === currentAnswer) {
            completedAnswers.add(name);
            pendingAnswers = pendingAnswers.filter(n => n !== name);

            scoreCorrect++;
            updateScore();

            // 🔥 REDIBUJAR MAPA
            geojsonLayer.setStyle(styleFeature);

            feedback.textContent = "Correcte!";

            setTimeout(newQuestion, 1000);
        } else {
            scoreWrong++;
            updateScore();

            layer.setStyle({
                fillColor: "#f44336",
                fillOpacity: 0.7
            });

            feedback.textContent = "Incorrecte!";

            // volver a color base
            setTimeout(() => {
                geojsonLayer.setStyle(styleFeature);
            }, 800);
        }
    });
}


// =====================
// 8. NUEVA PREGUNTA
// =====================
if (gameMode === "MUNICIPI" && activeDataset === "usa") {
    gameMode = "CAPITAL";
}
function newQuestion() {
    feedback.textContent = "";
    feedback.className = "";

    if (pendingAnswers.length === 0) {
        question.textContent = "🎉 Has completat totes!";
        return;
    }

    if (gameMode === "MUNICIPI") {
        updateMunicipisByProvincia();
        updateProvinciaFilterOnMap();

        const municipi = randomFrom(Object.keys(municipis));
        currentAnswer = municipis[municipi];

        question.textContent =
            "Clica la comarca on està: " + municipi;
        return;
    }

    currentAnswer = randomFrom(pendingAnswers);

    if (gameMode === "CAPITAL") {
        question.textContent =
            activeDataset === "usa"
                ? "Clica l'estat amb capital " + capitals[currentAnswer]
                : "Clica la comarca amb capital " + capitals[currentAnswer];
        return;
    }

    if (gameMode === "COMARCA") {
        question.textContent = "Clica: " + currentAnswer;
    }
}


// =====================
// 9. CARGA DE DATOS
// =====================
Promise.all([
    fetch("data/catalunya/municipis_girona.json").then(r => r.json()),
    fetch("data/catalunya/municipis_barcelona.json").then(r => r.json()),
    fetch("data/catalunya/municipis_lleida.json").then(r => r.json()),
    fetch("data/catalunya/municipis_tarragona.json").then(r => r.json())
]).then(([girona, barcelona, lleida, tarragona]) => {
    municipisByProvincia.Girona = girona;
    municipisByProvincia.Barcelona = barcelona;
    municipisByProvincia.Lleida = lleida;
    municipisByProvincia.Tarragona = tarragona;

    municipis = {
        ...girona,
        ...barcelona,
        ...lleida,
        ...tarragona
    };
});

function loadDataset(dataset) {
    activeDataset = dataset;
    completedAnswers.clear();

    scoreCorrect = 0;
    scoreWrong = 0;
    updateScore();

    if (geojsonLayer) map.removeLayer(geojsonLayer);

    question.textContent = "Carregant…";

    const config = dataset === "usa"
        ? {
            geo: "data/usa/states.json",
            capitals: "data/usa/capitals.json",
            name: f => f.properties.name
        }
        : {
            geo: "data/catalunya/comarques.geojson",
            capitals: "data/catalunya/capitals.json",
            name: f => f.properties.nom_comar
        };

    Promise.all([
        fetch(config.geo).then(r => r.json()),
        fetch(config.capitals).then(r => r.json())
    ]).then(([geoData, capitalsData]) => {

        capitals = capitalsData;
        pendingAnswers = geoData.features.map(config.name);

        geojsonLayer = L.geoJSON(geoData, {
            style: styleFeature,
            onEachFeature
        }).addTo(map);

        map.fitBounds(geojsonLayer.getBounds());
        newQuestion();
    });
}

const vegueriaSelect = document.getElementById("vegueria-select");

vegueriaSelect.addEventListener("change", () => {
    activeVegueria = vegueriaSelect.value || null;
    newQuestion();
});

const provinciaSelect = document.getElementById("provincia-select");

provinciaSelect.addEventListener("change", () => {
    activeProvincia = provinciaSelect.value;
    newQuestion();
});


// =====================
// 10. BOTONES MODO JUEGO
// =====================
const btnComarca = document.getElementById("mode-comarca");
const btnCapital = document.getElementById("mode-capital");
const btnMunicipi = document.getElementById("mode-municipi");

btnComarca.addEventListener("click", () => {
    gameMode = "COMARCA";

    btnComarca.classList.add("active");
    btnCapital.classList.remove("active");
    btnMunicipi.classList.remove("active");

    updateFiltersUI();
    newQuestion();
});


btnCapital.addEventListener("click", () => {
    gameMode = "CAPITAL";

    btnCapital.classList.add("active");
    btnComarca.classList.remove("active");
    btnMunicipi.classList.remove("active");

    updateFiltersUI();
    newQuestion();
});


btnMunicipi.addEventListener("click", () => {
    gameMode = "MUNICIPI";

    btnMunicipi.classList.add("active");
    btnComarca.classList.remove("active");
    btnCapital.classList.remove("active");

    activeVegueria = null;
    activeProvincia = "";

    updateFiltersUI();
    newQuestion();
});

loadDataset("catalunya");
updateModeLabels();

function getUSAColor(state) {
    for (const region in usaRegions) {
        if (usaRegions[region].includes(state)) {
            return regionColors[region];
        }
    }
    return regionColors.default;
}
