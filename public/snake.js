const socket    = io();
const canvas    = document.getElementById('gameCanvas');
const ctx       = canvas.getContext('2d');
const menuEl    = document.getElementById('menu');
const statusEl  = document.getElementById('status');
const startBtn  = document.getElementById('startButton');
const scale     = 40;

// État du jeu
let snakes = [], food = {}, playing = false, roomCode = "", playerIndex = null;

// Compte à rebours
let countdown = 3;
let countdownActive = false;
let countdownTimer = null;

// Texte de fin de partie
let gameOverMessage = "";

// Quand on clique sur “Rejoindre la partie”
startBtn.onclick = () => {
    const code = document.getElementById('roomCode').value.trim();
    if (!code) return;
    roomCode = code;
    socket.emit('joinRoom', roomCode);
};

// En attente du deuxième joueur
socket.on('waiting', () => {
    statusEl.innerText = "En attente d'un autre joueur...";
});

// Quand deux joueurs sont là : démarrage du compte à rebours
socket.on('startGame', ({ initialFood, initialSnakes }) => {
    menuEl.style.display = 'none';
    canvas.style.display = 'block';
    statusEl.innerText = "";

    snakes = initialSnakes;
    food = initialFood;
    playing = false;
    gameOverMessage = "";
    countdown = 3;
    countdownActive = true;

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

// Qui suis-je (0 ou 1)
socket.on('youAre', index => {
    playerIndex = index;
});

// Mise à jour du jeu (mouvements)
socket.on('updateGame', ({ snakes: newSnakes, food: newFood }) => {
    snakes = newSnakes;
    food = newFood;
});

// Fin de partie
socket.on('gameOver', (winner) => {
    playing = false;
    clearInterval(countdownTimer);

    if (winner === 'draw') {
        gameOverMessage = "Match nul !";
    } else if ((winner === 'green' && playerIndex === 0) ||
               (winner === 'blue'  && playerIndex === 1)) {
        gameOverMessage = "Tu as gagné.";
    } else {
        gameOverMessage = "Tu as perdu !";
    }
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

    // Affichage pendant le compte à rebours
    if (countdownActive) {
        // 1. Afficher "Tu es Vert" ou "Tu es Bleu"
        ctx.fillStyle = playerIndex === 0 ? 'green' : 'blue';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            playerIndex === 0 ? 'Tu es VERT' : 'Tu es BLEU',
            canvas.width / 2,
            canvas.height / 2 - 100 // un peu au-dessus du chiffre du chrono
        );

        // 2. Afficher le chrono ("3", "2", "1", "GO")
        ctx.fillStyle = 'black';
        ctx.font = '80px Arial';
        ctx.fillText(
            countdown > 0 ? countdown.toString() : 'GO',
            canvas.width / 2,
            canvas.height / 2
        );
    }

    // Affichage de "Tu as gagné" / "Tu as perdu"
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


// Touches
document.addEventListener('keydown', e => {
    if (!playing || playerIndex === null) return;
    const map = {
        'z':'Up', 's':'Down', 'q':'Left', 'd':'Right',
        'ArrowUp':'Up', 'ArrowDown':'Down', 'ArrowLeft':'Left', 'ArrowRight':'Right'
    };
    const direction = map[e.key];
    if (direction) {
        socket.emit('move', { roomCode, direction, playerIndex });
    }
});