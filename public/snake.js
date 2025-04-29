const socket = io();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scale = 40;
const rows = canvas.height / scale;
const columns = canvas.width / scale;

let snake, opponent, food;
let running = false;
let roomCode = '';

document.getElementById('joinBtn').onclick = () => {
    roomCode = document.getElementById('roomCode').value.trim();
    if (roomCode !== '') {
        socket.emit('joinRoom', roomCode);
    }
};

socket.on('waiting', () => {
    document.getElementById('waiting').textContent = 'En attente d’un autre joueur...';
});

socket.on('startGame', () => {
    document.getElementById('menu').style.display = 'none';
    canvas.style.display = 'block';
    startGame();
});

socket.on('opponentMove', (data) => {
    opponent.direction = data.direction;
});

function startGame() {
    snake = new Snake('green', 5, 5, 'Right');
    opponent = new Snake('blue', columns - 6, rows - 6, 'Left');
    food = spawnFood();
    running = true;
    setInterval(gameLoop, 150);
}

class Snake {
    constructor(color, x, y, dir) {
        this.color = color;
        this.body = [{x: x, y: y}];
        this.direction = dir;
    }

    move() {
        const head = {...this.body[0]};
        switch (this.direction) {
            case 'Up': head.y -= 1; break;
            case 'Down': head.y += 1; break;
            case 'Left': head.x -= 1; break;
            case 'Right': head.x += 1; break;
        }
        this.body.unshift(head);

        // Si mange pas, retirer dernière case
        if (head.x === food.x && head.y === food.y) {
            food = spawnFood();
            // On ne retire pas la queue (le snake grandit)
        } else {
            this.body.pop();
        }
    }

    draw() {
        for (let i = 0; i < this.body.length; i++) {
            ctx.fillStyle = i === 0 ? (this.color === 'green' ? 'darkgreen' : 'darkblue') : this.color;
            ctx.fillRect(this.body[i].x * scale, this.body[i].y * scale, scale, scale);
        }
    }

    checkCollision() {
        const head = this.body[0];

        // Collision avec les murs
        if (head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows) {
            return true;
        }

        // Collision avec son corps
        for (let i = 1; i < this.body.length; i++) {
            if (head.x === this.body[i].x && head.y === this.body[i].y) {
                return true;
            }
        }

        // Collision avec l’autre snake
        for (let part of opponent.body) {
            if (head.x === part.x && head.y === part.y) {
                return true;
            }
        }

        return false;
    }
}

function spawnFood() {
    return {
        x: Math.floor(Math.random() * columns),
        y: Math.floor(Math.random() * rows)
    };
}

function gameLoop() {
    if (!running) return;

    snake.move();
    opponent.move();

    if (snake.checkCollision() && opponent.checkCollision()) {
        gameOver('Égalité');
    } else if (snake.checkCollision()) {
        gameOver('Bleu');
    } else if (opponent.checkCollision()) {
        gameOver('Vert');
    }

    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner la nourriture
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * scale, food.y * scale, scale, scale);

    snake.draw();
    opponent.draw();
}

function gameOver(winner) {
    running = false;

    ctx.fillStyle = 'black';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(winner === 'Égalité' ? 'Égalité !' : `Victoire de ${winner} !`, canvas.width/2, canvas.height/2);
}

// Envoyer nos déplacements au serveur
document.addEventListener('keydown', (e) => {
    if (!running) return;

    const key = e.key;

    if (key === 'z' && snake.direction !== 'Down') snake.direction = 'Up';
    else if (key === 's' && snake.direction !== 'Up') snake.direction = 'Down';
    else if (key === 'q' && snake.direction !== 'Right') snake.direction = 'Left';
    else if (key === 'd' && snake.direction !== 'Left') snake.direction = 'Right';

    socket.emit('move', { roomCode, direction: snake.direction });
});
