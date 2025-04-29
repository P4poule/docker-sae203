const socket = io('http://di-docker:8023');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scale = 40;
const rows = canvas.height / scale;
const columns = canvas.width / scale;

let snakes = [];
let food = { x: 0, y: 0 };
let playing = false;
let roomCode = "";
let playerIndex = null; // 0 = joueur vert, 1 = joueur bleu

document.getElementById('joinBtn').onclick = () => {
    roomCode = document.getElementById('roomCode').value.trim();
    if (roomCode !== "") {
        socket.emit('joinRoom', roomCode);
    }
};

socket.on('waiting', () => {
    document.getElementById('waiting').innerText = "En attente d'un autre joueur...";
});

socket.on('startGame', ({ initialFood, initialSnakes }) => {
    document.getElementById('menu').style.display = 'none';
    canvas.style.display = 'block';
    playing = true;
    snakes = initialSnakes;
    food = initialFood;
    socket.emit('whoAmI', { roomCode });
    requestAnimationFrame(gameLoop);
});

socket.on('youAre', (index) => {
    playerIndex = index;
});

socket.on('updateGame', ({ snakes: newSnakes, food: newFood }) => {
    snakes = newSnakes;
    food = newFood;
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la nourriture
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * scale, food.y * scale, scale, scale);

    // Dessiner les serpents
    snakes.forEach((snake, idx) => {
        snake.body.forEach((segment, i) => {
            ctx.fillStyle = idx === 0 ? (i === 0 ? 'darkgreen' : 'green') : (i === 0 ? 'darkblue' : 'blue');
            ctx.fillRect(segment.x * scale, segment.y * scale, scale, scale);
        });
    });

    if (playing) {
        requestAnimationFrame(gameLoop);
    }
}

document.addEventListener('keydown', (e) => {
    if (!playing || playerIndex === null) return;

    let direction = null;
    switch (e.key) {
        case 'z': direction = 'Up'; break;
        case 's': direction = 'Down'; break;
        case 'q': direction = 'Left'; break;
        case 'd': direction = 'Right'; break;
        case 'ArrowUp': direction = 'Up'; break;
        case 'ArrowDown': direction = 'Down'; break;
        case 'ArrowLeft': direction = 'Left'; break;
        case 'ArrowRight': direction = 'Right'; break;
    }
    if (direction) {
        socket.emit('move', { roomCode, direction, playerIndex });
    }
});
