// --- Globals ---
let keys = {};
let bullets = [];
let bombProjectiles = [];
let enemies = [];
let enemyBullets = [];

// --- Player Health ---
let playerHealth = 3;
const maxHealth = 3;
let healthPickups = [];

let wave = 1;
let score = 0;

let gameOver = false;
let spawning = false;

let isRunning = false;
let restartBtn = null;
let spawnTimeout = null;
let shieldTimeout = null;
let burstReady = true;
let bombReady = true;
let bombEffect = null;
let playerFlash = 0;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- Load Images ---
const playerImg = new Image();
playerImg.src = "images/Mainbody.png";

const bulletImg = new Image();
bulletImg.src = "images/Bullet.png";

const bigHealthImg = new Image();
bigHealthImg.src = "images/Bighealth.png";

const miniHealthImg = new Image();
miniHealthImg.src = "images/MiniHealth.png";

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  speed: 4,
  color: "cyan"
};

let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// --- Start / Restart ---
function startGame() {
  if (spawnTimeout) { clearTimeout(spawnTimeout); spawnTimeout = null; }
  if (shieldTimeout) { clearTimeout(shieldTimeout); shieldTimeout = null; }

  bullets = [];
  bombProjectiles = [];
  enemies = [];
  enemyBullets = [];
  wave = 1;
  score = 0;
  gameOver = false;
  spawning = false;
  keys = {};

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  if (restartBtn) {
    restartBtn.remove();
    restartBtn = null;
  }

  if (!isRunning) {
    requestAnimationFrame(gameLoop);
  }
}

// --- Restart button helper ---
function showRestartButton() {
  if (restartBtn) return;

  const container = document.querySelector('.game-container') || document.body;
  restartBtn = document.createElement('button');
  restartBtn.id = 'restartBtn';
  restartBtn.textContent = 'Restart';
  restartBtn.className = 'start-btn restart-btn';
  restartBtn.style.position = 'absolute';
  restartBtn.style.top = '65%';
  restartBtn.style.left = '50%';
  restartBtn.style.transform = 'translate(-50%, -50%)';
  restartBtn.style.zIndex = 1000;
  container.appendChild(restartBtn);

  restartBtn.onclick = () => {
    if (restartBtn) { restartBtn.remove(); restartBtn = null; }
    startGame();
  };
}

// --- Spawning ---
function spawnEnemies() {
  if (enemies.length === 0 && !spawning) {
    spawning = true;
    spawnTimeout = setTimeout(() => {
      for (let i = 0; i < wave * 3.5; i++) {
        enemies.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 15,
          speed: 1 + Math.random() * 0.5,
          color: "red",
          shielded: true,
          canShoot: false,
          lastShot: Date.now(),
          shootCooldown: 999999
        });
      }

      if (wave >= 5) {
        for (let j = 0; j < wave * 1.1; j++) {
          enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 15,
            speed: 1 + Math.random() * 0.5,
            color: "orange",
            shielded: true,
            canShoot: true,
            lastShot: Date.now(),
            shootCooldown: 2000 + Math.random() * 1000
          });
        }
      }
      if(wave == 10) {
        for (let k = 0; k < 5; k++) {
          enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 25,
            speed: 0.8,
            color: "gray",
            shielded: true,
            canShoot: true,
            lastShot: Date.now(),
            shootCooldown: 1500
          });
        }
      }

      if (shieldTimeout) clearTimeout(shieldTimeout);
      shieldTimeout = setTimeout(() => {
        enemies.forEach(e => e.shielded = false);
        shieldTimeout = null;
      }, 3000);

      wave++;
      spawning = false;
      spawnTimeout = null;
    }, 3000);
  }
}

// --- Main loop ---
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);

    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 40);

    showRestartButton();
    isRunning = false;
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  movePlayer();
  drawPlayer();
  updateBullets();
  updateBombProjectiles();
  updateEnemies();
  updateEnemyBullets();
  spawnEnemies();
  drawScore();
  updateHealthPickups();
  drawHealth();

  if (bombEffect) {
    ctx.beginPath();
    ctx.arc(bombEffect.x, bombEffect.y, bombEffect.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 50, 50, 0.4)";
    ctx.fill();
    bombEffect.duration--;
    if (bombEffect.duration <= 0) bombEffect = null;
  }

  isRunning = true;
  requestAnimationFrame(gameLoop);
}

// --- Helpers ---
function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));

  if (playerFlash > 0) playerFlash--;
}

function drawPlayer() {
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x) + Math.PI / 2;
  const playerSize = player.size * 6;
  const bodyCenterOffsetY = 20;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(angle);
  if (playerFlash > 0) ctx.globalAlpha = 0.5; // flash
  ctx.drawImage(
    playerImg,
    -playerSize / 2,
    -playerSize / 2 - bodyCenterOffsetY,
    playerSize,
    playerSize
  );
  ctx.globalAlpha = 1;
  ctx.restore();
}


function drawPlayer() {
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x) + Math.PI / 2;

  const playerSize = player.size * 6;


  const bodyCenterOffsetY = 20;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(angle);
  ctx.drawImage(
    playerImg,
    -playerSize / 2,
    -playerSize / 2 - bodyCenterOffsetY,
    playerSize,
    playerSize
  );
  ctx.restore();
}




function updateBullets() {
  const bulletSize = 15;
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx * b.speed;
    b.y += b.dy * b.speed;

    if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }

    const angle = Math.atan2(b.dy, b.dx);

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.drawImage(bulletImg, -bulletSize / 2, -bulletSize / 2, bulletSize, bulletSize);
    ctx.restore();
  }
}

function updateEnemies() {
  const now = Date.now();

  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];

    // Move enemy if not shielded
    if (!e.shielded) {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed;
      e.y += Math.sin(angle) * e.speed;
    }

    const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
    if (distToPlayer < player.size + e.size && !e.shielded) {
      playerHealth -= 1;
      playerFlash = 10;

      const bounceAngle = Math.atan2(e.y - player.y, e.x - player.x);
      e.vx = Math.cos(bounceAngle) * 12.5; // horizontal velocity
      e.vy = Math.sin(bounceAngle) * 12.5; // vertical velocity
      e.bounceFrames = 8; // lasts 5 frames

      if (playerHealth <= 0) gameOver = true;
    }

    // Apply bounce movement
    if (e.bounceFrames && e.bounceFrames > 0) {
      e.x += e.vx;
      e.y += e.vy;
      e.bounceFrames--;
    } else {
      e.vx = 0;
      e.vy = 0;
    }

    // Enemy shooting
    if (e.canShoot && now - e.lastShot >= e.shootCooldown && !e.shielded) {
      const angleToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
      enemyBullets.push({
        x: e.x,
        y: e.y,
        size: 5,
        speed: 3,
        dx: Math.cos(angleToPlayer),
        dy: Math.sin(angleToPlayer),
        color: "orange"
      });
      e.lastShot = now;
    }

    // Enemy hit by player bullets (needs 2 hits)
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      const dist = Math.hypot(e.x - b.x, e.y - b.y);
      if (dist < e.size + b.size && !e.shielded) {
        e.hits = (e.hits || 0) + 1;
        bullets.splice(bi, 1);
        if (e.hits >= 2) {
          // drop health
          const dropChance = Math.random();
          if (dropChance < 0.07) {
            healthPickups.push({ x: e.x, y: e.y, type: "big" });
          } else if (dropChance < 0.19) { 
            healthPickups.push({ x: e.x, y: e.y, type: "mini" });
          }
          enemies.splice(ei, 1);
          score += 10;
        }
        break;
      }
    }

    // Draw enemy
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = e.shielded ? "white" : "#222";
    ctx.stroke();
  }
}

function updateHealthPickups() {
  for (let i = healthPickups.length - 1; i >= 0; i--) {
    const h = healthPickups[i];
    const img = h.type === "big" ? bigHealthImg : miniHealthImg;
    const size = h.type === "big" ? 30 : 15;
    ctx.drawImage(img, h.x - size / 2, h.y - size / 2, size, size);

    // Collision with player
    if (Math.hypot(player.x - h.x, player.y - h.y) < player.size + size / 2) {
      playerHealth = Math.min(maxHealth, playerHealth + (h.type === "big" ? maxHealth : 1));
      healthPickups.splice(i, 1);
    }
  }
}

function drawHealth() {
  ctx.fillStyle = "red";
  for (let i = 0; i < maxHealth; i++) {
    ctx.globalAlpha = i < playerHealth ? 1 : 0.3;
    ctx.fillRect(20 + i * 35, 80, 30, 30);
  }
  ctx.globalAlpha = 1;
}

function updateEnemyBullets() {
  const enemyBulletSize = 12;
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.dx * b.speed;
    b.y += b.dy * b.speed;

    const angle = Math.atan2(b.dy, b.dx);

    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(angle);
    ctx.drawImage(bulletImg, -enemyBulletSize / 2, -enemyBulletSize / 2, enemyBulletSize, enemyBulletSize);
    ctx.restore();

    const dist = Math.hypot(player.x - b.x, player.y - b.y);
    if (dist < player.size + b.size) {
      playerHealth -= 0.5; // bullets require 2 hits
      enemyBullets.splice(i, 1);
      if (playerHealth <= 0) gameOver = true;
      continue;
    }

    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height)
      enemyBullets.splice(i, 1);
  }
}

function updateBombProjectiles() {
  for (let i = bombProjectiles.length - 1; i >= 0; i--) {
    const b = bombProjectiles[i];
    b.x += b.dx * b.speed;
    b.y += b.dy * b.speed;
    ctx.drawImage(bulletImg, b.x - 5, b.y - 5, 10, 10);
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bombProjectiles.splice(i, 1);
      continue;
    }
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < b.size + e.size && !e.shielded) {
        triggerBombExplosion(b.x, b.y);
        bombProjectiles.splice(i, 1);
        break;
      }
    }
  }
}

function triggerBombExplosion(x, y) {
  const radius = 300;
  bombEffect = { x, y, radius, duration: 30 };
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dist = Math.hypot(x - e.x, y - e.y);
    if (dist < radius + e.size && !e.shielded) {
      enemies.splice(i, 1);
      score += 20;
    }
  }
}
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Wave: " + (wave - 1), 20, 60);
  if (spawning) {
    ctx.textAlign = "center";
    ctx.fillStyle = "yellow";
    ctx.font = "24px Arial";
    ctx.fillText("Next wave starting...", canvas.width / 2, canvas.height / 2 - 80);
  }
}

// --- Skills ---
function useBurstShot() {
  if (!burstReady) return;
  burstReady = false;
  const numBullets = 24;
  const angleStep = (Math.PI * 2) / numBullets;
  for (let i = 0; i < numBullets; i++) {
    const angle = i * angleStep;
    bullets.push({
      x: player.x,
      y: player.y,
      size: 5,
      speed: 6,
      dx: Math.cos(angle),
      dy: Math.sin(angle)
    });
  }
  setTimeout(() => burstReady = true, 3000);
}

function useUltimateBomb() {
  if (!bombReady) return;
  bombReady = false;
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
  bombProjectiles.push({
    x: player.x,
    y: player.y,
    size: 8,
    speed: 4,
    dx: Math.cos(angle),
    dy: Math.sin(angle),
    active: true
  });
  setTimeout(() => bombReady = true, 10000);
}

// --- Input ---
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key.toLowerCase() === "q" && !gameOver) useBurstShot();
  if (e.key.toLowerCase() === "e" && !gameOver) useUltimateBomb();
  if (e.code === "Space" && !gameOver) {
    const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
    bullets.push({
      x: player.x,
      y: player.y,
      size: 5,
      speed: 6,
      dx: Math.cos(angle),
      dy: Math.sin(angle)
    });
  }
});
document.addEventListener('keyup', e => { keys[e.key] = false; });

// --- Start button ---
document.getElementById('startBtn').onclick = function () {
  document.querySelector('.placeholder-img').style.display = 'none';
  document.getElementById('canvas').style.display = 'block';
  startGame();
};
