// ======================================
// TOP DOWN RPG - HUMANOID + AUTO AIM
// ======================================

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 600;

const WORLD_WIDTH = 5000;
const WORLD_HEIGHT = 5000;
const TILE = 64;

let camera = { x: 0, y: 0 };
let keys = {};
let paused = false;

let enemies = [];
let projectiles = [];
let drops = [];

// ================= PLAYER =================

let player = {
    x: 2500,
    y: 2500,
    size: 64,
    speed: 4,
    hp: 100,
    damage: 20,
    lastShot: 0,
    shootCooldown: 500,
    frame: 0,
    tick: 0
};

// ================= INPUT =================

document.addEventListener("keydown", e => {
    keys[e.key] = true;
    if (e.key === "p") paused = !paused;
});
document.addEventListener("keyup", e => keys[e.key] = false);

// ================= WORLD =================

function drawWorld() {
    for (let x = 0; x < WORLD_WIDTH; x += TILE) {
        for (let y = 0; y < WORLD_HEIGHT; y += TILE) {

            let sx = x - camera.x;
            let sy = y - camera.y;

            if (sx > -TILE && sx < canvas.width &&
                sy > -TILE && sy < canvas.height) {

                ctx.fillStyle = "#3c9c3c";
                ctx.fillRect(sx, sy, TILE, TILE);

                ctx.fillStyle = "#2f7f2f";
                ctx.fillRect(sx, sy + 48, TILE, 16);

                ctx.fillStyle = "#4fbf4f";
                ctx.fillRect(sx, sy, TILE, 10);
            }
        }
    }
}

// ================= PLAYER UPDATE =================

function updatePlayer() {

    let moving = false;

    if (keys["w"]) { player.y -= player.speed; moving = true; }
    if (keys["s"]) { player.y += player.speed; moving = true; }
    if (keys["a"]) { player.x -= player.speed; moving = true; }
    if (keys["d"]) { player.x += player.speed; moving = true; }

    if (moving) {
        player.tick++;
        if (player.tick > 8) {
            player.frame = (player.frame + 1) % 2;
            player.tick = 0;
        }
    }

    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
}

// ================= HUMANOID DRAW =================

function drawPlayer() {

    let px = player.x - camera.x;
    let py = player.y - camera.y;

    // legs (animated)
    ctx.fillStyle = "#2e6fa8";
    ctx.fillRect(px - 14, py + 10 + (player.frame === 0 ? 0 : 4), 10, 20);
    ctx.fillRect(px + 4, py + 10 + (player.frame === 0 ? 4 : 0), 10, 20);

    // body
    ctx.fillStyle = "#4fa3ff";
    ctx.fillRect(px - 18, py - 10, 36, 30);

    // shading
    ctx.fillStyle = "#2e6fa8";
    ctx.fillRect(px - 18, py + 5, 36, 15);

    // head
    ctx.fillStyle = "#ffd7a8";
    ctx.fillRect(px - 12, py - 30, 24, 20);

    ctx.fillStyle = "#e6b98f";
    ctx.fillRect(px - 12, py - 20, 24, 10);

    // staff
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(px + 20, py - 10, 6, 40);

    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(px + 23, py - 15, 6, 0, Math.PI * 2);
    ctx.fill();
}

// ================= ENEMIES =================

function spawnEnemy() {
    let elite = Math.random() < 0.15;

    enemies.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        hp: elite ? 200 : 100,
        speed: elite ? 2.5 : 1.5,
        elite: elite
    });
}

function updateEnemies() {
    enemies.forEach((enemy, ei) => {

        let dx = player.x - enemy.x;
        let dy = player.y - enemy.y;
        let dist = Math.sqrt(dx*dx + dy*dy);

        enemy.x += dx/dist * enemy.speed;
        enemy.y += dy/dist * enemy.speed;

        projectiles.forEach((p, pi) => {
            let pdx = p.x - enemy.x;
            let pdy = p.y - enemy.y;

            if (Math.sqrt(pdx*pdx + pdy*pdy) < 20) {
                enemy.hp -= player.damage;
                projectiles.splice(pi,1);

                if (enemy.hp <= 0) {
                    enemies.splice(ei,1);
                }
            }
        });
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {

        let ex = enemy.x - camera.x;
        let ey = enemy.y - camera.y;

        ctx.fillStyle = enemy.elite ? "#ff4444" : "#6a1b9a";
        ctx.beginPath();
        ctx.arc(ex, ey, 20, 0, Math.PI*2);
        ctx.fill();

        if (enemy.elite) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(ex, ey, 26, 0, Math.PI*2);
            ctx.stroke();
        }
    });
}

// ================= AUTO AIM =================

function autoShoot() {

    if (enemies.length === 0) return;

    let now = Date.now();
    if (now - player.lastShot < player.shootCooldown) return;

    let closest = enemies[0];
    let minDist = Infinity;

    enemies.forEach(enemy => {
        let dx = enemy.x - player.x;
        let dy = enemy.y - player.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist) {
            minDist = dist;
            closest = enemy;
        }
    });

    let angle = Math.atan2(closest.y - player.y, closest.x - player.x);

    projectiles.push({
        x: player.x,
        y: player.y,
        dx: Math.cos(angle) * 6,
        dy: Math.sin(angle) * 6,
        life: 120
    });

    player.lastShot = now;
}

function updateProjectiles() {
    projectiles.forEach((p,i) => {
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) projectiles.splice(i,1);
    });
}

function drawProjectiles() {
    projectiles.forEach(p => {
        let px = p.x - camera.x;
        let py = p.y - camera.y;

        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI*2);
        ctx.fill();
    });
}

// ================= LOOP =================

function update() {
    if (paused) return;

    updatePlayer();
    updateEnemies();
    autoShoot();
    updateProjectiles();
}

function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    drawWorld();
    drawEnemies();
    drawProjectiles();
    drawPlayer();
}

for (let i=0;i<15;i++) spawnEnemy();

function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
