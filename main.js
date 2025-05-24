// main.js
// --- Pygame to JavaScript port: Initial Scaffolding ---

// Canvas setup
const canvas = document.createElement('canvas');
canvas.width = 1280;
canvas.height = 720;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Image assets
const IMAGES = {
    Grass: 'Sprites/Map/Grass.png',
    Tree: 'Sprites/Map/Tree.png',
    Rock: 'Sprites/Map/Rock.png',
    Water1: 'Sprites/Map/Water1.png',
    Water2: 'Sprites/Map/Water2.png',
    Sand: 'Sprites/Map/Sand.png',
    AppleTree: 'Sprites/Map/AppleTree.png',
    Wood_wall: 'Sprites/Map/Wood_wall.png',
    Sapling: 'Sprites/Map/sapling.png',
    Player: 'Sprites/Player1.png',
    Inventory_1: 'Sprites/Inventory/Inventory_box/Inventory_1.png',
    Inventory_2: 'Sprites/Inventory/Inventory_box/Inventory_2.png',
    Inventory_3: 'Sprites/Inventory/Inventory_box/Inventory_3.png',
    Inventory_4: 'Sprites/Inventory/Inventory_box/Inventory_4.png',
    Inventory_5: 'Sprites/Inventory/Inventory_box/Inventory_5.png',
    Apple: 'Sprites/Inventory/Apple.png',
    Wood: 'Sprites/Inventory/Wood.png',
    Sapling_inventory: 'Sprites/Inventory/Sapling.png',
    Axe_inventory: 'Sprites/Inventory/Axe.png',
    Plank: 'Sprites/Inventory/Plank.png',
};

const loadedImages = {};
let imagesLoaded = 0;
const totalImages = Object.keys(IMAGES).length;

// Preload images
for (const [key, src] of Object.entries(IMAGES)) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
        imagesLoaded++;
        if (imagesLoaded === totalImages) {
            requestAnimationFrame(gameLoop);
        }
    };
    loadedImages[key] = img;
}

// Game variables
let offsetX = 600;
let offsetY = 400;
let speed = 5;
let fps = 60;
let maxFps = -1;
let clickHeld = false;
let rightHeld = false;
let leftHeld = false;
let globalDir = 0;

// --- Classes ---
class Player {
    constructor(health) {
        this.health = health;
        this.startingHealth = health;
        this.x = 640;
        this.y = 360;
        this.dir = 0;
        this.frameCounter = 0;
        this.image = loadedImages.Player;
    }
    rotate(keys) {
        // WASD rotation logic
        let dir = this.dir;
        if (keys['KeyS']) {
            dir = 0;
            if (keys['KeyA']) dir += 45;
            if (keys['KeyD']) dir -= 45;
        }
        if (keys['KeyW']) {
            dir = 180;
            if (keys['KeyA']) dir -= 45;
            if (keys['KeyD']) dir += 45;
        }
        if (keys['KeyD']) {
            dir = 90;
            if (keys['KeyW']) dir += 45;
            if (keys['KeyS']) dir -= 45;
        }
        if (keys['KeyA']) {
            dir = 270;
            if (keys['KeyW']) dir -= 45;
            if (keys['KeyS']) dir += 45;
        }
        this.dir = dir;
        globalDir = dir;
    }
    update(keys) {
        this.rotate(keys);
        this.health -= 0.04 / fps * 60;
        if (this.health > this.startingHealth) this.health = this.startingHealth;
        if (this.health <= 0) {
            alert('Game Over!');
            window.location.reload();
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.dir - 180) * Math.PI / 180);
        ctx.drawImage(this.image, -this.image.width/2, -this.image.height/2);
        ctx.restore();
        // Draw health bar
        ctx.fillStyle = '#fff';
        ctx.fillRect(15, 15, this.startingHealth + 10, 30);
        ctx.fillStyle = 'rgb(128,0,0)';
        ctx.fillRect(20, 20, Math.max(0, this.health), 20);
    }
}

class Inventory {
    constructor(apple, wood, holding, sapling, plank) {
        this.apple = apple;
        this.wood = wood;
        this.holding = holding;
        this.sapling = sapling;
        this.plank = plank;
        this.holdingTile = 1;
        this.menuOpen = false;
        this.cKeyHeld = false;
        this.spaceKeyHeld = false;
        this.menuSelection = 1;
        this.inventoryList = ['axe', -1];
        this.listOfAllItems = ['axe', -1, 'apple', this.apple, 'wood', this.wood, 'sapling', this.sapling, 'plank', this.plank];
    }
    createList() {
        this.listOfAllItems = ['axe', -1, 'apple', this.apple, 'wood', this.wood, 'sapling', this.sapling, 'plank', this.plank];
        let number = 0;
        for (let i = 0; i < this.listOfAllItems.length / 2; i++) {
            let listStr = this.listOfAllItems[number];
            let listItem = this.listOfAllItems[number + 1];
            if (!this.inventoryList.includes(listStr) && listItem > 0) {
                this.inventoryList.push(listStr, String(listItem));
            } else if (this.inventoryList.includes(listStr) && listItem > 0) {
                let idx = this.inventoryList.indexOf(listStr);
                if (idx !== -1) this.inventoryList[idx + 1] = String(listItem);
            } else if (this.inventoryList.includes(listStr) && listItem === 0) {
                let idx = this.inventoryList.indexOf(listStr);
                if (idx !== -1) this.inventoryList.splice(idx, 2);
            }
            number += 2;
        }
    }
    changeHolding(keys) {
        // Number keys
        for (let i = 1; i <= 5; i++) {
            if (keys['Digit' + i]) this.holdingTile = i;
        }
        // Arrow keys
        if (!keys['ArrowRight']) rightHeld = false;
        if (!keys['ArrowLeft']) leftHeld = false;
        if (keys['ArrowRight'] && this.holdingTile < 5 && !rightHeld) {
            this.holdingTile++;
            rightHeld = true;
        }
        if (keys['ArrowLeft'] && this.holdingTile > 1 && !leftHeld) {
            this.holdingTile--;
            leftHeld = true;
        }
        try {
            let item = this.inventoryList[(this.holdingTile - 1) * 2];
            if (['axe', 'apple', 'wood', 'sapling', 'plank'].includes(item)) {
                this.holding = item;
            }
        } catch {
            this.holding = 'fist';
        }
    }
    draw(ctx) {
        // Draw inventory box
        let invImg = loadedImages['Inventory_' + this.holdingTile];
        ctx.drawImage(invImg, 440, 630);
        // Draw inventory sprites and numbers
        let number = 0;
        for (let i = 0; i < this.listOfAllItems.length / 2; i++) {
            if (this.inventoryList.length > number) {
                let item = this.inventoryList[number];
                let imgKey = null;
                if (item === 'apple') imgKey = 'Apple';
                if (item === 'wood') imgKey = 'Wood';
                if (item === 'sapling') imgKey = 'Sapling_inventory';
                if (item === 'axe') imgKey = 'Axe_inventory';
                if (item === 'plank') imgKey = 'Plank';
                if (imgKey) ctx.drawImage(loadedImages[imgKey], 455 + number * 40, 640);
            }
            number += 2;
        }
        number = 1;
        ctx.font = '20px sans-serif';
        ctx.fillStyle = 'black';
        for (let i = 0; i < this.listOfAllItems.length / 2; i++) {
            if (this.inventoryList.length > number) {
                let item = this.inventoryList[number - 1];
                if (['apple', 'wood', 'sapling', 'axe', 'plank'].includes(item)) {
                    if (this.inventoryList[number] !== -1) {
                        ctx.fillText(this.inventoryList[number], 415 + number * 40, 655);
                    }
                }
            }
            number += 2;
        }
    }
    craft(keys) {
        if (!keys['Space']) this.spaceKeyHeld = false;
        if (!keys['KeyC']) this.cKeyHeld = false;
        if (keys['KeyC'] && !this.cKeyHeld) {
            this.menuOpen = !this.menuOpen;
            this.cKeyHeld = true;
        }
        if (this.menuOpen) {
            if (this.wood >= 4) {
                ctx.font = '40px sans-serif';
                ctx.fillStyle = 'black';
                ctx.fillText(`3 wood --> 1 plank [${Math.floor(this.wood / 4)}]`, 20, 90);
            }
            if (this.menuSelection === 1 && this.wood >= 3 && !this.spaceKeyHeld && keys['Space']) {
                this.plank += 1;
                this.wood -= 3;
                this.spaceKeyHeld = true;
            }
            clickHeld = true;
        }
    }
    update(keys) {
        this.createList();
        this.changeHolding(keys);
        this.craft(keys);
    }
}

// --- Map and Game Logic ---
let globalList = null;
let mapWidth = 0;
let lastOffsetX = offsetX;
let lastOffsetY = offsetY;

function loadMap(text) {
    // text: string of map file
    let list = [];
    let width = 0;
    for (let i = 0; i < text.length; i++) {
        let ch = text[i];
        if (ch !== ' ' && ch !== '\n') {
            width++;
            list.push(ch);
        } else if (ch === '\n') {
            width = 0;
        }
    }
    mapWidth = width;
    globalList = list;
}

function drawMap() {
    if (!globalList) return;
    let tileNumber = 0;
    let x = 0, y = 0;
    for (let tile of globalList) {
        let drawX = x * 128 - offsetX;
        let drawY = y * 128 - offsetY;
        if (drawX < 1500 && drawY < 1500) {
            let imgKey = null;
            if (tile === '0') imgKey = 'Grass';
            if (tile === '1' || tile === '7') imgKey = 'Tree';
            if (tile === '2') imgKey = 'Rock';
            if (tile === '3') imgKey = 'Water1';
            if (tile === '4') imgKey = 'Water2';
            if (tile === '5') imgKey = 'Sand';
            if (tile === '6') imgKey = 'AppleTree';
            if (tile === '8') imgKey = 'Wood_wall';
            if (tile === 's') imgKey = 'Sapling';
            if (imgKey) ctx.drawImage(loadedImages[imgKey], drawX, drawY);
        }
        tileNumber++;
        if (x === mapWidth - 1) {
            y++;
            x = 0;
        } else {
            x++;
        }
    }
}

function scroll(keys) {
    lastOffsetX = offsetX;
    lastOffsetY = offsetY;
    if (keys['KeyS'] || keys['KeyW'] || keys['KeyD'] || keys['KeyA']) {
        offsetX += Math.sin(globalDir / 57.2957795131) * speed / fps * 60;
        offsetY += Math.cos(globalDir / 57.2957795131) * speed / fps * 60;
    }
}

function collision(x, y) {
    let idx = x + y * mapWidth;
    let tile = globalList[idx];
    if (['1', '7', '6', '2', '8'].includes(tile)) {
        offsetX = lastOffsetX;
        offsetY = lastOffsetY;
    }
    if (tile === '3') speed = 2;
    else if (tile === '4') speed = 3;
    else if (['0', '5'].includes(tile)) speed = 5;
}

function edit(mouseX, mouseY, x, y, inventory, player) {
    // Harvesting
    if (['fist', 'apple', 'plank', 'sapling', 'wood'].includes(inventory.holding) && mouse.left && globalList[mouseX + mouseY * mapWidth] === '6' && Math.abs(x - mouseX) < 2 && Math.abs(y - mouseY) < 2) {
        globalList[mouseX + mouseY * mapWidth] = '7';
        inventory.apple += 3;
        clickHeld = true;
    }
    if (inventory.holding === 'axe' && mouse.left && ['6', '7', '8', 's'].includes(globalList[mouseX + mouseY * mapWidth]) && Math.abs(x - mouseX) < 2 && Math.abs(y - mouseY) < 2) {
        let tile = globalList[mouseX + mouseY * mapWidth];
        if (tile === '6') {
            inventory.apple += Math.floor(Math.random() * 2);
            inventory.wood += 2 + Math.floor(Math.random() * 2);
            inventory.sapling += Math.floor(Math.random() * 3);
            if (Math.floor(Math.random() * 5) === 0) inventory.sapling += 1;
        }
        if (tile === '7') {
            inventory.wood += 2 + Math.floor(Math.random() * 2);
            inventory.sapling += Math.floor(Math.random() * 3);
            if (Math.floor(Math.random() * 3) === 0) inventory.sapling += 1;
        }
        if (tile === '8') inventory.wood += 1;
        if (tile === 's') inventory.sapling += 1;
        globalList[mouseX + mouseY * mapWidth] = '0';
    }
    // Placing
    let placingOnStanding = (Math.abs(x - mouseX) === 0 && Math.abs(y - mouseY) === 0);
    if (inventory.holding === 'plank' && inventory.plank > 0 && mouse.left && ['0', '5', '4', '3'].includes(globalList[mouseX + mouseY * mapWidth]) && Math.abs(x - mouseX) < 2 && Math.abs(y - mouseY) < 2 && !placingOnStanding) {
        globalList[mouseX + mouseY * mapWidth] = '8';
        inventory.plank -= 1;
    }
    if (inventory.holding === 'sapling' && inventory.sapling > 0 && mouse.left && globalList[mouseX + mouseY * mapWidth] === '0' && Math.abs(x - mouseX) < 2 && Math.abs(y - mouseY) < 2) {
        globalList[mouseX + mouseY * mapWidth] = 's';
        inventory.sapling -= 1;
    }
    // Regrowing
    for (let i = 0; i < globalList.length; i++) {
        if (globalList[i] === '7' && Math.floor(Math.random() * 3000) === 0) globalList[i] = '6';
        if (globalList[i] === 's' && Math.floor(Math.random() * 3000) === 0) globalList[i] = '7';
    }
    // Consuming
    if (inventory.holding === 'apple' && mouse.left && !clickHeld) {
        player.health += 50;
        inventory.apple -= 1;
        clickHeld = true;
    }
}

// --- Mouse Handling ---
const mouse = { left: false, x: 0, y: 0 };
canvas.addEventListener('mousedown', e => { if (e.button === 0) mouse.left = true; });
canvas.addEventListener('mouseup', e => { if (e.button === 0) mouse.left = false; });
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// --- Title Screen Implementation ---

// Title screen variables
let titleActive = true;
let spinAngle = 0;
let spinSpeed = 0.1;
let breathPhase = 0;
let breathSpeed = 0.025;

// Colors
const COLORS = {
    WHITE: '#fff',
    BLACK: '#000',
    GRAY: 'rgb(120,120,120)',
    LIGHT_GRAY: 'rgb(180,180,200)',
    BUTTON: 'rgb(140,150,220)',
    BUTTON_HOVER: 'rgb(170,180,255)',
    YELLOW: 'rgb(255,255,60)'
};

// Button rectangles
const playRect = { x: 490, y: 320, w: 300, h: 60 };
const mapEditorRect = { x: 490, y: 400, w: 300, h: 60 };

function drawButton(rect, text, hovered) {
    ctx.save();
    ctx.fillStyle = hovered ? COLORS.BUTTON_HOVER : COLORS.BUTTON;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8, true, false);
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.WHITE;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8, false, true);
    ctx.font = '48px sans-serif';
    ctx.fillStyle = COLORS.WHITE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, rect.x + rect.w/2, rect.y + rect.h/2);
    ctx.restore();
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function drawTitleScreen() {
    // Animate
    spinAngle = (spinAngle + spinSpeed) % 360;
    breathPhase = (breathPhase + breathSpeed) % (2 * Math.PI);
    let breath = (Math.sin(breathPhase) + 1) / 2;
    let base = [180, 180, 200];
    let blue = [160, 160, 250];
    let lineColor = `rgb(${Math.round(base[0]*(1-breath)+blue[0]*breath)},${Math.round(base[1]*(1-breath)+blue[1]*breath)},${Math.round(base[2]*(1-breath)+blue[2]*breath)})`;

    // Background
    ctx.fillStyle = COLORS.GRAY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Spinning lines
    for (let angle = 0; angle < 360; angle += 20) {
        let a = angle + spinAngle;
        let x = 640 + 2000 * Math.cos(a * Math.PI / 180);
        let y = 360 + 2000 * Math.sin(a * Math.PI / 180);
        ctx.strokeStyle = lineColor;
        ctx.beginPath();
        ctx.moveTo(640, 360);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    // Title
    ctx.font = '120px sans-serif';
    ctx.fillStyle = COLORS.WHITE;
    ctx.textAlign = 'center';
    ctx.fillText('UH sim', 640, 120);
    // Subtitle (rotated)
    ctx.save();
    ctx.translate(740, 160);
    ctx.rotate(15 * Math.PI / 180);
    ctx.font = '40px sans-serif';
    ctx.fillStyle = COLORS.YELLOW;
    ctx.fillText('Gotta love AI!', 0, 0);
    ctx.restore();
    // Play button
    let playHover = pointInRect(mouse.x, mouse.y, playRect);
    drawButton(playRect, 'Play', playHover);
    // Map Editor button
    let mapHover = pointInRect(mouse.x, mouse.y, mapEditorRect);
    drawButton(mapEditorRect, 'Map editor', mapHover);
    // Character preview
    ctx.font = '48px sans-serif';
    ctx.fillStyle = COLORS.WHITE;
    ctx.textAlign = 'center';
    ctx.fillText('Daaniel', 1050, 200);
    // Stickman
    let stick = { x: 1050, y: 320 };
    ctx.strokeStyle = COLORS.WHITE;
    ctx.lineWidth = 3;
    // Head
    ctx.beginPath();
    ctx.arc(stick.x, stick.y - 60, 25, 0, 2 * Math.PI);
    ctx.stroke();
    // Body
    ctx.beginPath();
    ctx.moveTo(stick.x, stick.y - 35);
    ctx.lineTo(stick.x, stick.y + 60);
    ctx.stroke();
    // Arms
    ctx.beginPath();
    ctx.moveTo(stick.x - 40, stick.y);
    ctx.lineTo(stick.x + 40, stick.y);
    ctx.stroke();
    // Left leg
    ctx.beginPath();
    ctx.moveTo(stick.x, stick.y + 60);
    ctx.lineTo(stick.x - 30, stick.y + 120);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(stick.x, stick.y + 60);
    ctx.lineTo(stick.x + 30, stick.y + 120);
    ctx.stroke();
    // Version and credit
    ctx.font = '32px sans-serif';
    ctx.fillStyle = COLORS.WHITE;
    ctx.textAlign = 'left';
    ctx.fillText('UnstableAI 0.1.2 Beta', 10, 700);
    // Credit button
    let creditRect = { x: 1010, y: 670, w: 260, h: 36 };
    let creditHover = pointInRect(mouse.x, mouse.y, creditRect);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = creditHover && mouse.left ? 'rgb(180,60,60)' : COLORS.BLACK;
    ctx.fillRect(creditRect.x, creditRect.y, creditRect.w, creditRect.h);
    ctx.globalAlpha = 1.0;
    ctx.font = '32px sans-serif';
    ctx.fillStyle = creditHover ? COLORS.YELLOW : COLORS.WHITE;
    ctx.fillText('made with <3 by ai', creditRect.x + 10, creditRect.y + 26);
}

function pointInRect(mx, my, rect) {
    return mx >= rect.x && mx < rect.x + rect.w && my >= rect.y && my < rect.y + rect.h;
}

// --- Mouse Handling for Title Screen ---
canvas.addEventListener('mousedown', e => {
    if (!titleActive) return;
    if (e.button === 0) {
        // Play
        if (pointInRect(mouse.x, mouse.y, playRect)) {
            titleActive = false;
            loadGame(); // Only start game after Play is clicked
        }
        // Map Editor (not implemented)
        if (pointInRect(mouse.x, mouse.y, mapEditorRect)) {
            alert('Map editor not implemented in web version.');
        }
        // Credit (delete usermap.txt)
        let creditRect = { x: 1010, y: 670, w: 260, h: 36 };
        if (pointInRect(mouse.x, mouse.y, creditRect)) {
            flashCredit();
        }
    }
});

function flashCredit() {
    let flashes = 8;
    let i = 0;
    function flash() {
        if (i >= flashes) return;
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = i % 2 === 0 ? 'red' : 'rgb(180,60,60)';
        ctx.fillRect(1010, 670, 260, 36);
        ctx.globalAlpha = 1.0;
        ctx.font = '32px sans-serif';
        ctx.fillStyle = COLORS.YELLOW;
        ctx.fillText('made with <3 by ai', 1020, 696);
        i++;
        setTimeout(flash, 40);
    }
    flash();
}

// --- Main Render Loop ---
function render() {
    if (titleActive) {
        drawTitleScreen();
        requestAnimationFrame(render);
    }
}

// Start with title screen
render();

// --- Main Game Loop ---
let player, inventory;
let mapLoaded = false;

// Load map from a string (replace with AJAX/file load as needed)
function loadGame() {
    player = new Player(300);
    inventory = new Inventory(0, 0, 1, 0, 0);
    fetch('map.txt')
        .then(res => res.text())
        .then(text => {
            loadMap(text);
            mapLoaded = true;
            requestAnimationFrame(gameLoop);
        });
}

function gameLoop() {
    if (titleActive || !mapLoaded) return; // Only run if not on title screen and map is loaded
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMap();
    player.update(keys);
    player.draw(ctx);
    scroll(keys);
    let x = Math.floor((offsetX + 640) / 128);
    let y = Math.floor((offsetY + 360) / 128);
    let mouseX = Math.floor((offsetX + mouse.x) / 128);
    let mouseY = Math.floor((offsetY + mouse.y) / 128);
    edit(mouseX, mouseY, x, y, inventory, player);
    collision(x, y);
    inventory.update(keys);
    inventory.draw(ctx);
    // FPS display
    if (keys['KeyF']) {
        ctx.font = '50px sans-serif';
        ctx.fillStyle = 'black';
        ctx.fillText('FPS: ' + Math.round(fps), 20, 700);
    }
    requestAnimationFrame(gameLoop);
}

// --- Input Handling ---
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

// --- Placeholders for map, collision, edit, etc. ---
// TODO: Port Generate, collision, edit, scroll, etc. from Python

console.log('Game scaffold loaded.');
