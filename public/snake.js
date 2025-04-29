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
// Scores
let scores = { green: 0, blue: 0 };

// Compte à rebours
let countdown = 3;
let countdownActive = false;
let countdownTimer = null;

// Message de fin
let gameOverMessage = "";

// “Rejoindre”
startBtn.onclick = () => {
  const code = document.getElementById('roomCode').value.trim();
  if (!code) return;
  roomCode = code;
  socket.emit('joinRoom', roomCode);
};

// “Recommencer”
replayBtn.onclick = () => {
  replayBtn.style.display = 'none';
  statusEl.innerText = "En attente du deuxième joueur...";
  socket.emit('replay', roomCode);
};

// En attente du second
socket.on('waiting', () => {
  statusEl.innerText = "En attente d'un autre joueur...";
});

// Lancement du chrono + init scores
socket.on('startGame', ({ initialFood, initialSnakes, scores: initialScores }) => {
  menuEl.style.display      = 'none';
  canvas.style.display      = 'block';
  replayBtn.style.display   = 'none';
  statusEl.innerText        = "";
  snakes      = initialSnakes;
  food        = initialFood;
  scores      = initialScores;        // récupérer les scores
  playing     = false;
  gameOverMessage = "";
  countdown   = 3;
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

// Mon index (0 ou 1)
socket.on('youAre', index => {
  playerIndex = index;
});

// Mise à jour positions
socket.on('updateGame', ({ snakes: newSnakes, food: newFood }) => {
  snakes = newSnakes;
  food   = newFood;
});

// Mise à jour des scores
socket.on('scoreUpdate', newScores => {
  scores = newScores;
});

// Fin de partie
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

  // --- Scoreboard à droite ---
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`Vert: ${scores.green}`, canvas.width - 10, 25);
  ctx.fillText(`Bleu: ${scores.blue}`, canvas.width - 10, 50);

  // --- Pomme ---
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x * scale, food.y * scale, scale, scale);

  // --- Serpents ---
  snakes.forEach((snake, idx) => {
    snake.body.forEach((seg, i) => {
      ctx.fillStyle = idx === 0
        ? (i === 0 ? 'darkgreen' : 'green')
        : (i === 0 ? 'darkblue' : 'blue');
      ctx.fillRect(seg.x * scale, seg.y * scale, scale, scale);
    });
  });

  // --- Compte à rebours + couleur joueur ---
  if (countdownActive) {
    ctx.fillStyle = playerIndex === 0 ? 'green' : 'blue';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      playerIndex === 0 ? 'Tu es VERT' : 'Tu es BLEU',
      canvas.width / 2,
      canvas.height / 2 - 100
    );
    ctx.fillStyle = 'black';
    ctx.font = '80px Arial';
    ctx.fillText(
      countdown > 0 ? countdown.toString() : 'GO',
      canvas.width / 2,
      canvas.height / 2
    );
  }

  // --- Message fin de partie ---
  if (!playing && gameOverMessage) {
    ctx.fillStyle = 'black';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(gameOverMessage, canvas.width / 2, canvas.height / 2);
  }

  if (playing || countdownActive || gameOverMessage) {
    requestAnimationFrame(gameLoop);
  }
}

// Clavier
document.addEventListener('keydown', e => {
  if (!playing || playerIndex === null) return;
  const map = {
    'z':'Up','s':'Down','q':'Left','d':'Right',
    'ArrowUp':'Up','ArrowDown':'Down','ArrowLeft':'Left','ArrowRight':'Right'
  };
  const dir = map[e.key];
  if (dir) {
    socket.emit('move', { roomCode, direction: dir, playerIndex });
  }
});
