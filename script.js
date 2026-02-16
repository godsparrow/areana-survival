const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;
const TILE_SIZE = 64;

let camera = { x: 0, y: 0 };
let paused = false;
let keys = {};
let enemies = [];
let projectiles = [];
let drops = [];

let player = {
    x: 2500,
    y: 2500,
    size: 64,
    speed: 4,
    hp: 100,
    maxHp: 100,
    damage: 15,
    spell: "arcane",
    frame: 0,
    tick: 0,
    inventory: [],
    equipment: {
        helmet: null,
        chest: null,
        staff: null,
        ring: null
    }
};

document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.key === "p") paused = !paused;
});
document.addEventListener("keyup", e => keys[e.key] = false);

// ================= WORLD =================

function drawWorld() {
    for (let x = 0; x < WORLD_WIDTH; x += TILE_SIZE) {
        for (let y = 0; y < WORLD_HEIGHT; y += TILE_SIZE) {

            let sx = x - camera.x;
            let sy = y - camera.y;

            if (sx > -TILE_SIZE && sx < canvas.width &&
                sy > -TILE_SIZE && sy < canvas.height) {

                ctx.fillStyle = "#3c9c3c";
                ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

                ctx.fillStyle = "#2f7f2f";
                ctx.fillRect(sx, sy + 48, TILE_SIZE, 16);

                ctx.fillStyle = "#4fbf4f";
                ctx.fillRect(sx, sy, TILE_SIZE, 10);
            }
        }
    }
}

// ================= PLAYER =================

function updatePlayer() {
    let moving = false;

    if (keys["w"]) { player.y -= player.speed; moving = true; }
    if (keys["s"]) { player.y += player.speed; moving = true; }
    if (keys["a"]) { player.x -= player.speed; moving = true; }
    if (keys["d"]) { player.x += player.speed; moving = true; }

    if (moving) {
        player.tick++;
        if (player.tick > 8) {
            player.frame = (player.frame + 1) % 4;
            player.tick = 0;
        }
    }

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

function drawPlayer() {

    let px = player.x - camera.x - 32;
    let py = player.y - camera.y - 32;

    ctx.fillStyle = "#4fa3ff";
    ctx.fillRect(px, py, 64, 64);

    ctx.fillStyle = "#2e6fa8";
    ctx.fillRect(px, py + 42, 64, 22);

    ctx.fillStyle = "#6ec6ff";
    ctx.fillRect(px + 8, py + 8, 48, 16);

    if (player.equipment.helmet) {
        ctx.fillStyle = player.equipment.helmet.color;
        ctx.fillRect(px + 12, py + 6, 40, 18);
    }

    if (player.equipment.chest) {
        ctx.fillStyle = player.equipment.chest.color;
        ctx.fillRect(px + 10, py + 28, 44, 26);
    }

    if (player.equipment.staff) {
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(px + 52, py + 20, 10, 28);
    }

    if (player.equipment.ring) {
        ctx.strokeStyle = player.equipment.ring.color;
        ctx.beginPath();
        ctx.arc(px + 32, py + 32, 38, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ================= ENEMIES =================

function spawnEnemy() {
    let elite = Math.random() < 0.15;

    enemies.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        size: 64,
        hp: elite ? 220 : 120,
        speed: elite ? 2.5 : 1.6,
        elite: elite
    });
}

function updateEnemies() {
    enemies.forEach(enemy => {
        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        enemy.x += dx/dist * enemy.speed;
        enemy.y += dy/dist * enemy.speed;
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {

        let ex = enemy.x - camera.x - 32;
        let ey = enemy.y - camera.y - 32;

        ctx.fillStyle = enemy.elite ? "#ff4444" : "#6a1b9a";
        ctx.fillRect(ex, ey, 64, 64);

        ctx.fillStyle = enemy.elite ? "#ff7777" : "#9c4dcc";
        ctx.fillRect(ex + 8, ey + 8, 48, 16);

        if (enemy.elite) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 3;
            ctx.strokeRect(ex - 3, ey - 3, 70, 70);
        }
    });
}

// ================= SPELLS =================

function castSpell() {
    projectiles.push({
        x: player.x,
        y: player.y,
        type: player.spell,
        life: 80
    });
}

function updateProjectiles() {
    projectiles.forEach((p,i) => {
        p.life--;
        if (p.life <= 0) projectiles.splice(i,1);
    });
}

function drawProjectiles() {
    projectiles.forEach(p => {
        let px = p.x - camera.x;
        let py = p.y - camera.y;

        if (p.type === "arcane") ctx.fillStyle = "cyan";
        if (p.type === "fire") ctx.fillStyle = "orange";
        if (p.type === "lightning") ctx.fillStyle = "yellow";

        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI*2);
        ctx.fill();
    });
}

// ================= DROPS =================

function dropLoot(x,y) {
    if (Math.random() < 0.5) {

        let types = ["helmet","chest","ring"];
        let type = types[Math.floor(Math.random()*types.length)];

        drops.push({
            x:x,
            y:y,
            type:type,
            color:["#aaa","#00ffcc","#ff00ff"][Math.floor(Math.random()*3)]
        });
    }
}

function drawDrops() {
    drops.forEach(drop => {
        ctx.fillStyle = drop.color;
        ctx.fillRect(drop.x - camera.x - 12, drop.y - camera.y - 12, 24, 24);
    });
}

// ================= INVENTORY PANEL =================

function drawInventory() {

    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(200,100,600,400);

    let centerX = 500;
    let centerY = 300;

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    ctx.strokeRect(centerX - 40, centerY - 150, 80, 80);   // helmet
    ctx.strokeRect(centerX - 40, centerY - 50, 80, 100);   // chest
    ctx.strokeRect(centerX + 120, centerY - 20, 60, 60);   // staff
    ctx.strokeRect(centerX - 120, centerY - 20, 60, 60);   // ring

    if (player.equipment.helmet) {
        ctx.fillStyle = player.equipment.helmet.color;
        ctx.fillRect(centerX - 30, centerY - 140, 60, 60);
    }

    if (player.equipment.chest) {
        ctx.fillStyle = player.equipment.chest.color;
        ctx.fillRect(centerX - 30, centerY - 40, 60, 80);
    }

    if (player.equipment.staff) {
        ctx.fillStyle = "#8b5a2b";
        ctx.fillRect(centerX + 130, centerY - 10, 40, 40);
    }

    if (player.equipment.ring) {
        ctx.fillStyle = player.equipment.ring.color;
        ctx.beginPath();
        ctx.arc(centerX - 90, centerY + 10, 20, 0, Math.PI*2);
        ctx.fill();
    }
}

// ================= LOOP =================

function update() {
    if (paused) return;

    updatePlayer();
    updateEnemies();
    updateProjectiles();
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawWorld();
    drawEnemies();
    drawDrops();
    drawProjectiles();
    drawPlayer();

    if (paused) drawInventory();
}

for (let i=0;i<12;i++) spawnEnemy();

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
