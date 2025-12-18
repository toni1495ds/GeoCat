// =====================
// HELPERS GENERALES
// =====================
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getVegueria(comarca) {
    for (const vegueria in vegueries) {
        if (vegueries[vegueria].includes(comarca)) {
            return vegueria;
        }
    }
    return null;
}

// =====================
// MUNICIPIS / PROVÍNCIES
// =====================
function updateMunicipisByProvincia() {
    if (!activeProvincia) {
        municipis = {
            ...municipisByProvincia.Girona,
            ...municipisByProvincia.Barcelona,
            ...municipisByProvincia.Lleida,
            ...municipisByProvincia.Tarragona
        };
    } else {
        municipis = municipisByProvincia[activeProvincia] || {};
    }
}

function comarcaPertanyAProvincia(comarca) {
    if (!activeProvincia) return true;

    const comarquesProvincia = Object.values(
        municipisByProvincia[activeProvincia] || {}
    );

    return comarquesProvincia.includes(comarca);
}

// =====================
// MAPA / ESTILOS
// =====================
function resetMapStyles() {
    geojsonLayer.eachLayer(layer => {
        geojsonLayer.resetStyle(layer);
    });

    if (gameMode === "MUNICIPI") {
        updateProvinciaFilterOnMap();
    } else {
        updateVegueriaFilter();
    }
}

function updateProvinciaFilterOnMap() {
    geojsonLayer.eachLayer(layer => {
        const comarca = layer.feature.properties.nom_comar;

        const comarquesProvincia = Object.values(
            municipisByProvincia[activeProvincia] || {}
        );

        const isInProvincia = comarquesProvincia.includes(comarca);

        if (!activeProvincia || isInProvincia) {
            layer.setStyle({
                fillOpacity: 0.55,
                color: "#222"
            });
        } else {
            layer.setStyle({
                fillOpacity: 0.05,
                color: "#bbb"
            });
        }
    });
}

function updateVegueriaFilter() {
    geojsonLayer.eachLayer(layer => {
        const comarca = layer.feature.properties.nom_comar;
        const vegueria = getVegueria(comarca);

        if (!activeVegueria || vegueria === activeVegueria) {
            layer.setStyle({
                fillOpacity: 0.55,
                color: "#222",
                weight: 1.5
            });
        } else {
            layer.setStyle({
                fillOpacity: 0.08,
                color: "#bbb",
                weight: 1
            });
        }
    });
}

function showCorrect() {
    feedback.textContent = "Correcte!";
    feedback.className = "correcte";
}

function showIncorrect() {
    feedback.textContent = "Incorrecte!";
    feedback.className = "incorrecte";
}

function updateScore() {
    scoreCorrectEl.textContent = scoreCorrect;
    scoreWrongEl.textContent = scoreWrong;
}

function showCorrectWithAnswer(el, comarca) {
    el.textContent = `Correcte! És ${comarca}`;
    el.className = "correcte";
}