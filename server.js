const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 8023;
app.use(express.static('public'));

let rooms = {};

/**
 * Génère des coordonnées aléatoires pour la nourriture
 */
function createFood() {
    const scale = 40;
    const cells = 800 / scale; // 20 cases de 40px
    return {
        x: Math.floor(Math.random() * cells),
        y: Math.floor(Math.random() * cells),
    };
}

/**
 * Crée les deux serpents initiaux
 */
function createInitialSnakes() {
    return [
        { body: [{ x: 5, y: 5 }], direction: 'Right' },  // Joueur vert
        { body: [{ x: 14, y: 14 }], direction: 'Left' }  // Joueur bleu
    ];
}

/**
 * Déplace un serpent d'une case selon sa direction
 */
function moveSnake(snake) {
    const head = { ...snake.body[0] };
    switch (snake.direction) {
        case 'Up':    head.y -= 1; break;
        case 'Down':  head.y += 1; break;
        case 'Left':  head.x -= 1; break;
        case 'Right': head.x += 1; break;
    }
    snake.body.unshift(head);
    snake.body.pop();
}

/**
 * Vérifie toutes les collisions possibles et renvoie :
 *  - 'draw' en cas de tête-à-tête
 *  - 'green' si le joueur vert perd
 *  - 'blue' si le joueur bleu perd
 *  - null si pas de collision
 */
function checkCollision(snakes) {
    const head0 = snakes[0].body[0];
    const head1 = snakes[1].body[0];

    // Tête contre tête
    if (head0.x === head1.x && head0.y === head1.y) {
        return 'draw';
    }

    // Tête contre son propre corps
    for (let i = 1; i < snakes[0].body.length; i++) {
        if (head0.x === snakes[0].body[i].x && head0.y === snakes[0].body[i].y) {
            return 'blue';
        }
    }
    for (let i = 1; i < snakes[1].body.length; i++) {
        if (head1.x === snakes[1].body[i].x && head1.y === snakes[1].body[i].y) {
            return 'green';
        }
    }

    // Tête contre le corps de l'autre serpent
    for (let part of snakes[1].body) {
        if (head0.x === part.x && head0.y === part.y) {
            return 'blue';
        }
    }
    for (let part of snakes[0].body) {
        if (head1.x === part.x && head1.y === part.y) {
            return 'green';
        }
    }

    // Collision avec les murs (20×20)
    if (head0.x < 0 || head0.x >= 20 || head0.y < 0 || head0.y >= 20) {
        return 'blue';
    }
    if (head1.x < 0 || head1.x >= 20 || head1.y < 0 || head1.y >= 20) {
        return 'green';
    }

    return null;
}

/**
 * Boucle de logique : déplace les serpents, gère collisions et nourriture,
 * et émet l'état mis à jour aux clients.
 */
function updateRoom(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    // Déplacer
    room.snakes.forEach(moveSnake);

    // Collision ?
    const result = checkCollision(room.snakes);
    if (result) {
        clearInterval(room.interval);
        io.to(roomCode).emit('gameOver', result);
        return;
    }

    // Nourriture
    room.snakes.forEach(snake => {
        const head = snake.body[0];
        if (head.x === room.food.x && head.y === room.food.y) {
            // Grandir et régénérer la pomme
            snake.body.push({ ...snake.body[snake.body.length - 1] });
            room.food = createFood();
        }
    });

    // Envoyer l'état aux clients
    io.to(roomCode).emit('updateGame', {
        snakes: room.snakes,
        food: room.food,
    });
}

/**
 * Validation de déplacement pour éviter les demi-tours
 */
function isValidMove(current, next) {
    return !(
        (current === 'Up' && next === 'Down') ||
        (current === 'Down' && next === 'Up') ||
        (current === 'Left' && next === 'Right') ||
        (current === 'Right' && next === 'Left')
    );
}

/**
 * Gestion des connexions
 */
io.on('connection', (socket) => {
    console.log('Nouvelle connexion:', socket.id);

    /**
     * Rejoindre une room
     */
    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);

        // Créer la room si nécessaire
        if (!rooms[roomCode]) {
            rooms[roomCode] = {
                players: [],
                snakes: [],
                food: createFood(),
                interval: null,
                ready: 0
            };
        }
        const room = rooms[roomCode];

        // Ajouter le joueur
        if (!room.players.includes(socket.id)) {
            room.players.push(socket.id);
        }

        // S'il y a deux joueurs, on lance la partie
        if (room.players.length === 2) {
            // Initialisation serpents + compteur 'ready'
            room.snakes = createInitialSnakes();
            room.ready = 0;

            // Envoyer startGame aux clients (pour le compte à rebours)
            io.to(roomCode).emit('startGame', {
                initialFood: room.food,
                initialSnakes: room.snakes
            });

            // Après 4 s, on commence à bouger
            setTimeout(() => {
                room.interval = setInterval(() => updateRoom(roomCode), 150);
            }, 4000);
        } else {
            // Un seul joueur : on le met en attente
            socket.emit('waiting');
        }
    });

    /**
     * Qui suis-je ? (0 = vert, 1 = bleu)
     */
    socket.on('whoAmI', ({ roomCode }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const index = room.players.indexOf(socket.id);
        socket.emit('youAre', index);
    });

    /**
     * Mouvement du joueur
     */
    socket.on('move', ({ roomCode, direction, playerIndex }) => {
        const room = rooms[roomCode];
        if (!room) return;
        const current = room.snakes[playerIndex].direction;
        if (isValidMove(current, direction)) {
            room.snakes[playerIndex].direction = direction;
        }
    });

    /**
     * Demande de rejouer (chaque joueur clique sur Recommencer)
     */
    socket.on('replay', (roomCode) => {
        const room = rooms[roomCode];
        if (!room) return;
        room.ready++;

        // Quand les deux sont prêts, réinitialiser et relancer
        if (room.ready === 2) {
            clearInterval(room.interval);
            room.snakes = createInitialSnakes();
            room.food = createFood();
            room.ready = 0;

            io.to(roomCode).emit('startGame', {
                initialFood: room.food,
                initialSnakes: room.snakes
            });
            setTimeout(() => {
                room.interval = setInterval(() => updateRoom(roomCode), 150);
            }, 4000);
        }
    });

    /**
     * Déconnexion : on nettoie la room si vide
     */
    socket.on('disconnect', () => {
        console.log('Déconnexion:', socket.id);
        for (let rc in rooms) {
            const room = rooms[rc];
            room.players = room.players.filter(id => id !== socket.id);
            if (room.players.length === 0) {
                clearInterval(room.interval);
                delete rooms[rc];
            }
        }
    });
});

// Démarrage du serveur HTTP
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur lancé sur http://0.0.0.0:${PORT}`);
});
