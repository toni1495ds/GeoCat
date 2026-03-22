# GeoCat – Pràctica Bombers

App de pràctica de geografia interactiva per preparar oposicions de Bombers de Catalunya.

---

## Estructura del projecte

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
│   │   ├── municipis_tarragona.json
│   │   ├── rius.geojson
│   │   ├── serralades.geojson
│   │   └── carreteres.geojson
│   └── usa/
│       ├── states.json
│       └── capitals.json
├── scripts/
│   └── fetch-carreteres.js
├── tests/
│   └── app.spec.ts
├── playwright.config.ts
├── package.json
└── package-lock.json
```

---

## Modes de joc

### Catalunya
- **Comarques** – Clica la comarca correcta al mapa
- **Capitals** – Clica la comarca que correspon a la capital indicada
- **Municipis** – Clica la comarca on es troba el municipi indicat
- **Rius** – Clica el riu indicat al mapa (22 rius principals)
- **Serralades** – Clica la serralada o massís indicat (11 serralades)
- **Carreteres** – Clica la carretera indicada al mapa (26 carreteres)

### USA
- **Estats** – Clica l'estat correcte
- **Capitals** – Clica l'estat que correspon a la capital indicada

### Filtres disponibles
- Per **Vegueria** (modes Comarques i Capitals)
- Per **Província** (mode Municipis)

---

## Com executar

L'app necessita un servidor local per carregar els fitxers GeoJSON/JSON.
No funciona obrint `index.html` directament des del sistema de fitxers.

```bash
npm run serve    # servidor a http://localhost:3000
```

O amb VS Code: clic dret sobre `index.html` → *Open with Live Server*.

---

## Dades geogràfiques

Les geometries de **carreteres** i **rius** provenen d'OpenStreetMap (llicència ODbL).
Les **serralades** són polígons aproximats basats en la geografia real de Catalunya.

Per regenerar el fitxer de carreteres amb dades actualitzades d'OSM:

```bash
node scripts/fetch-carreteres.js
```

---

## Sistema d'usuaris

Usuaris i puntuacions es guarden al **localStorage** del navegador.

- Les dades només existeixen en aquell navegador/ordinador
- El leaderboard no és compartit entre usuaris
- Les contrasenyes es guarden amb hash SHA-256

---

## Testing

Tests E2E amb Playwright, executats també automàticament a cada push via GitHub Actions.

```bash
npm install
npx playwright test
```
