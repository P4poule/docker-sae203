const socket    = io();
const canvas    = document.getElementById('gameCanvas');
const ctx       = canvas.getContext('2d');
const menuEl    = document.getElementById('menu');
const statusEl  = document.getElementById('status');
const startBtn  = document.getElementById('startButton');
const scale     = 40;

// État du jeu
let snakes = [], food = {}, playing = false, roomCode = "", playerIndex = null;

// Pour le compte à rebours
let countdown        = 3;
let countdownActive  = false;
let countdownTimer   = null;

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

// Dès que les deux joueurs sont là : on lance le décompte
socket.on('startGame', ({ initialFood, initialSnakes }) => {
    // Cacher le menu, afficher le canvas
    menuEl.style.display   = 'none';
    canvas.style.display   = 'block';
    statusEl.innerText     = "";

    // Initialisation
    snakes                = initialSnakes;
    food                  = initialFood;
    playing               = false;
    countdown             = 3;
    countdownActive       = true;

    // Lancer le timer
    countdownTimer = setInterval(() => {
        countdown--;
        if (countdown < 0) {
            clearInterval(countdownTimer);
            countdownActive = false;
            playing = true;
        }
    }, 1000);

    // Démarrer la boucle de rendu (draw + overlay)
    requestAnimationFrame(gameLoop);

    // Demander au serveur quel joueur je suis
    socket.emit('whoAmI', { roomCode });
});

// On reçoit notre index (0 = vert, 1 = bleu)
socket.on('youAre', index => {
    playerIndex = index;
});

// Mise à jour du jeu (positions)
socket.on('updateGame', ({ snakes: newSnakes, food: newFood }) => {
    snakes = newSnakes;
    food   = newFood;
});

// Fin de partie : on affiche le résultat et on réaffiche le menu
socket.on('gameOver', winner => {
    playing = false;
    clearInterval(countdownTimer);

    if (winner === 'draw') {
        statusEl.innerText = "Match nul !";
    } else if ((winner === 'green' && playerIndex === 0) ||
               (winner === 'blue'  && playerIndex === 1)) {
        statusEl.innerText = "Tu as perdu.";
    } else {
        statusEl.innerText = "Tu as gagné !";
    }

    // Revenir au menu
    canvas.style.display = 'none';
    menuEl.style.display = 'block';
});

// Boucle de dessin
function gameLoop() {
    // Nettoyage
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner la pomme
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * scale, food.y * scale, scale, scale);

    // Dessiner les serpents
    snakes.forEach((snake, idx) => {
        snake.body.forEach((seg, i) => {
            ctx.fillStyle = idx === 0
                ? (i === 0 ? 'darkgreen' : 'green')
                : (i === 0 ? 'darkblue'  : 'blue');
            ctx.fillRect(seg.x * scale, seg.y * scale, scale, scale);
        });
    });

    // Overlay du compte à rebours
    if (countdownActive) {
        ctx.fillStyle   = 'black';
        ctx.font        = '80px Arial';
        ctx.textAlign   = 'center';
        ctx.textBaseline= 'middle';
        const text      = countdown > 0 ? countdown.toString() : 'GO';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    // Continuer la boucle si le jeu est lancé
    if (playing || countdownActive) {
        requestAnimationFrame(gameLoop);
    }
}

// Gestion des touches (bloqué pendant countdown)
document.addEventListener('keydown', e => {
    if (!playing || playerIndex === null) return;
    const map = {
        'z':'Up','s':'Down','q':'Left','d':'Right',
        'ArrowUp':'Up','ArrowDown':'Down','ArrowLeft':'Left','ArrowRight':'Right'
    };
    const direction = map[e.key];
    if (direction) {
        socket.emit('move', { roomCode, direction, playerIndex });
    }
});
