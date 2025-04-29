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

    let gameOver = false;
    let loserIndex = null;
    let isDraw = false;

    const [snake1, snake2] = room.snakes;
    const head1 = snake1.body[0];
    const head2 = snake2.body[0];

    // Vérifie si les têtes se touchent (match nul)
    if (head1.x === head2.x && head1.y === head2.y) {
        gameOver = true;
        isDraw = true;
    }

    if (!isDraw) {
        room.snakes.forEach((snake, i) => {
            const head = snake.body[0];

            // Collision avec murs
            if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
                gameOver = true;
                loserIndex = i;
            }

            // Collision avec soi-même
            snake.body.slice(1).forEach(segment => {
                if (head.x === segment.x && head.y === segment.y) {
                    gameOver = true;
                    loserIndex = i;
                }
            });

            // Collision avec l'autre serpent
            const otherSnake = room.snakes[1 - i];
            otherSnake.body.forEach(segment => {
                if (head.x === segment.x && head.y === segment.y) {
                    gameOver = true;
                    loserIndex = i;
                }
            });

            // Manger une pomme
            if (head.x === room.food.x && head.y === room.food.y) {
                snake.body.push({ ...snake.body[snake.body.length - 1] });
                room.food = createFood();
            }
        });
    }

    if (gameOver) {
        clearInterval(room.interval);
        io.to(roomCode).emit('gameOver', { loserIndex, isDraw });
        delete rooms[roomCode];
    } else {
        io.to(roomCode).emit('updateGame', {
            snakes: room.snakes,
            food: room.food,
        });
    }
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
        console.log('Déconnexion');
        for (const roomCode in rooms) {
            const room = rooms[roomCode];
            room.players = room.players.filter(id => id !== socket.id);
    
            // Nettoyer l'intervalle dès qu'un joueur se déconnecte
            if (room.interval) {
                clearInterval(room.interval);
                room.interval = null;  // Empêcher l'accumulation
            }
    
            if (room.players.length === 0) {
                delete rooms[roomCode];
            }
        }
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
