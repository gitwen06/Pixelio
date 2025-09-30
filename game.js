// --- Globals (top of file) ---
let keys = {};
let bullets = [];
let enemies = [];
let wave = 1;
let score = 0;

let gameOver = false;
let spawning = false;

let isRunning = false;      // track whether loop is running
let restartBtn = null;      // reference so we can remove it
let spawnTimeout = null;    // keep spawn timer id
let shieldTimeout = null;   // keep shield timer id

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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
  // Clear any pending timers from previous run
  if (spawnTimeout) { clearTimeout(spawnTimeout); spawnTimeout = null; }
  if (shieldTimeout) { clearTimeout(shieldTimeout); shieldTimeout = null; }

  // Reset game state
  bullets = [];
  enemies = [];
  wave = 1;
  score = 0;
  gameOver = false;
  spawning = false;
  keys = {}; // reset pressed keys

  // Reset player pos
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  // Remove restart button if present
  if (restartBtn) {
    restartBtn.remove();
    restartBtn = null;
  }

  // Start the loop if not already running
  if (!isRunning) {
    requestAnimationFrame(gameLoop);
  }
}

// --- Restart button helper ---
function showRestartButton() {
  if (restartBtn) return; // only one

  const container = document.querySelector('.game-container') || document.body;
  restartBtn = document.createElement('button');
  restartBtn.id = 'restartBtn';
  restartBtn.textContent = 'Restart';
  restartBtn.className = 'start-btn restart-btn';

  // style it so it's visible (adjust as needed)
  restartBtn.style.position = 'absolute';
  restartBtn.style.top = '65%';
  restartBtn.style.left = '45%';
  restartBtn.style.transform = 'translate(-50%, -50%)';
  restartBtn.style.zIndex = 1000;

  container.appendChild(restartBtn);

  restartBtn.onclick = () => {
    // remove button and restart cleanly
    if (restartBtn) { restartBtn.remove(); restartBtn = null; }
    startGame();
  };
}

// --- Spawning with cancellable timers ---
function spawnEnemies() {
  if (enemies.length === 0 && !spawning) {
    spawning = true;

    // start delay (store id so we can clear on restart)
    spawnTimeout = setTimeout(() => {
      // spawn enemies (they start shielded)
      for (let i = 0; i < wave * 5; i++) {
        enemies.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 15,
          speed: 1 + Math.random() * 0.5,
          color: "red",
          shielded: true
        });
      }

      // remove shield after 3s (store id so we can cancel too)
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
    // draw overlay
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
    isRunning = false; // loop stopped
    return;
  }

  isRunning = true;

  // clear + updates + draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  movePlayer();
  drawPlayer();
  updateBullets();
  updateEnemies();
  spawnEnemies();
  drawScore();

  requestAnimationFrame(gameLoop);
}

// --- Example helper functions (implementations should match your code) ---
function movePlayer() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

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
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx * b.speed;
    b.y += b.dy * b.speed;

    // remove offscreen bullets
    if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }

    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fillStyle = 'yellow';
    ctx.fill();
  }
}
function updateEnemies() {
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];

    // only move + hurt when not shielded
    if (!e.shielded) {
      const angle = Math.atan2(player.y - e.y, player.x - e.x);
      e.x += Math.cos(angle) * e.speed;
      e.y += Math.sin(angle) * e.speed;

      // collision with player -> game over
      const distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
      if (distToPlayer < player.size + e.size) {
        gameOver = true;
      }
    }

    // bullet collisions (only if not shielded)
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      const dist = Math.hypot(e.x - b.x, e.y - b.y);
      if (dist < e.size + b.size && !e.shielded) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score += 10;
        break;
      }
    }

    // draw enemy
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fillStyle = e.color;
    ctx.fill();

    if (e.shielded) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = "white";
      ctx.stroke();
      ctx.lineWidth = 1;
    } else {
      ctx.strokeStyle = "#222";
      ctx.stroke();
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

// --- Input (example) ---
document.addEventListener('keydown', e => {
    keys[e.key] = true;
  
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

// Make sure your start button calls startGame()
document.getElementById('startBtn').onclick = function() {
  document.querySelector('.placeholder-img').style.display = 'none';
  document.getElementById('canvas').style.display = 'block';
  startGame();
};
