#!/usr/bin/env node
// Descarrega geometries reals de carreteres des d'OpenStreetMap
// Ús: node scripts/fetch-carreteres.js

const https = require("https");
const fs = require("fs");
const path = require("path");

const ROADS = [
  "AP-7", "AP-2",
  "C-12", "C-13", "C-14", "C-15", "C-16", "C-17",
  "C-25", "C-26", "C-28", "C-31", "C-32", "C-33", "C-35", "C-37",
  "C-38", "C-43", "C-44", "C-51", "C-55", "C-58", "C-59", "C-60",
  "C-62", "C-65",
];

const BBOX = "40.45,0.15,42.90,3.35";
const OUT_FILE = path.join(__dirname, "../data/catalunya/carreteres.geojson");

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpPost(url, body, timeoutMs = 45000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = "data=" + encodeURIComponent(body);
    const options = {
      hostname: u.hostname,
      path: u.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(payload),
        "User-Agent": "GeoCat/1.0 (educational project)",
      },
    };
    const timer = setTimeout(() => { req.destroy(); reject(new Error("timeout")); }, timeoutMs);
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        clearTimeout(timer);
        if (!raw.startsWith("{")) {
          reject(new Error(`HTTP ${res.statusCode} — no JSON`));
        } else {
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error("JSON parse error")); }
        }
      });
    });
    req.on("error", e => { clearTimeout(timer); reject(e); });
    req.write(payload);
    req.end();
  });
}

function buildNodes(elements) {
  const n = {};
  for (const el of elements) if (el.type === "node") n[el.id] = [el.lon, el.lat];
  return n;
}

function waysToSegments(elements, nodes) {
  return elements
    .filter(e => e.type === "way")
    .map(w => w.nodes.map(id => nodes[id]).filter(Boolean))
    .filter(s => s.length >= 2);
}

function dist2(a, b) { return (a[0]-b[0])**2 + (a[1]-b[1])**2; }

function mergeSegments(segments) {
  if (segments.length === 0) return [];
  if (segments.length === 1) return segments[0];
  const result = [...segments[0]];
  const remaining = segments.slice(1);
  const T = 0.01 ** 2;
  while (remaining.length > 0) {
    const tail = result[result.length - 1];
    const head = result[0];
    let bi = -1, br = false, bf = true, bd = Infinity;
    remaining.forEach((seg, i) => {
      const d = [dist2(tail, seg[0]), dist2(tail, seg[seg.length-1]),
                 dist2(head, seg[0]), dist2(head, seg[seg.length-1])];
      const m = Math.min(...d);
      if (m < bd) {
        bd = m; bi = i;
        if (m === d[0]) { br = false; bf = true; }
        else if (m === d[1]) { br = true; bf = true; }
        else if (m === d[2]) { br = true; bf = false; }
        else { br = false; bf = false; }
      }
    });
    if (bi === -1 || bd > T) break;
    const seg = remaining.splice(bi, 1)[0];
    if (br) seg.reverse();
    if (bf) result.push(...seg.slice(1));
    else result.unshift(...seg.slice(0, -1));
  }
  return result;
}

function simplify(coords, step = 8) {
  if (coords.length <= 4) return coords;
  const out = [coords[0]];
  for (let i = step; i < coords.length - 1; i += step) out.push(coords[i]);
  out.push(coords[coords.length - 1]);
  return out;
}

async function fetchRoad(ref) {
  const query = `[out:json][timeout:40];
way["ref"="${ref}"]["highway"](${BBOX});
(._;>;);
out body;`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const endpoint of ENDPOINTS) {
      try {
        const data = await httpPost(endpoint, query);
        const nodes = buildNodes(data.elements);
        const segments = waysToSegments(data.elements, nodes);
        if (segments.length === 0) return null;
        return simplify(mergeSegments(segments), 8);
      } catch (e) {
        // try next endpoint
      }
    }
    if (attempt < 3) await sleep(4000 * attempt);
  }
  return null;
}

async function main() {
  // Llegir features existents per no perdre les que ja funcionin
  let existing = [];
  try {
    const cur = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
    existing = cur.features || [];
  } catch {}

  const done = new Set(existing.map(f => f.properties.nom));
  const features = [...existing];

  for (const ref of ROADS) {
    if (done.has(ref)) {
      process.stderr.write(`${ref}: ja descarregat ✓\n`);
      continue;
    }
    process.stderr.write(`Descarregant ${ref}... `);
    const coords = await fetchRoad(ref);
    if (coords && coords.length >= 2) {
      features.push({
        type: "Feature",
        properties: { nom: ref },
        geometry: { type: "LineString", coordinates: coords },
      });
      process.stderr.write(`✓ (${coords.length} punts)\n`);
    } else {
      process.stderr.write(`no trobat\n`);
    }
    // Desar progrés parcialment per no perdre res
    fs.writeFileSync(OUT_FILE, JSON.stringify({ type: "FeatureCollection", features }, null, 2));
    await sleep(3000);
  }

  process.stderr.write(`\nFet: ${features.length}/${ROADS.length} carreteres\n`);
}

main().catch(e => { process.stderr.write("Error fatal: " + e.message + "\n"); process.exit(1); });
