# 🗺️ GeoCat – Pràctica Bombers

App de pràctica de geografia interactiva per preparar oposicions de Bombers de Catalunya.

---

## 📁 Estructura del projecte

```
GeoCat/
├── index.html
├── style.css
├── app.js
├── utils.js
└── data/
    ├── catalunya/
    │   ├── comarques.geojson
    │   ├── capitals.json
    │   ├── municipis_barcelona.json
    │   ├── municipis_girona.json
    │   ├── municipis_lleida.json
    │   └── municipis_tarragona.json
    └── usa/
        ├── states.json
        └── capitals.json
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

## 🔥 Pròxim pas: integració amb Firebase

Per tenir un sistema d'usuaris real amb:
- ✅ Login amb Google (Gmail)
- ✅ Dades guardades al núvol
- ✅ Leaderboard global i compartit
- ✅ Funciona des de qualsevol dispositiu

### Passos per configurar Firebase

**1. Crea el projecte**
- Vés a [firebase.google.com](https://firebase.google.com)
- "Get started" → "Create a project" → Posa-li nom (ex: `geocat`)
- Pots desactivar Google Analytics

**2. Activa Authentication**
- Menú esquerre → `Authentication` → `Get started`
- Pestanya "Sign-in method" → activa **Google**
- Afegeix el teu email com a "Project support email" → Guarda

**3. Activa Firestore Database**
- Menú esquerre → `Firestore Database` → `Create database`
- Selecciona **"Start in test mode"**
- Tria regió: `europe-west1` (recomanat)

**4. Registra l'app web**
- Engranatge ⚙️ → `Project settings`
- Baixa fins a "Your apps" → clica `</>` (Web)
- Posa qualsevol nom → "Register app"
- Copia el bloc `firebaseConfig` que apareix:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

**5. Integració**
- Obre una conversa nova amb Claude
- Passa-li aquest README + el codi dels 4 fitxers + el teu `firebaseConfig`
- Demana-li que integri Firebase amb login de Google i Firestore per al leaderboard

---

## 🛠️ Tecnologies utilitzades

| Tecnologia | Ús |
|---|---|
| HTML / CSS / JS | Frontend |
| [Leaflet.js](https://leafletjs.com/) | Mapa interactiu |
| GeoJSON | Geometria de comarques i estats |
| localStorage | Emmagatzematge temporal d'usuaris (versió actual) |
| Firebase Auth | Login amb Google *(pendent)* |
| Firestore | Base de dades al núvol *(pendent)* |

---

## 📝 Notes

- Les contrasenyes de la versió actual es guarden en text pla al localStorage. Això és acceptable per una app local de pràctica, però **no és segur per producció**. Firebase resoldrà aquest problema completament.
- L'app és responsive i funciona en mòbil.
- El leaderboard acumula punts de totes les partides jugades.
