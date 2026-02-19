// =====================
// AUTH & STORAGE
// =====================
const DB_KEY = 'geocat_users';
const SESSION_KEY = 'geocat_session';
const LB_KEY = 'geocat_scores';

function getUsers() { return JSON.parse(localStorage.getItem(DB_KEY) || '{}'); }
function saveUsers(u) { localStorage.setItem(DB_KEY, JSON.stringify(u)); }
function getSession() { return localStorage.getItem(SESSION_KEY); }
function setSession(u) { localStorage.setItem(SESSION_KEY, u); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

function getScores() { return JSON.parse(localStorage.getItem(LB_KEY) || '{}'); }
function saveScore(username, correct, total) {
    const scores = getScores();
    const prev = scores[username] || { correct: 0, total: 0 };
    scores[username] = { correct: prev.correct + correct, total: prev.total + total };
    localStorage.setItem(LB_KEY, JSON.stringify(scores));
}

// =====================
// NAVEGACIÓ
// =====================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.toggle('hidden', s.id !== id);
    });
}

function enterHome() {
    document.getElementById('home-username-text').textContent = currentUser;
    document.getElementById('home-avatar').textContent = currentUser[0].toUpperCase();
    showScreen('screen-home');
}

function logout() {
    clearSession();
    currentUser = null;
    showScreen('screen-login');
}

// =====================
// LEADERBOARD
// =====================
function stringToColor(str) {
    const colors = ['#D62828', '#1976d2', '#2ecc71', '#e67e22', '#9b59b6', '#e91e63', '#00bcd4'];
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
}

function showLeaderboard() {
    const scores = getScores();
    const list = document.getElementById('lb-list');
    list.innerHTML = '';

    const sorted = Object.entries(scores)
        .map(([u, s]) => ({
            u,
            correct: s.correct,
            total: s.total,
            acc: s.total > 0 ? Math.round(s.correct / s.total * 100) : 0
        }))
        .sort((a, b) => b.correct - a.correct || b.acc - a.acc);

    if (sorted.length === 0) {
        list.innerHTML = '<div class="lb-empty">Encara no hi ha puntuacions. Juga per aparèixer aquí! 🗺️</div>';
    } else {
        const medals = ['🥇', '🥈', '🥉'];
        sorted.forEach((entry, i) => {
            const isMe = entry.u === currentUser;
            const row = document.createElement('div');
            row.className = 'lb-row' + (isMe ? ' me' : '');
            row.innerHTML = `
                <div class="lb-rank">${medals[i] || i + 1}</div>
                <div class="lb-avatar" style="background:${stringToColor(entry.u)}">${entry.u[0].toUpperCase()}</div>
                <div class="lb-name">${entry.u}${isMe ? ' <span style="color:var(--gold);font-size:11px;margin-left:4px;">TU</span>' : ''}</div>
                <div class="lb-stats">
                    <div class="lb-stat">
                        <div class="lb-stat-val">${entry.correct}</div>
                        <div class="lb-stat-label">Punts</div>
                    </div>
                    <div class="lb-accuracy">${entry.acc}%</div>
                </div>`;
            list.appendChild(row);
        });
    }
    showScreen('screen-leaderboard');
}

// =====================
// HELPERS GENERALS
// =====================
function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getVegueria(comarca) {
    for (const v in vegueries) {
        if (vegueries[v].includes(comarca)) return v;
    }
    return null;
}

function getUSARegion(name) {
    for (const r in usaRegions) {
        if (usaRegions[r].includes(name)) return r;
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

// =====================
// MAPA / FILTRES
// =====================
function updateProvinciaFilterOnMap() {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer(layer => {
        const comarca = layer.feature.properties.nom_comar;
        const comarquesProvincia = Object.values(municipisByProvincia[activeProvincia] || {});
        const isIn = !activeProvincia || comarquesProvincia.includes(comarca);
        layer.setStyle({ fillOpacity: isIn ? 0.6 : 0.05, opacity: isIn ? 1 : 0.3 });
    });
}

function updateVegueriaFilter() {
    if (!geojsonLayer) return;
    geojsonLayer.eachLayer(layer => {
        const comarca = layer.feature.properties.nom_comar;
        const isIn = !activeVegueria || getVegueria(comarca) === activeVegueria;
        layer.setStyle({ fillOpacity: isIn ? 0.6 : 0.08, opacity: isIn ? 1 : 0.4 });
    });
}

// =====================
// SCORE & FEEDBACK
// =====================
function updateScore() {
    document.getElementById('score-correct').textContent = scoreCorrect;
    document.getElementById('score-wrong').textContent = scoreWrong;
}

function showFeedback(ok) {
    const fb = document.getElementById('feedback');
    fb.textContent = ok ? '✓ Correcte!' : '✗ Incorrecte!';
    fb.className = ok ? 'correcte' : 'incorrecte';
}

// =====================
// MODE LABELS
// =====================
function updateModeLabels() {
    const isUSA = activeDataset === 'usa';
    document.getElementById('mode-comarca').textContent = isUSA ? 'Estats' : 'Comarques';
    document.getElementById('mode-capital').textContent = 'Capitals';
    document.getElementById('mode-municipi').style.display = isUSA ? 'none' : '';
}

function updateFiltersUI() {
    const vegueriaEl = document.getElementById('vegueria-select');
    const provinciaEl = document.getElementById('provincia-select');
    if (activeDataset === 'usa') {
        vegueriaEl.style.display = 'none';
        provinciaEl.style.display = 'none';
        return;
    }
    vegueriaEl.style.display = gameMode === 'MUNICIPI' ? 'none' : '';
    provinciaEl.style.display = gameMode === 'MUNICIPI' ? '' : 'none';
}

// =====================
// MODAL FI DE PARTIDA
// =====================
function showGameOver() {
    const total = scoreCorrect + scoreWrong;
    const acc = total > 0 ? Math.round(scoreCorrect / total * 100) : 0;

    document.getElementById('modal-correct').textContent = scoreCorrect;
    document.getElementById('modal-wrong').textContent = scoreWrong;
    document.getElementById('modal-accuracy').textContent = 'Precisió: ' + acc + '%';

    const emoji = document.getElementById('modal-emoji');
    const title = document.getElementById('modal-title');
    if (scoreWrong === 0) { emoji.textContent = '🏆'; title.textContent = 'Perfecte!'; }
    else if (acc >= 80) { emoji.textContent = '🎉'; title.textContent = 'Molt bé!'; }
    else if (acc >= 50) { emoji.textContent = '👍'; title.textContent = 'No està malament!'; }
    else { emoji.textContent = '💪'; title.textContent = 'Segueix practicant!'; }

    saveScore(currentUser, scoreCorrect, total);
    document.getElementById('modal-gameover').classList.add('show');
}
