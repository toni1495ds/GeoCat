// =====================
// 1. MAPA
// =====================
const map = L.map("map").setView([41.7, 1.8], 7);
let geojsonLayer;

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
// "COMARCA" | "CAPITAL" | "MUNICIPI"

let activeVegueria = null;

const question = document.getElementById("question");
const feedback = document.getElementById("feedback");

// =====================
// 3. DATOS ESTÁTICOS
// =====================
const vegueries = { "Alt Pirineu i Aran": ["Alta Ribagorça", "Alt Urgell", "Cerdanya", "Pallars Jussà", "Pallars Sobirà", "Aran"], "Girona": ["Alt Empordà", "Baix Empordà", "Garrotxa", "Gironès", "Pla de l'Estany", "Selva"], "Catalunya Central": ["Bages", "Berguedà", "Moianès", "Osona", "Solsonès"], "Barcelona": ["Barcelonès", "Baix Llobregat", "Maresme", "Vallès Occidental", "Vallès Oriental", "Anoia", "Garraf", "Alt Penedès"], "Lleida": ["Garrigues", "Noguera", "Pla d'Urgell", "Segarra", "Segrià", "Urgell"], "Camp de Tarragona": ["Alt Camp", "Baix Camp", "Conca de Barberà", "Priorat", "Tarragonès"], "Terres de l'Ebre": ["Baix Ebre", "Montsià", "Ribera d'Ebre", "Terra Alta"] };
const vegueriaColors = { "Alt Pirineu i Aran": "#90caf9", "Girona": "#81c784", "Catalunya Central": "#ffcc80", "Barcelona": "#ce93d8", "Lleida": "#fff176", "Camp de Tarragona": "#ffab91", "Terres de l'Ebre": "#80deea" };

// =====================
// 4. HELPERS
// =====================
function updateFiltersUI() {
    const vegueriaGroup = document.querySelector(
        'label[for="vegueria-select"]'
    ).parentElement;

    const provinciaGroup = document.getElementById("provincia-filter");

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
    const comarca = feature.properties.nom_comar;
    const vegueria = getVegueria(comarca);

    return {
        color: "#444",
        weight: 1,
        fillColor: vegueriaColors[vegueria] || "#eee",
        fillOpacity: 0.45
    };
}

// =====================
// 6. INTERACCIONES
// =====================
function onEachFeature(feature, layer) {
    layer.on("click", () => {
        const clickedComarca = feature.properties.nom_comar;

        // --- MODO MUNICIPI ---
        if (gameMode === "MUNICIPI") {
            if (!comarcaPertanyAProvincia(clickedComarca)) return;

            if (clickedComarca === currentAnswer) {
                layer.setStyle({ fillColor: "#4caf50", fillOpacity: 0.8 });
                question.textContent = "Correcte!";
                setTimeout(newQuestion, 1200);
            } else {
                layer.setStyle({ fillColor: "#f44336", fillOpacity: 0.7 });
                question.textContent = "Incorrecte!";
            }
            return;
        }

        // --- COMARQUES / CAPITALS ---
        if (clickedComarca === currentAnswer) {
            layer.setStyle({ fillColor: "#4caf50", fillOpacity: 0.8 });
            question.textContent = "Correcte!";
            setTimeout(newQuestion, 1200);
        } else {
            // 🔴 SOLO error, sin pistas
            layer.setStyle({ fillColor: "#f44336", fillOpacity: 0.7 });
            question.textContent = "Incorrecte!";
        }
    });
}



// =====================
// 6.2 INTERACCIONES MUNICIPIS
// =====================
function onEachMunicipi(feature, layer) {
    layer.on("click", () => {
        if (gameMode !== "MUNICIPI") return;

        const clicked = feature.properties.nom_muni;

        if (clicked === currentAnswer) {
            layer.setStyle({
                fillColor: "#66bb6a",
                fillOpacity: 0.8
            });
            question.textContent = "Correcte!";
            setTimeout(newQuestion, 1000);
        } else {
            layer.setStyle({
                fillColor: "#ef9a9a",
                fillOpacity: 0.8
            });
            question.textContent = "Incorrecte!";
        }
    });
}

// =====================
// 8. NUEVA PREGUNTA
// =====================
function newQuestion() {
    if (geojsonLayer) {
        resetMapStyles();
    }

    const availableComarques = activeVegueria
        ? vegueries[activeVegueria]
        : comarques;

    if (gameMode === "COMARCA") {
        currentAnswer = randomFrom(availableComarques);
        currentQuestionText = "Clica: " + currentAnswer;
        question.textContent = currentQuestionText;
    }

    if (gameMode === "CAPITAL") {
        const filtered = Object.keys(capitals)
            .filter(c => availableComarques.includes(c));

        currentAnswer = randomFrom(filtered);
        currentQuestionText =
            "Clica la comarca amb capital " + capitals[currentAnswer];
        question.textContent = currentQuestionText;
    }

    if (gameMode === "MUNICIPI") {
        updateMunicipisByProvincia();
        updateProvinciaFilterOnMap();

        const municipi = randomFrom(Object.keys(municipis));
        currentAnswer = municipis[municipi];

        currentQuestionText = "Clica la comarca on està: " + municipi;
        question.textContent = currentQuestionText;
    }
}


// =====================
// 9. CARGA DE DATOS
// =====================
Promise.all([
    fetch("data/comarques.geojson").then(r => r.json()),
    fetch("data/capitals.json").then(r => r.json())
]).then(([geoData, capitalsData]) => {

    capitals = capitalsData;
    comarques = geoData.features.map(f => f.properties.nom_comar);

    geojsonLayer = L.geoJSON(geoData, {
        style: styleFeature,
        onEachFeature
    }).addTo(map);

    map.fitBounds(geojsonLayer.getBounds());

    setTimeout(() => {
        map.invalidateSize();
    }, 100);
    activeVegueria = null;
    updateVegueriaFilter();
    newQuestion();
});

Promise.all([
    fetch("data/municipis_girona.json").then(r => r.json()),
    fetch("data/municipis_barcelona.json").then(r => r.json()),
    fetch("data/municipis_lleida.json").then(r => r.json()),
    fetch("data/municipis_tarragona.json").then(r => r.json())
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

const vegueriaSelect = document.getElementById("vegueria-select");

vegueriaSelect.addEventListener("change", () => {
    const value = vegueriaSelect.value;

    activeVegueria = value === "" ? null : value;

    updateVegueriaFilter();
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