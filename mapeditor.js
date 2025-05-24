console.log('mapeditor.js script started');
(function() {

// mapeditor.js
// JavaScript port of mapeditor.py (Pygame version)
// This file provides a map editor UI similar to the Python version, using HTML5 Canvas.

// --- Map Editor Constants ---
const TILE_TYPES = {
    '0': { name: 'Grass', src: 'Sprites/Map/Grass.png' },
    '1': { name: 'Tree', src: 'Sprites/Map/Tree.png' },
    '2': { name: 'Rock', src: 'Sprites/Map/Rock.png' },
    '3': { name: 'Water1', src: 'Sprites/Map/Water1.png' },
    '4': { name: 'Water2', src: 'Sprites/Map/Water2.png' },
    '5': { name: 'Sand', src: 'Sprites/Map/Sand.png' },
    '6': { name: 'AppleTree', src: 'Sprites/Map/AppleTree.png' },
    '8': { name: 'Wood_wall', src: 'Sprites/Map/Wood_wall.png' },
    's': { name: 'Sapling', src: 'Sprites/Map/sapling.png' },
};
const TILE_KEYS = Object.keys(TILE_TYPES);
const TILE_SIZE = 32;
const BAR_WIDTH = 64;
const BAR_PADDING = 8;
const TOP_BAR_HEIGHT = 40;

// --- Map Data ---
let mapWidth = 41;
let mapHeight = 34;
let mapData = Array.from({ length: mapHeight }, () => Array(mapWidth).fill('0'));
let selectedTile = 0;
let feedbackMessage = '';
let feedbackTimeout = null;

// --- Map Loading Helpers ---
function loadMapStringToData(mapString) {
    const rows = mapString.trim().split(/\r?\n/);
    for (let y = 0; y < mapHeight; y++) {
        if (rows[y]) {
            for (let x = 0; x < mapWidth; x++) {
                mapData[y][x] = rows[y][x] || '0';
            }
        } else {
            for (let x = 0; x < mapWidth; x++) mapData[y][x] = '0';
        }
    }
}

function loadSavedOrTemplateMap(cb) {
    // Try to load from localStorage, else fetch usermaptemplate.txt
    const userMap = localStorage.getItem('usermap_txt');
    if (userMap) {
        loadMapStringToData(userMap);
        mapEditorEditable = true;
        if (cb) cb();
    } else {
        fetch('usermaptemplate.txt')
            .then(r => r.text())
            .then(txt => { loadMapStringToData(txt); mapEditorEditable = true; if (cb) cb(); })
            .catch(() => { mapEditorEditable = true; if (cb) cb(); });
    }
}

function loadDefaultMap(cb) {
    // Loads the non-modifiable default map.txt for preview
    fetch('map.txt')
        .then(r => r.text())
        .then(txt => { loadMapStringToData(txt); mapEditorEditable = false; if (cb) cb(); })
        .catch(() => { mapEditorEditable = false; if (cb) cb(); });
}

// --- Sprites ---
const tileImages = {};
let tilesLoaded = 0;
const totalTiles = TILE_KEYS.length;
for (const code of TILE_KEYS) {
    const img = new Image();
    img.src = TILE_TYPES[code].src;
    img.onload = () => {
        tilesLoaded++;
        if (tilesLoaded === totalTiles) {
            drawMapEditor();
        }
    };
    tileImages[code] = img;
}

// --- Map Editor UI ---
let mapEditorCanvas = null;
let mapEditorCtx = null;
let mapEditorActive = false;
let mapEditorEditable = true;

function showMapEditor() {
    // Remove any previous instance
    if (mapEditorCanvas && mapEditorCanvas.parentNode) {
        mapEditorCanvas.parentNode.removeChild(mapEditorCanvas);
    }
    mapEditorCanvas = document.createElement('canvas');
    // Calculate scale to fit within viewport
    const maxW = window.innerWidth * 0.98;
    const maxH = window.innerHeight * 0.98;
    const naturalW = TILE_SIZE * mapWidth + BAR_WIDTH;
    const naturalH = TILE_SIZE * mapHeight + TOP_BAR_HEIGHT + 40;
    const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
    mapEditorCanvas.width = naturalW;
    mapEditorCanvas.height = naturalH;
    mapEditorCanvas.style.width = (naturalW * scale) + 'px';
    mapEditorCanvas.style.height = (naturalH * scale) + 'px';
    mapEditorCanvas.style.position = 'fixed';
    mapEditorCanvas.style.left = '0';
    mapEditorCanvas.style.top = '0';
    mapEditorCanvas.style.right = '0';
    mapEditorCanvas.style.bottom = '0';
    mapEditorCanvas.style.margin = 'auto';
    mapEditorCanvas.style.zIndex = 1000;
    mapEditorCanvas.style.background = '#e0e0e0';
    document.body.appendChild(mapEditorCanvas);
    mapEditorCtx = mapEditorCanvas.getContext('2d');
    mapEditorCanvas.addEventListener('mousedown', mapEditorMouseDown);
    mapEditorActive = true;
    // Load map (saved or template) before drawing
    loadSavedOrTemplateMap(() => {
        if (tilesLoaded === totalTiles) {
            drawMapEditor();
        } else {
            // Draw a loading message until images are ready
            mapEditorCtx.font = '32px sans-serif';
            mapEditorCtx.fillStyle = '#333';
            mapEditorCtx.fillText('Loading tiles...', 40, 80);
            const waitForTiles = setInterval(() => {
                if (tilesLoaded === totalTiles) {
                    clearInterval(waitForTiles);
                    drawMapEditor();
                }
            }, 50);
        }
    });
}

function hideMapEditor() {
    if (mapEditorCanvas && mapEditorCanvas.parentNode) {
        mapEditorCanvas.parentNode.removeChild(mapEditorCanvas);
    }
    mapEditorCanvas = null;
    mapEditorCtx = null;
    mapEditorActive = false;
}

function drawMapEditor() {
    if (!mapEditorActive || !mapEditorCtx) return;
    mapEditorCtx.clearRect(0, 0, mapEditorCanvas.width, mapEditorCanvas.height);
    // Top bar
    mapEditorCtx.fillStyle = '#b4b4c8';
    mapEditorCtx.fillRect(0, 0, mapEditorCanvas.width, TOP_BAR_HEIGHT);
    mapEditorCtx.font = '20px sans-serif';
    mapEditorCtx.fillStyle = '#222';
    mapEditorCtx.fillText('Map Editor - Click tiles to paint. ESC to exit. S: Save, C: Clear', 10, 28);
    // Worldgen button
    const worldgenBtn = { x: mapEditorCanvas.width - 340, y: 5, w: 160, h: 30 };
    mapEditorCtx.fillStyle = '#6a8';
    mapEditorCtx.fillRect(worldgenBtn.x, worldgenBtn.y, worldgenBtn.w, worldgenBtn.h);
    mapEditorCtx.strokeStyle = '#222';
    mapEditorCtx.strokeRect(worldgenBtn.x, worldgenBtn.y, worldgenBtn.w, worldgenBtn.h);
    mapEditorCtx.font = '18px sans-serif';
    mapEditorCtx.fillStyle = '#222';
    mapEditorCtx.textAlign = 'center';
    mapEditorCtx.fillText('Worldgen', worldgenBtn.x + worldgenBtn.w/2, worldgenBtn.y + 20);
    // Load default map button
    const loadDefaultBtn = { x: mapEditorCanvas.width - 170, y: 5, w: 160, h: 30 };
    mapEditorCtx.fillStyle = '#8ad';
    mapEditorCtx.fillRect(loadDefaultBtn.x, loadDefaultBtn.y, loadDefaultBtn.w, loadDefaultBtn.h);
    mapEditorCtx.strokeStyle = '#222';
    mapEditorCtx.strokeRect(loadDefaultBtn.x, loadDefaultBtn.y, loadDefaultBtn.w, loadDefaultBtn.h);
    mapEditorCtx.font = '18px sans-serif';
    mapEditorCtx.fillStyle = '#222';
    mapEditorCtx.textAlign = 'center';
    mapEditorCtx.fillText('Load default map', loadDefaultBtn.x + loadDefaultBtn.w/2, loadDefaultBtn.y + 20);
    // Back to editing button (only in preview mode)
    let backBtn = null;
    if (!mapEditorEditable) {
        backBtn = { x: 10, y: 5, w: 180, h: 30 };
        mapEditorCtx.fillStyle = '#6ad';
        mapEditorCtx.fillRect(backBtn.x, backBtn.y, backBtn.w, backBtn.h);
        mapEditorCtx.strokeStyle = '#222';
        mapEditorCtx.strokeRect(backBtn.x, backBtn.y, backBtn.w, backBtn.h);
        mapEditorCtx.font = '18px sans-serif';
        mapEditorCtx.fillStyle = '#222';
        mapEditorCtx.textAlign = 'center';
        mapEditorCtx.fillText('Back to editing', backBtn.x + backBtn.w/2, backBtn.y + 20);
        mapEditorCtx.textAlign = 'left';
    }
    // Map
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            const code = mapData[y][x];
            if (tileImages[code] && tileImages[code].complete) {
                mapEditorCtx.drawImage(tileImages[code], x * TILE_SIZE, y * TILE_SIZE + TOP_BAR_HEIGHT, TILE_SIZE, TILE_SIZE);
            } else {
                mapEditorCtx.fillStyle = '#888';
                mapEditorCtx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TOP_BAR_HEIGHT, TILE_SIZE, TILE_SIZE);
            }
            mapEditorCtx.strokeStyle = '#888';
            mapEditorCtx.strokeRect(x * TILE_SIZE, y * TILE_SIZE + TOP_BAR_HEIGHT, TILE_SIZE, TILE_SIZE);
        }
    }
    // Right bar
    const barX = TILE_SIZE * mapWidth + BAR_PADDING;
    mapEditorCtx.fillStyle = '#ccc';
    mapEditorCtx.fillRect(TILE_SIZE * mapWidth, TOP_BAR_HEIGHT, BAR_WIDTH, TILE_SIZE * mapHeight);
    for (let i = 0; i < TILE_KEYS.length; i++) {
        const code = TILE_KEYS[i];
        const y = TOP_BAR_HEIGHT + BAR_PADDING + i * (TILE_SIZE + BAR_PADDING);
        if (i === selectedTile) {
            mapEditorCtx.strokeStyle = '#ff0';
            mapEditorCtx.lineWidth = 3;
            mapEditorCtx.strokeRect(barX - BAR_PADDING / 2, y - BAR_PADDING / 2, TILE_SIZE + BAR_PADDING, TILE_SIZE + BAR_PADDING);
        }
        if (tileImages[code] && tileImages[code].complete) {
            mapEditorCtx.drawImage(tileImages[code], barX, y, TILE_SIZE, TILE_SIZE);
        } else {
            mapEditorCtx.fillStyle = '#888';
            mapEditorCtx.fillRect(barX, y, TILE_SIZE, TILE_SIZE);
        }
        mapEditorCtx.font = '16px sans-serif';
        mapEditorCtx.fillStyle = '#222';
        mapEditorCtx.fillText(code, barX + TILE_SIZE + 2, y + 20);
    }
    // Feedback
    if (feedbackMessage) {
        mapEditorCtx.font = '20px sans-serif';
        mapEditorCtx.fillStyle = '#080';
        mapEditorCtx.fillText(feedbackMessage, 10, mapEditorCanvas.height - 10);
    }
    if (!mapEditorEditable) {
        mapEditorCtx.font = '24px sans-serif';
        mapEditorCtx.fillStyle = '#c00';
        mapEditorCtx.fillText('Preview: default map (editing disabled)', 10, mapEditorCanvas.height - 40);
    }
}

function mapEditorMouseDown(e) {
    const rect = mapEditorCanvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (mapEditorCanvas.width / rect.width);
    const my = (e.clientY - rect.top) * (mapEditorCanvas.height / rect.height);
    // Worldgen button (always enabled)
    const worldgenBtn = { x: mapEditorCanvas.width - 340, y: 5, w: 160, h: 30 };
    if (mx >= worldgenBtn.x && mx < worldgenBtn.x + worldgenBtn.w && my >= worldgenBtn.y && my < worldgenBtn.y + worldgenBtn.h) {
        if (!mapEditorEditable) mapEditorEditable = true;
        generateWorld();
        return;
    }
    // Load default map button
    const loadDefaultBtn = { x: mapEditorCanvas.width - 170, y: 5, w: 160, h: 30 };
    if (mx >= loadDefaultBtn.x && mx < loadDefaultBtn.x + loadDefaultBtn.w && my >= loadDefaultBtn.y && my < loadDefaultBtn.y + loadDefaultBtn.h) {
        loadDefaultMap(() => {
            feedbackMessage = 'Default map loaded!';
            clearTimeout(feedbackTimeout);
            feedbackTimeout = setTimeout(() => { feedbackMessage = ''; if(mapEditorActive) drawMapEditor(); }, 1200);
            drawMapEditor();
        });
        return;
    }
    // Back to editing button (only in preview mode)
    if (!mapEditorEditable) {
        const backBtn = { x: 10, y: 5, w: 180, h: 30 };
        if (mx >= backBtn.x && mx < backBtn.x + backBtn.w && my >= backBtn.y && my < backBtn.y + backBtn.h) {
            loadSavedOrTemplateMap(() => {
                feedbackMessage = 'Template loaded!';
                mapEditorEditable = true;
                clearTimeout(feedbackTimeout);
                feedbackTimeout = setTimeout(() => { feedbackMessage = ''; if(mapEditorActive) drawMapEditor(); }, 1200);
                drawMapEditor();
            });
            return;
        }
        // Don't allow other actions in preview mode
        return;
    }
    // Right bar
    const barX = TILE_SIZE * mapWidth + BAR_PADDING;
    for (let i = 0; i < TILE_KEYS.length; i++) {
        const code = TILE_KEYS[i];
        const y = TOP_BAR_HEIGHT + BAR_PADDING + i * (TILE_SIZE + BAR_PADDING);
        if (
            mx >= barX && mx < barX + TILE_SIZE &&
            my >= y && my < y + TILE_SIZE
        ) {
            selectedTile = i;
            drawMapEditor();
            return;
        }
    }
    // Map area
    if (
        mx >= 0 && mx < TILE_SIZE * mapWidth &&
        my >= TOP_BAR_HEIGHT && my < TOP_BAR_HEIGHT + TILE_SIZE * mapHeight
    ) {
        const gx = Math.floor(mx / TILE_SIZE);
        const gy = Math.floor((my - TOP_BAR_HEIGHT) / TILE_SIZE);
        if (gx >= 0 && gx < mapWidth && gy >= 0 && gy < mapHeight) {
            mapData[gy][gx] = TILE_KEYS[selectedTile];
            drawMapEditor();
        }
    }
}

// --- Worldgen (ported from worldgen.py) ---
function perlinNoise(width, height, scale=16, octaves=4, persistence=0.5, lacunarity=2.0, seed) {
    // Simple value noise for terrain generation
    if (seed !== undefined) {
        Math.seedrandom ? Math.seedrandom(seed) : null;
    }
    function lerp(a, b, t) { return a + t * (b - a); }
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    const grad = {};
    function grad2(x, y) {
        const k = x + ',' + y;
        if (!(k in grad)) {
            const angle = Math.random() * 2 * Math.PI;
            grad[k] = [Math.cos(angle), Math.sin(angle)];
        }
        return grad[k];
    }
    function dotGridGradient(ix, iy, x, y) {
        const [gx, gy] = grad2(ix, iy);
        const dx = x - ix, dy = y - iy;
        return dx * gx + dy * gy;
    }
    function noise(x, y) {
        const x0 = Math.floor(x), y0 = Math.floor(y);
        const x1 = x0 + 1, y1 = y0 + 1;
        const sx = fade(x - x0), sy = fade(y - y0);
        let n0 = dotGridGradient(x0, y0, x, y);
        let n1 = dotGridGradient(x1, y0, x, y);
        let ix0 = lerp(n0, n1, sx);
        n0 = dotGridGradient(x0, y1, x, y);
        n1 = dotGridGradient(x1, y1, x, y);
        let ix1 = lerp(n0, n1, sx);
        return lerp(ix0, ix1, sy);
    }
    const arr = [];
    let maxval = -Infinity, minval = Infinity;
    for (let y = 0; y < height; y++) {
        arr[y] = [];
        for (let x = 0; x < width; x++) {
            let freq = scale;
            let amp = 1.0;
            let val = 0.0;
            for (let o = 0; o < octaves; o++) {
                val += noise(x / freq, y / freq) * amp;
                freq /= lacunarity;
                amp *= persistence;
            }
            arr[y][x] = val;
            maxval = Math.max(maxval, val);
            minval = Math.min(minval, val);
        }
    }
    // Normalize
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            arr[y][x] = (arr[y][x] - minval) / (maxval - minval);
        }
    }
    return arr;
}

function generateWorld() {
    // Ported from worldgen.py:generate_world
    const width = mapWidth, height = mapHeight;
    const heightmap = perlinNoise(width, height, 16, 4, 0.5, 2.0);
    const biomemap = perlinNoise(width, height, 8, 2, 0.5, 2.0, 42);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const h = heightmap[y][x];
            const b = biomemap[y][x];
            // Water
            if (h < 0.32) {
                mapData[y][x] = h < 0.28 ? '3' : '4';
            } else if (h < 0.36) {
                mapData[y][x] = '5';
            } else if (h < 0.7) {
                if (b > 0.6) {
                    mapData[y][x] = Math.random() < 0.7 ? '1' : '0';
                } else if (b < 0.25) {
                    mapData[y][x] = Math.random() < 0.3 ? '2' : '0';
                } else {
                    mapData[y][x] = '0';
                }
            } else {
                if (b > 0.5) {
                    mapData[y][x] = Math.random() < 0.8 ? '1' : '6';
                } else {
                    mapData[y][x] = Math.random() < 0.5 ? '2' : '0';
                }
            }
        }
    }
    // Add some clearings in forests
    for (let n = 0, N = Math.floor(Math.random() * 3) + 2; n < N; n++) {
        const cx = Math.floor(Math.random() * (width - 10)) + 5;
        const cy = Math.floor(Math.random() * (height - 10)) + 5;
        for (let m = 0, M = Math.floor(Math.random() * 8) + 8; m < M; m++) {
            const dx = Math.floor(Math.random() * 5) - 2;
            const dy = Math.floor(Math.random() * 5) - 2;
            const x = cx + dx, y = cy + dy;
            if (x >= 0 && x < width && y >= 0 && y < height) {
                if (mapData[y][x] === '1' || mapData[y][x] === '6') {
                    mapData[y][x] = '0';
                }
            }
        }
    }
    feedbackMessage = 'World generated!';
    clearTimeout(feedbackTimeout);
    feedbackTimeout = setTimeout(() => { feedbackMessage = ''; if(mapEditorActive) drawMapEditor(); }, 1200);
    drawMapEditor();
}

// Save map to localStorage
function saveMapToLocalStorage() {
    // Save as a string (same format as map.txt)
    let mapString = '';
    for (let y = 0; y < mapHeight; y++) {
        mapString += mapData[y].join('') + (y < mapHeight - 1 ? '\n' : '');
    }
    localStorage.setItem('usermap_txt', mapString);
}

// Save map to file
function saveMapToFile() {
    let mapString = '';
    for (let y = 0; y < mapHeight; y++) {
        mapString += mapData[y].join('') + (y < mapHeight - 1 ? '\n' : '');
    }
    const blob = new Blob([mapString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'usermap.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Add worldgen hotkey: G
document.addEventListener('keydown', e => {
    if (!mapEditorActive) return;
    if (e.key === 'Escape') {
        hideMapEditor();
        return;
    }
    if (!mapEditorEditable) return; // Disable all hotkeys if not editable, except ESC above
    if (e.key === 'g' || e.key === 'G') {
        generateWorld();
    }
    if (e.key === 'Escape') {
        hideMapEditor();
    }
    if (e.key === 's' || e.key === 'S') {
        saveMapToLocalStorage();
        feedbackMessage = 'Map saved to browser!';
        clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => { feedbackMessage = ''; if(mapEditorActive) drawMapEditor(); }, 1200);
        drawMapEditor();
    }
    if (e.key === 'c' || e.key === 'C') {
        // Clear map
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                mapData[y][x] = '0';
            }
        }
        feedbackMessage = 'Map cleared!';
        clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => { feedbackMessage = ''; if(mapEditorActive) drawMapEditor(); }, 1200);
        drawMapEditor();
    }
});

// Load map from localStorage if available
if (localStorage.getItem('usermap_txt')) {
    try {
        const loaded = JSON.parse(localStorage.getItem('usermap_txt'));
        if (Array.isArray(loaded) && loaded.length === mapHeight && loaded[0].length === mapWidth) {
            mapData = loaded;
        }
    } catch {}
}

// Export for main.js
window.showMapEditor = showMapEditor;
console.log('mapeditor.js loaded, window.showMapEditor set:', typeof window.showMapEditor);
})();
