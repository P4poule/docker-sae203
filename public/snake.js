const socket    = io();
const canvas    = document.getElementById('gameCanvas');
const ctx       = canvas.getContext('2d');
const menuEl    = document.getElementById('menu');
const statusEl  = document.getElementById('status');
const startBtn  = document.getElementById('startButton');
const replayBtn = document.getElementById('replayButton');
const scale     = 40;

// État du jeu
let snakes = [], food = {}, playing = false, roomCode = "", playerIndex = null;

// Compte à rebours
let countdown = 3;
let countdownActive = false;
let countdownTimer = null;

// Texte de fin de partie
let gameOverMessage = "";

// “Rejoindre la partie”
startBtn.onclick = () => {
  const code = document.getElementById('roomCode').value.trim();
  if (!code) return;
  roomCode = code;
  socket.emit('joinRoom', roomCode);
};

// “Recommencer”
replayBtn.onclick = () => {
  replayBtn.style.display = 'none';
  socket.emit('replay', roomCode);
};

// En attente
socket.on('waiting', () => {
  statusEl.innerText = "En attente d'un autre joueur...";
});

// Démarrage du chrono
socket.on('startGame', ({ initialFood, initialSnakes }) => {
  menuEl.style.display = 'none';
  canvas.style.display = 'block';
  replayBtn.style.display = 'none';
  statusEl.innerText = "";

  snakes = initialSnakes;
  food   = initialFood;
  playing = false;
  gameOverMessage = "";
  countdown = 3;
  countdownActive = true;

  clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdown--;
    if (countdown < 0) {
      clearInterval(countdownTimer);
      countdownActive = false;
      playing = true;
    }
  }, 1000);

  requestAnimationFrame(gameLoop);
  socket.emit('whoAmI', { roomCode });
});

// Qui suis-je
socket.on('youAre', index => {
  playerIndex = index;
});

// Mise à jour
socket.on('updateGame', ({ snakes: newSnakes, food: newFood }) => {
  snakes = newSnakes;
  food   = newFood;
});

// Game Over
socket.on('gameOver', (winner) => {
  playing = false;
  clearInterval(countdownTimer);

  if (winner === 'draw') {
    gameOverMessage = "Match nul !";
  } else if ((winner === 'green' && playerIndex === 0) ||
             (winner === 'blue'  && playerIndex === 1)) {
    gameOverMessage = "Tu as gagné !";
  } else {
    gameOverMessage = "Tu as perdu.";
  }

  replayBtn.style.display = 'block';
});

// Boucle de dessin
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pomme
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x * scale, food.y * scale, scale, scale);

  // Serpents
  snakes.forEach((snake, idx) => {
    snake.body.forEach((seg, i) => {
      ctx.fillStyle = idx === 0
        ? (i === 0 ? 'darkgreen' : 'green')
        : (i === 0 ? 'darkblue' : 'blue');
      ctx.fillRect(seg.x * scale, seg.y * scale, scale, scale);
    });
  });

  // Compte à rebours et indication de couleur
  if (countdownActive) {
    ctx.fillStyle = playerIndex === 0 ? 'green' : 'blue';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      playerIndex === 0 ? 'Tu es VERT' : 'Tu es BLEU',
      canvas.width/2,
      canvas.height/2 - 100
    );
    ctx.fillStyle = 'black';
    ctx.font = '80px Arial';
    ctx.fillText(
      countdown > 0 ? countdown.toString() : 'GO',
      canvas.width/2,
      canvas.height/2
    );
  }

  // Message de fin
  if (!playing && gameOverMessage) {
    ctx.fillStyle = 'black';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameOverMessage, canvas.width/2, canvas.height/2);
  }

  if (playing || countdownActive || gameOverMessage) {
    requestAnimationFrame(gameLoop);
  }
}

// Contrôles
document.addEventListener('keydown', e => {
  if (!playing || playerIndex === null) return;
  const map = {
    'z':'Up','s':'Down','q':'Left','d':'Right',
    'ArrowUp':'Up','ArrowDown':'Down','ArrowLeft':'Left','ArrowRight':'Right'
  };
  const dir = map[e.key];
  if (dir) socket.emit('move', { roomCode, direction: dir, playerIndex });
});
