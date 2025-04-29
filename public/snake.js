const socket = io();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scale = 40;

let snakes = [], food = {}, playing = false, roomCode = "", playerIndex = null;
let countdown = 3;
let countdownInterval;
let gameOverMessage = '';

document.getElementById('startButton').onclick = () => {
    roomCode = document.getElementById('roomCode').value.trim();
    if (roomCode !== "") {
        socket.emit('joinRoom', roomCode);
    }
};

document.getElementById('replayButton').onclick = () => {
    socket.emit('replay', roomCode);
    document.getElementById('replayButton').style.display = 'none';
};

socket.on('waiting', () => {
    document.getElementById('status').innerText = "En attente d'un autre joueur...";
});

socket.on('startCountdown', () => {
    document.getElementById('menu').style.display = 'none';
    canvas.style.display = 'block';
    countdown = 3;
    countdownInterval = setInterval(() => {
        countdown--;
        if (countdown === 0) {
            clearInterval(countdownInterval);
            socket.emit('startGame', { roomCode });
        }
    }, 1000);
});

socket.on('startPlaying', ({ initialFood, initialSnakes }) => {
    playing = true;
    snakes = initialSnakes;
    food = initialFood;
    requestAnimationFrame(gameLoop);
    socket.emit('whoAmI', { roomCode });
});

socket.on('youAre', (index) => {
    playerIndex = index;
});

socket.on('updateGame', ({ snakes: newSnakes, food: newFood }) => {
    snakes = newSnakes;
    food = newFood;
});

socket.on('gameOver', (winner) => {
    playing = false;
    if (winner === 'draw') {
        gameOverMessage = 'Match nul !';
    } else if ((winner === 'green' && playerIndex === 0) || (winner === 'blue' && playerIndex === 1)) {
        gameOverMessage = 'Tu as gagné !';
    } else {
        gameOverMessage = 'Tu as perdu !';
    }
    document.getElementById('replayButton').style.display = 'block';
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Nourriture
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * scale, food.y * scale, scale, scale);

    // Serpents
    snakes.forEach((snake, idx) => {
        snake.body.forEach((seg, i) => {
            ctx.fillStyle = idx === 0 ? (i === 0 ? 'darkgreen' : 'green') : (i === 0 ? 'darkblue' : 'blue');
            ctx.fillRect(seg.x * scale, seg.y * scale, scale, scale);
        });
    });

    // Texte de fin de partie
    if (!playing && gameOverMessage) {
        ctx.fillStyle = 'black';
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameOverMessage, canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    if (!playing || playerIndex === null) return;
    const directions = { 'z':'Up','s':'Down','q':'Left','d':'Right','ArrowUp':'Up','ArrowDown':'Down','ArrowLeft':'Left','ArrowRight':'Right' };
    const direction = directions[e.key];
    if (direction) socket.emit('move', { roomCode, direction, playerIndex });
});
