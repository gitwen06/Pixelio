let keys = {};
let bullets = [];
let bombProjectiles = [];
let enemies = [];
let enemyBullets = [];
let playerHealth = 3;
const maxHealth = 3;
let isPaused = false;
let healthPickups = [];
let wave = 1;
let score = 0;
let gameOver = false;
let spawning = false;
let isRunning = false;
let restartBtn = null;
let menuBtn = null;
let spawnTimeout = null;
let shieldTimeout = null;
let burstReady = true;
let bombReady = true;
let bombEffect = null;
let playerFlash = 0;
let lastFrameTime = performance.now();
let shootKey = localStorage.getItem("shootKey") || "Space";
let upgradePoints = Number(localStorage.getItem("upgradePoints")) || 0;
let upgrades = {
  damage: Number(localStorage.getItem("upgradeDamage")) || 1,
  fireRate: Number(localStorage.getItem("upgradeFireRate")) || 1,
  health: Number(localStorage.getItem("upgradeHealth")) || 3
};
let lastShotTime = 0;

const explosionFrames = [
  new Image(),
  new Image(),
  new Image()
];
explosionFrames[0].src = "images/Explosion_frame_1.png";
explosionFrames[1].src = "images/Explosion_frame_2.png";
explosionFrames[2].src = "images/Explosion_frame_3.png";

let explosions = [];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const playerImg = new Image();
playerImg.src = "images/Mainbody.png";
const bulletImg = new Image();
bulletImg.src = "images/Bullet.png";
const bigHealthImg = new Image();
bigHealthImg.src = "images/Bighealth.png";
const miniHealthImg = new Image();
miniHealthImg.src = "images/MiniHealth.png";
const bombBullet = new Image();
bombBullet.src = "images/bombBullet.png";

const skillButtonQ = document.getElementById('skillQ');
const skillButtonE = document.getElementById('skillE');
skillButtonE.style.display = "none";
skillButtonQ.style.display = "none";

window.addEventListener('DOMContentLoaded', () => {
  settings();

  const lilSettingImg = document.getElementById('lilSetting');
  const pauseMenu = document.getElementById('pauseMenu');
  const resumeGameBtn = document.getElementById('resumeGameBtn');
  const shootKeyBtnPause = document.getElementById('shootKeyBindPause');

  if (lilSettingImg) {
    lilSettingImg.onclick = () => {
      pauseGame();
      pauseMenu.classList.remove('hidden');
    };
  }

  if (resumeGameBtn) {
    resumeGameBtn.onclick = () => {
      pauseMenu.classList.add('hidden');
      resumeGame();
    };
  }

  // --- Change key feature for pause menu ---
  if (shootKeyBtnPause) {
    shootKeyBtnPause.textContent = `[${shootKey}]`;

    shootKeyBtnPause.onclick = () => {
      shootKeyBtnPause.textContent = "[Press any key]";
      shootKeyBtnPause.classList.add("waiting");

      function onKeyPress(e) {
        e.preventDefault();
        shootKey = e.code;
        localStorage.setItem("shootKey", shootKey);
        shootKeyBtnPause.textContent = `[${shootKey}]`;
        shootKeyBtnPause.classList.remove("waiting");
        document.removeEventListener("keydown", onKeyPress);
        document.removeEventListener("mousedown", onMousePress);
      }

      function onMousePress(e) {
        e.preventDefault();
        if (e.button === 0) shootKey = "MouseLeft";
        else if (e.button === 1) shootKey = "MouseMiddle";
        else if (e.button === 2) shootKey = "MouseRight";
        localStorage.setItem("shootKey", shootKey);
        shootKeyBtnPause.textContent = `[${shootKey}]`;
        shootKeyBtnPause.classList.remove("waiting");
        document.removeEventListener("keydown", onKeyPress);
        document.removeEventListener("mousedown", onMousePress);
      }

      document.addEventListener("keydown", onKeyPress);
      document.addEventListener("mousedown", onMousePress, { once: true });
    };
  }
});

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

function settings() {
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsMenu = document.getElementById("settingsMenu");
  const closeSettings = document.getElementById("closeSettings");
  const shootKeyBtn = document.getElementById("shootKeyBind");

  shootKeyBtn.textContent = `[${shootKey}]`;

  settingsBtn.onclick = () => settingsMenu.classList.remove("hidden");
  closeSettings.onclick = () => settingsMenu.classList.add("hidden");

  shootKeyBtn.onclick = () => {
    shootKeyBtn.textContent = "[Press any key]";
    shootKeyBtn.classList.add("waiting");

    function onKeyPress(e) {
      e.preventDefault();
      shootKey = e.code;
      localStorage.setItem("shootKey", shootKey);
      shootKeyBtn.textContent = `[${shootKey}]`;
      shootKeyBtn.classList.remove("waiting");
      document.removeEventListener("keydown", onKeyPress);
      document.removeEventListener("mousedown", onMousePress);
    }

    function onMousePress(e) {
      e.preventDefault();
      if (e.button === 0) shootKey = "MouseLeft";
      else if (e.button === 1) shootKey = "MouseMiddle";
      else if (e.button === 2) shootKey = "MouseRight";
      localStorage.setItem("shootKey", shootKey);
      shootKeyBtn.textContent = `[${shootKey}]`;
      shootKeyBtn.classList.remove("waiting");
      document.removeEventListener("keydown", onKeyPress);
      document.removeEventListener("mousedown", onMousePress);
    }

    document.addEventListener("keydown", onKeyPress);
    document.addEventListener("mousedown", onMousePress, { once: true });
  };
}

document.getElementById('upgradesBtn').onclick = function () {
  document.getElementById('upgradesMenu').classList.remove('hidden');
  updateUpgradeMenu();
};

document.getElementById('closeUpgrades').onclick = function () {
  document.getElementById('upgradesMenu').classList.add('hidden');
};

document.getElementById('damageAmount').textContent = upgrades.damage.toFixed(1);
document.getElementById('fireRateAmount').textContent = upgrades.fireRate.toFixed(1);
document.getElementById('healthAmount').textContent = upgrades.health.toFixed(1);

document.querySelectorAll('.upgrade-btn').forEach(btn => {
  btn.onclick = function () {
    const type = btn.getAttribute('data-upgrade');
    let cost = type === "damage" ? 100 : type === "fireRate" ? 150 : 200;
    if (upgradePoints >= cost) {
      upgradePoints -= cost;
      upgrades[type] += 0.2;
      localStorage.setItem("upgradePoints", upgradePoints);
      localStorage.setItem("upgradeDamage", upgrades.damage);
      localStorage.setItem("upgradeFireRate", upgrades.fireRate);
      localStorage.setItem("upgradeHealth", upgrades.health);
      updateUpgradeMenu();
    }
    updateUpgradeMenu();
  };
});

function updateUpgradeMenu() {
  document.getElementById('upgradesMenu').querySelector('h2').textContent =
    `Upgrades (Points: ${upgradePoints})`;


  document.getElementById('damageAmount').textContent = upgrades.damage.toFixed(1);
  document.getElementById('fireRateAmount').textContent = upgrades.fireRate.toFixed(1);
  document.getElementById('healthAmount').textContent = getMaxHealth().toFixed(1);


}

function startGame() {
  if (!isRunning && gameOver) {
    canvas.style.pointerEvents = "none";
    
  }
  if (spawnTimeout) { clearTimeout(spawnTimeout); spawnTimeout = null; }
  if (shieldTimeout) { clearTimeout(shieldTimeout); shieldTimeout = null; }
  const lilSettingImg = document.getElementById('lilSetting');
  if (lilSettingImg) lilSettingImg.style.display = 'block';
  bullets = [];
  bombProjectiles = [];
  enemies = [];
  enemyBullets = [];
  healthPickups = [];
  wave = 1;
  score = 0;
  gameOver = false;
  spawning = false;
  keys = {};
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  playerHealth = getMaxHealth();
  burstReady = true;
  bombReady = true;
  bombEffect = null;
  playerFlash = 0;
  skillButtonE.style.display = "flex";
  skillButtonQ.style.display = "flex";
  if (restartBtn) {
    restartBtn.remove();
    restartBtn = null;
  }
  if (menuBtn) {
    menuBtn.remove();
    menuBtn = null;
  }
  if (!isRunning) {
    requestAnimationFrame(gameLoop);
  }
}

function showRestartButton() {
  if (restartBtn) return;

  const container = document.querySelector('.game-container');
  restartBtn = document.createElement('button');
  restartBtn.id = 'restartBtn';
  restartBtn.textContent = 'Restart';
  restartBtn.className = 'start-btn restart-btn';

  restartBtn.style.position = 'absolute';
  restartBtn.style.bottom = '30px';
  restartBtn.style.right = '37%';
  restartBtn.style.transform = 'translateY(-50%)';
  restartBtn.style.zIndex = 10;
  restartBtn.style.margin = '20px';

  container.appendChild(restartBtn);

  restartBtn.onclick = () => {
    restartBtn.remove();
    restartBtn = null;
    startGame();
  };
}

const lilSettingImg = document.getElementById('lilSetting');
function showMenuButton() {
  if (menuBtn) return;

  const container = document.querySelector('.game-container');
  menuBtn = document.createElement('button');
  menuBtn.id = 'menuBtn';
  menuBtn.textContent = 'Main Menu';
  menuBtn.className = 'start-btn menu-btn';

  menuBtn.style.position = 'absolute';
  menuBtn.style.bottom = '10px';
  menuBtn.style.left = '50.5%';
  menuBtn.style.transform = 'translateX(-50%)';
  menuBtn.style.zIndex = 10;

  container.appendChild(menuBtn);

  menuBtn.onclick = () => {
    menuBtn.remove();
    menuBtn = null;
    skillButtonE.style.display = "none";
    skillButtonQ.style.display = "none";
    if (lilSettingImg) lilSettingImg.style.display = "none";
    const startScreen = document.getElementById('startScreen');
    const hud = document.getElementById('hud');
    const bgGif = document.getElementById('bgGif');

    if (restartBtn) {
      restartBtn.remove();
      restartBtn = null;

    }

    startScreen.style.display = 'flex';
    canvas.style.display = 'none';
    hud.style.display = 'none';
    bgGif.style.display = 'block';
    gameOver = true;
    isRunning = false;
  };
}


function spawnEnemies() {
  if (enemies.length === 0 && !spawning) {
    spawning = true;
    spawnTimeout = setTimeout(() => {
      for (let i = 0; i < wave * 2; i++) {
        enemies.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 15,
          speed: 1 + Math.random() * 0.5,
          color: "red",
          shielded: true,
          canShoot: false,
          lastShot: Date.now(),
          shootCooldown: 999999,
          hp: 1
        });
      }
      if (wave >= 5) {
        for (let j = 0; j < wave * 1.05; j++) {
          enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 15,
            speed: 1 + Math.random() * 0.5,
            color: "orange",
            shielded: true,
            canShoot: true,
            lastShot: Date.now(),
            shootCooldown: 2000 + Math.random() * 1000,
            hp: 1
          });
        }
      }
      if (wave >= 10) {
        for (let k = 0; k < 2.5; k++) {
          enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 25,
            speed: 0.8,
            color: "gray",
            shielded: true,
            canShoot: true,
            lastShot: Date.now(),
            shootCooldown: 1500,
            hp: 5,
            isTank: true
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

function gameLoop() {
  if (isPaused) return;

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.font = "Bold 60px ByteBounce";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = "white";
    ctx.font = "28px ByteBounce";
    ctx.fillText("Score: " + score, canvas.width / 2, canvas.height / 2 + 40);
    showRestartButton();
    showMenuButton();
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
  drawHealthBar();

  if (bombEffect) {
    ctx.beginPath();
    ctx.arc(bombEffect.x, bombEffect.y, bombEffect.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 50, 50, 0.4)";
    ctx.fill();
    bombEffect.duration--;
    if (bombEffect.duration <= 0) bombEffect = null;
  }
  const now = performance.now();
  const deltaTime = now - lastFrameTime;
  lastFrameTime = now;

  drawExplosions(deltaTime);

  isRunning = true;
  requestAnimationFrame(gameLoop);
}

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
  if (playerFlash > 0) ctx.globalAlpha = 0.5;
  ctx.drawImage(playerImg, -playerSize / 2, -playerSize / 2 - bodyCenterOffsetY, playerSize, playerSize);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function updateBullets() {
  const bulletSize = 15;
  if (isRunning) {
    canvas.style.pointerEvents = "auto";
  }
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
      e.vx = Math.cos(bounceAngle) * 12.5;
      e.vy = Math.sin(bounceAngle) * 12.5;
      e.bounceFrames = 8;
      if (playerHealth <= 0) gameOver = true;
    }
    if (e.bounceFrames && e.bounceFrames > 0) {
      e.x += e.vx;
      e.y += e.vy;
      e.bounceFrames--;
    } else {
      e.vx = 0;
      e.vy = 0;
    }
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
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      const dist = Math.hypot(e.x - b.x, e.y - b.y);
      if (dist < e.size + b.size && !e.shielded) {
        e.hp -= upgrades.damage;
        bullets.splice(bi, 1);
        if (e.hp <= 0) {
          const dropChance = Math.random();
          if (dropChance < 0.07) {
            healthPickups.push({ x: e.x, y: e.y, type: "big" });
          } else if (dropChance < 0.19) {
            healthPickups.push({ x: e.x, y: e.y, type: "mini" });
          }
          let type = "red";
          if (e.color === "orange") type = "orange";
          if (e.isTank) type = "tank";
          enemies.splice(ei, 1);
          addScore(type);
        }
        break;
      }
    }
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
    if (Math.hypot(player.x - h.x, player.y - h.y) < player.size + size / 2) {
      playerHealth = Math.min(getMaxHealth(), playerHealth + (h.type === "big" ? getMaxHealth() : 1));
      healthPickups.splice(i, 1);
    }
  }
}

function drawHealthBar() {
  const barWidth = 200;
  const barHeight = 20;
  const x = 20;
  const y = 75;
  const healthRatio = Math.max(0, playerHealth / getMaxHealth());
  const currentWidth = barWidth * healthRatio;
  ctx.fillStyle = "#333";
  ctx.fillRect(x, y, barWidth, barHeight);
  ctx.fillStyle = healthRatio > 0.5 ? "#4caf50" : healthRatio > 0.25 ? "#ff9800" : "#f44336";
  ctx.fillRect(x, y, currentWidth, barHeight);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barWidth, barHeight);
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`${playerHealth.toFixed(1)} / ${getMaxHealth()}`, x + 50, y + 15);
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
      playerHealth -= 0.5;
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

    if (b.rotation === undefined) b.rotation = 0;
    b.rotation += 0.2;
    const bombSize = 30;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);
    ctx.drawImage(bombBullet, -bombSize / 2, -bombSize / 2, bombSize, bombSize);
    ctx.restore();

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

function drawExplosions(deltaTime) {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    const img = explosionFrames[Math.floor(exp.frame)];

    const growth = 1 + exp.frame * 0.35;
    const radius = exp.radius * growth;

    ctx.save();
    ctx.globalAlpha = 1 - exp.frame / explosionFrames.length;
    ctx.drawImage(img, exp.x - radius, exp.y - radius, radius * 2, radius * 2);
    ctx.restore();

    exp.frameTime += deltaTime;
    if (exp.frameTime > 200) {
      exp.frame++;
      exp.frameTime = 0;
    }

    if (exp.frame >= explosionFrames.length) {
      explosions.splice(i, 1);
    }
  }
}

function triggerBombExplosion(x, y) {
  const imageRadius = 125;
  const damageRadius = 200;

  explosions.push({
    x,
    y,
    radius: imageRadius,
    frame: 0,
    frameTime: 0
  });

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dist = Math.hypot(x - e.x, y - e.y);
    if (dist < damageRadius + e.size && !e.shielded && !e.isTank) {
      enemies.splice(i, 1);
      score += 20;
    }
    if (dist < damageRadius + e.size && !e.shielded && e.isTank) {
      e.hp -= 3;
      if (e.hp <= 0) {
        enemies.splice(i, 1);
        score += 20;
      }
    }
  }
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "40px ByteBounce";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Wave: " + (wave - 1), 20, 60);
  if (spawning) {
    ctx.textAlign = "center";
    ctx.fillStyle = "yellow";
    ctx.font = "50px ByteBounce";
    ctx.fillText("Next wave starting...", canvas.width / 2, canvas.height / 2 - 80);
  }
}

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
    rotation: 0,
    active: true
  });

  setTimeout(() => bombReady = true, 10000);
}

document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key.toLowerCase() === "q" && !gameOver) useBurstShot();
  if (e.key.toLowerCase() === "e" && !gameOver) useUltimateBomb();
  if (e.code === shootKey && !gameOver) {
    const now = Date.now();
    if (now - lastShotTime > 300 / upgrades.fireRate) {
      lastShotTime = now;
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
  }
});

document.addEventListener('keyup', e => { keys[e.key] = false; });

document.getElementById('startBtn').onclick = function () {
  document.querySelector('.placeholder-img').style.display = 'none';
  document.getElementById('canvas').style.display = 'block';
  startGame();
};

function shootBullet() {
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

document.addEventListener("mousedown", e => {
  if (gameOver) return;
  if (
    (shootKey === "MouseLeft" && e.button === 0) ||
    (shootKey === "MouseMiddle" && e.button === 1) ||
    (shootKey === "MouseRight" && e.button === 2)
  ) {
    shootBullet();
  }
});
document.addEventListener("contextmenu", e => e.preventDefault());

function addScore(enemyType) {
  let points = 0;
  if (enemyType === "red") points = 10;
  else if (enemyType === "orange") points = 20;
  else if (enemyType === "tank") points = 50;
  score += points;
  upgradePoints = Math.floor(score / 2);
  localStorage.setItem("upgradePoints", upgradePoints);
  updateUpgradeMenu();
}

const baseMaxHealth = 3;
function getMaxHealth() {
  return baseMaxHealth + upgrades.health;
}

function pauseGame() {
  isPaused = true;
  isRunning = false;
}

function resumeGame() {
  if (!gameOver && isPaused) {
    isPaused = false;
    isRunning = true;
    requestAnimationFrame(gameLoop);
  }
}

