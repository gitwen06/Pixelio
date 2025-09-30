const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let keys = {};
let bullets = [];
let enemies = [];
let wave = 1;
let score = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 4,
    color: "cyan"
};

// Listen for movement
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// Shoot bullets with spacebar
document.addEventListener("keydown", e => {
    if (e.key === " ") {
        bullets.push({
            x: player.x,
            y: player.y,
            size: 10,
            speed: 6,
            dx: Math.cos(angleToMouse),
            dy: Math.sin(angleToMouse)
        });
    
    }
});

// Track mouse for shooting direction
let mouseX = player.x;
let mouseY = player.y;
let angleToMouse = 0;

canvas.addEventListener("mousemove", e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    angleToMouse = Math.atan2(mouseY - player.y, mouseX - player.x);
});

function movePlayer() {
    if (keys["w"]) player.y -= player.speed;
    if (keys["s"]) player.y += player.speed;
    if (keys["a"]) player.x -= player.speed;
    if (keys["d"]) player.x += player.speed;

    // Keep inside canvas
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
}

function updateBullets() {
    bullets.forEach((b, i) => {
        b.x += b.dx * b.speed;
        b.y += b.dy * b.speed;

        // Remove offscreen bullets
        if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height) {
            bullets.splice(i, 1);
        }

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function spawnEnemies() {
    if (enemies.length === 0) {
        for (let i = 0; i < wave * 5; i++) {
            enemies.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: 15,
                speed: 1 + Math.random() * 0.5,
                color: "red"
            });
        }
        wave++;
        document.getElementById("wave").innerText = "Wave: " + (wave - 1);
    }
}

function updateEnemies() {
    enemies.forEach((e, ei) => {
        // Move toward player
        const angle = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(angle) * e.speed;
        e.y += Math.sin(angle) * e.speed;
        if (angle == e.x && angle == e.y){
            e.x += Math.cos(angle) * e.speed;
            e.y += Math.sin(angle) * e.speed;
        }

        

        // Check collision with bullets
        bullets.forEach((b, bi) => {
            const dist = Math.hypot(e.x - b.x, e.y - b.y);
            console.log(e.x);
            console.log(b.y);
            if (dist < e.size + b.size) {
                enemies.splice(ei, 1);
                bullets.splice(bi, 1);
                score += 10;
                document.getElementById("score").innerText = "Score: " + score;
            }
        });
        
        // Draw enemy
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawScore() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillText("Wave: " + (wave - 1), 20, 60);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayer();
    drawPlayer();
    updateBullets();
    updateEnemies();
    spawnEnemies();
    drawScore();

    requestAnimationFrame(gameLoop);
}

function startGame() {
    bullets = [];
    enemies = [];
    wave = 1;
    score = 0;
    gameLoop();
}

