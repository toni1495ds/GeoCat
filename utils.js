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
    if (!geojsonLayer) return;

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
    if (!geojsonLayer) return;

    geojsonLayer.eachLayer(layer => {
        const comarca = layer.feature.properties.nom_comar;

        const comarquesProvincia = Object.values(
            municipisByProvincia[activeProvincia] || {}
        );

        const isInProvincia = !activeProvincia ||
            comarquesProvincia.includes(comarca);

        layer.setStyle({
            fillOpacity: isInProvincia ? 0.6 : 0.05,
            opacity: isInProvincia ? 1 : 0.3
        });
    });
}


function updateVegueriaFilter() {
    if (!geojsonLayer) return;

    geojsonLayer.eachLayer(layer => {
        const comarca = layer.feature.properties.nom_comar;
        const vegueria = getVegueria(comarca);

        if (!activeVegueria || vegueria === activeVegueria) {
            layer.setStyle({
                fillOpacity: 0.6,
                opacity: 1
            });
        } else {
            layer.setStyle({
                fillOpacity: 0.08,
                opacity: 0.4
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

function getFeatureName(feature) {
    if (activeDataset === "catalunya") {
        return feature.properties.nom_comar;
    }

    if (activeDataset === "usa") {
        return feature.properties.name;
    }

    return null;
}

function updateModeLabels() {
    if (activeDataset === "usa") {
        btnComarca.textContent = "Estats";
        btnCapital.textContent = "Capitals";
        btnMunicipi.style.display = "none"; // USA no tiene municipis
    } else {
        btnComarca.textContent = "Comarques";
        btnCapital.textContent = "Capitals";
        btnMunicipi.style.display = "inline-block";
    }
}
