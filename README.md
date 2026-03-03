# 🗺️ GeoCat – Pràctica Bombers

App de pràctica de geografia interactiva per preparar oposicions de Bombers de Catalunya.

---

## 📁 Estructura del projecte

## 📁 Estructura del projecte

```
GeoCat/
├── index.html
├── style.css
├── app.js
├── utils.js
├── data/
│   ├── catalunya/
│   │   ├── comarques.geojson
│   │   ├── capitals.json
│   │   ├── municipis_barcelona.json
│   │   ├── municipis_girona.json
│   │   ├── municipis_lleida.json
│   │   └── municipis_tarragona.json
│   └── usa/
│       ├── states.json
│       └── capitals.json
├── tests/
│   └── app.spec.ts
├── playwright.config.ts
├── package.json
├── package-lock.json
├── .gitignore
└── .github/
    └── workflows/
        └── playwright.yml
```
---

## 🎮 Modes de joc

- **Comarques** – Clica la comarca correcta al mapa
- **Capitals** – Clica la comarca que correspon a la capital indicada
- **Municipis** – Clica la comarca on es troba el municipi indicat

### Filtres disponibles
- Per **Vegueria** (en mode Comarques i Capitals)
- Per **Província** (en mode Municipis)
- Mapa alternatiu: **USA** (estats i capitals)

---

## 🚀 Com executar el projecte

L'app necessita un servidor local per carregar els fitxers JSON i GeoJSON.
**No funciona obrint l'`index.html` directament** des del Finder/Explorer.

### Opció 1 – VS Code + Live Server (recomanat)
1. Instal·la l'extensió **Live Server** a VS Code
2. Clic dret sobre `index.html` → "Open with Live Server"

### Opció 2 – Python
```bash
# Python 3
python3 -m http.server 8000
# Obre http://localhost:8000
```

### Opció 3 – Node.js
```bash
npx serve .
```

---

## 👤 Sistema d'usuaris (versió actual)

Actualment els usuaris i puntuacions es guarden al **localStorage** del navegador.

⚠️ Això vol dir:
- Les dades **només existeixen en aquell navegador**
- Si canvies d'ordinador o navegador, es perden
- El leaderboard **no és compartit** entre usuaris reals

---
## 🧪 Testing

El projecte inclou tests E2E amb **Playwright**.

### ▶️ Executar tests en local

```bash
npm install
npx playwright test
```

Els tests també s'executen automàticament a cada push mitjançant GitHub Actions.
---

TO BE CONTINUED
