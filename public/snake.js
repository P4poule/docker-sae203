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
        if (!countdownActive) {
            clearInterval(countdownTimer);
            return;
        }
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

    // Vérification : la pomme ne doit pas apparaître sur un serpent
    const isFoodOnSnake = snakes.some(snake =>
        snake.body.some(segment => segment.x === food.x && segment.y === food.y)
    );
    if (isFoodOnSnake) {
        console.error("Erreur : La pomme est apparue sur un serpent !");
    }
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

    // Réinitialisation du jeu
    resetGame();

    // Continuer d'afficher l'état final
    requestAnimationFrame(gameLoop);
});

// Réinitialisation des variables globales
function resetGame() {
    snakes = [];
    food = {};
    playing = false;
    countdown = 3;
    countdownActive = false;
    gameOverMessage = "";
    clearInterval(countdownTimer); // Arrêter le compte à rebours
}

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

    // Afficher le message de fin de partie
    if (!playing && gameOverMessage) {
        ctx.fillStyle = 'black';
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gameOverMessage, canvas.width / 2, canvas.height / 2);
    }

    // Continuer la boucle uniquement si le jeu est en cours ou si le compte à rebours est actif
    if (playing || countdownActive) {
        requestAnimationFrame(gameLoop);
    }
}

// Gestion des touches
let lastMoveTime = 0;
const moveCooldown = 100; // Temps minimum entre deux mouvements (en ms)

document.addEventListener('keydown', e => {
    if (!playing || playerIndex === null) return;

    const now = Date.now();
    if (now - lastMoveTime < moveCooldown) return; // Ignorer si trop rapide
    lastMoveTime = now;

    const map = {
        'z': 'Up', 's': 'Down', 'q': 'Left', 'd': 'Right',
        'ArrowUp': 'Up', 'ArrowDown': 'Down', 'ArrowLeft': 'Left', 'ArrowRight': 'Right'
    };
    const direction = map[e.key];
    if (direction) {
        socket.emit('move', { roomCode, direction, playerIndex });
    }
});
