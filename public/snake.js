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

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner nourriture
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * scale, food.y * scale, scale, scale);

    // Dessiner serpents
    snakes.forEach((snake, idx) => {
        snake.body.forEach((segment, index) => {
            ctx.fillStyle = idx === 0 ? (index === 0 ? 'darkgreen' : 'green') : (index === 0 ? 'darkblue' : 'blue');
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
