const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 8023;

app.use(express.static('public'));

let rooms = {};

function createFood() {
    const scale = 40;
    const rows = 800 / scale;
    const cols = 800 / scale;
    return {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
    };
}

function createInitialSnakes() {
    return [
        { body: [{ x: 5, y: 5 }], direction: 'Right' },
        { body: [{ x: 14, y: 14 }], direction: 'Left' }
    ];
}

function moveSnake(snake) {
    const head = { ...snake.body[0] };
    switch (snake.direction) {
        case 'Up': head.y -= 1; break;
        case 'Down': head.y += 1; break;
        case 'Left': head.x -= 1; break;
        case 'Right': head.x += 1; break;
    }
    snake.body.unshift(head);
    snake.body.pop();
}

function checkCollision(snakes) {
    const head0 = snakes[0].body[0];
    const head1 = snakes[1].body[0];

    // Tête contre tête
    if (head0.x === head1.x && head0.y === head1.y) {
        return 'draw';
    }

    // Collision avec soi-même
    for (let i = 1; i < snakes[0].body.length; i++) {
        if (head0.x === snakes[0].body[i].x && head0.y === snakes[0].body[i].y) return 'blue';
    }
    for (let i = 1; i < snakes[1].body.length; i++) {
        if (head1.x === snakes[1].body[i].x && head1.y === snakes[1].body[i].y) return 'green';
    }

    // Collision avec l'autre corps
    for (let part of snakes[1].body) {
        if (head0.x === part.x && head0.y === part.y) return 'blue';
    }
    for (let part of snakes[0].body) {
        if (head1.x === part.x && head1.y === part.y) return 'green';
    }

    // Collision avec mur
    if (head0.x < 0 || head0.x >= 800/40 || head0.y < 0 || head0.y >= 800/40) return 'blue';
    if (head1.x < 0 || head1.x >= 800/40 || head1.y < 0 || head1.y >= 800/40) return 'green';

    return null;
}

function updateRoom(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.snakes.forEach(moveSnake);

    const result = checkCollision(room.snakes);
    if (result) {
        clearInterval(room.interval);
        io.to(roomCode).emit('gameOver', result);
        return;
    }

    room.snakes.forEach(snake => {
        const head = snake.body[0];
        if (head.x === room.food.x && head.y === room.food.y) {
            snake.body.push({ ...snake.body[snake.body.length - 1] });
            room.food = createFood();
        }
    });

    io.to(roomCode).emit('updateGame', {
        snakes: room.snakes,
        food: room.food,
    });
}

io.on('connection', (socket) => {
    console.log('Nouvelle connexion');

    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);

        if (!rooms[roomCode]) {
            rooms[roomCode] = { players: [], snakes: [], food: createFood(), interval: null };
        }

        rooms[roomCode].players.push(socket.id);

        if (rooms[roomCode].players.length === 2) {
            rooms[roomCode].snakes = createInitialSnakes();
            io.to(roomCode).emit('startGame', {
                initialFood: rooms[roomCode].food,
                initialSnakes: rooms[roomCode].snakes
            });

            rooms[roomCode].interval = setInterval(() => {
                updateRoom(roomCode);
            }, 150);
        } else {
            socket.emit('waiting');
        }
    });

    socket.on('whoAmI', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const index = room.players.indexOf(socket.id);
        socket.emit('youAre', index);
    });

    socket.on('move', ({ roomCode, direction, playerIndex }) => {
        const room = rooms[roomCode];
        if (!room) return;

        const currentDirection = room.snakes[playerIndex].direction;
        if (isValidMove(currentDirection, direction)) {
            room.snakes[playerIndex].direction = direction;
        }
    });

    socket.on('disconnect', () => {
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            room.players = room.players.filter(id => id !== socket.id);
            if (room.players.length === 0) {
                clearInterval(room.interval);
                delete rooms[roomCode];
            }
        }
    });
});

function isValidMove(current, next) {
    return !(
        (current === 'Up' && next === 'Down') ||
        (current === 'Down' && next === 'Up') ||
        (current === 'Left' && next === 'Right') ||
        (current === 'Right' && next === 'Left')
    );
}

http.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur lancé sur http://0.0.0.0:${PORT}`);
});
