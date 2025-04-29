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

function updateRoom(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    room.snakes.forEach(moveSnake);

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
