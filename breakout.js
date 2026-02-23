const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const messageEl = document.getElementById('message');
const restartBtn = document.getElementById('restart');

const state = {
  running: false,
  score: 0,
  lives: 3,
  level: 1,
  keys: { left: false, right: false },
};

const paddle = {
  width: 120,
  height: 14,
  speed: 8,
  x: (canvas.width - 120) / 2,
  y: canvas.height - 32,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height - 60,
  radius: 9,
  speed: 4.5,
  dx: 3,
  dy: -3,
};

const brickSettings = {
  rows: 5,
  cols: 10,
  width: 60,
  height: 20,
  padding: 10,
  offsetTop: 70,
  offsetLeft: 35,
};

let bricks = [];

function createBricks() {
  bricks = [];
  const durabilityBase = Math.min(2, Math.floor((state.level - 1) / 2));

  for (let row = 0; row < brickSettings.rows; row += 1) {
    const rowBricks = [];
    for (let col = 0; col < brickSettings.cols; col += 1) {
      rowBricks.push({
        x: col * (brickSettings.width + brickSettings.padding) + brickSettings.offsetLeft,
        y: row * (brickSettings.height + brickSettings.padding) + brickSettings.offsetTop,
        hp: 1 + ((row + durabilityBase) % 2),
        alive: true,
      });
    }
    bricks.push(rowBricks);
  }
}

function resetBallAndPaddle() {
  paddle.x = (canvas.width - paddle.width) / 2;
  ball.x = canvas.width / 2;
  ball.y = canvas.height - 60;
  const direction = Math.random() < 0.5 ? -1 : 1;
  ball.dx = direction * (2.8 + state.level * 0.3);
  ball.dy = -(2.8 + state.level * 0.3);
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  livesEl.textContent = String(state.lives);
  levelEl.textContent = String(state.level);
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#f0fff4');
  grad.addColorStop(1, '#dcfce7');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPaddle() {
  ctx.fillStyle = '#166534';
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.strokeStyle = '#14532d';
  ctx.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
}

function drawBall() {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#2563eb';
  ctx.fill();
  ctx.closePath();
}

function brickColor(hp) {
  return hp === 2 ? '#22c55e' : '#86efac';
}

function drawBricks() {
  bricks.forEach((rowBricks) => {
    rowBricks.forEach((brick) => {
      if (!brick.alive) return;
      ctx.fillStyle = brickColor(brick.hp);
      ctx.fillRect(brick.x, brick.y, brickSettings.width, brickSettings.height);
      ctx.strokeStyle = '#15803d';
      ctx.strokeRect(brick.x, brick.y, brickSettings.width, brickSettings.height);
    });
  });
}

function collideWalls() {
  if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
    ball.dx *= -1;
  }

  if (ball.y + ball.dy < ball.radius) {
    ball.dy *= -1;
  } else if (ball.y + ball.dy > canvas.height - ball.radius) {
    if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
      const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      ball.dx = hitPos * 6;
      ball.dy = -Math.abs(ball.dy);
    } else {
      state.lives -= 1;
      updateHud();
      if (state.lives <= 0) {
        state.running = false;
        messageEl.textContent = 'ゲームオーバー… スペースキーかリスタートで再挑戦！';
      } else {
        state.running = false;
        messageEl.textContent = 'ミス！ スペースキーで再開';
        resetBallAndPaddle();
      }
    }
  }
}

function collideBricks() {
  let remaining = 0;

  bricks.forEach((rowBricks) => {
    rowBricks.forEach((brick) => {
      if (!brick.alive) return;
      remaining += 1;

      if (
        ball.x > brick.x &&
        ball.x < brick.x + brickSettings.width &&
        ball.y > brick.y &&
        ball.y < brick.y + brickSettings.height
      ) {
        ball.dy *= -1;
        brick.hp -= 1;
        if (brick.hp <= 0) {
          brick.alive = false;
          state.score += 100;
        } else {
          state.score += 40;
        }
        updateHud();
      }
    });
  });

  if (remaining === 0) {
    state.level += 1;
    ball.speed += 0.5;
    state.running = false;
    messageEl.textContent = `レベル ${state.level} に進みました！ スペースキーで開始`;
    createBricks();
    resetBallAndPaddle();
    updateHud();
  }
}

function movePaddle() {
  if (state.keys.left) {
    paddle.x -= paddle.speed;
  }
  if (state.keys.right) {
    paddle.x += paddle.speed;
  }

  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) {
    paddle.x = canvas.width - paddle.width;
  }
}

function drawFrame() {
  drawBackground();
  drawBricks();
  drawPaddle();
  drawBall();
}

function gameLoop() {
  movePaddle();

  if (state.running) {
    collideWalls();
    collideBricks();
    ball.x += ball.dx;
    ball.y += ball.dy;
  }

  drawFrame();
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  state.score = 0;
  state.lives = 3;
  state.level = 1;
  state.running = false;
  messageEl.textContent = 'スペースキーでスタート！';
  createBricks();
  resetBallAndPaddle();
  updateHud();
}

function toggleRunning() {
  if (state.lives <= 0) {
    restartGame();
  }
  state.running = true;
  messageEl.textContent = 'プレイ中';
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') state.keys.left = true;
  if (event.key === 'ArrowRight') state.keys.right = true;
  if (event.code === 'Space') {
    event.preventDefault();
    toggleRunning();
  }
});

document.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft') state.keys.left = false;
  if (event.key === 'ArrowRight') state.keys.right = false;
});

restartBtn.addEventListener('click', restartGame);

restartGame();
gameLoop();
