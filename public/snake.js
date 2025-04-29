const socket = io();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scale = 40;

let snakes = [], food = {}, playing = false, roomCode = "", playerIndex = null;

document.getElementById('startButton').onclick = () => {
    roomCode = document.getElementById('roomCode').value.trim();
    if (roomCode !== "") {
        socket.emit('joinRoom', roomCode);
    }
};

socket.on('waiting', () => {
    document.getElementById('status').innerText = "En attente d'un autre joueur...";
});

socket.on('startGame', ({ initialFood, initialSnakes }) => {
    document.getElementById('menu').style.display = 'none';
    canvas.style.display = 'block';
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
        document.getElementById('status').innerText = "Match nul !";
    } else if ((winner === 'green' && playerIndex === 0) || (winner === 'blue' && playerIndex === 1)) {
        document.getElementById('status').innerText = "Tu as perdu.";
    } else {
        document.getElementById('status').innerText = "Tu as gagné !";
    }
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * scale, food.y * scale, scale, scale);

    snakes.forEach((snake, idx) => {
        snake.body.forEach((seg, i) => {
            ctx.fillStyle = idx === 0 ? (i === 0 ? 'darkgreen' : 'green') : (i === 0 ? 'darkblue' : 'blue');
            ctx.fillRect(seg.x * scale, seg.y * scale, scale, scale);
        });
    });

    if (playing) requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e => {
    if (!playing || playerIndex === null) return;
    const directions = { 'z':'Up','s':'Down','q':'Left','d':'Right','ArrowUp':'Up','ArrowDown':'Down','ArrowLeft':'Left','ArrowRight':'Right' };
    const direction = directions[e.key];
    if (direction) socket.emit('move', { roomCode, direction, playerIndex });
});
