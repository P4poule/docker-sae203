const express = require('express');
const app     = express();
const http    = require('http').createServer(app);
const io      = require('socket.io')(http);

const PORT = 8023;
app.use(express.static('public'));

let rooms = {};

/**
 * Génère une pomme aléatoire sur une grille de 20×20.
 */
function createFood() {
  const cells = 20;
  return {
    x: Math.floor(Math.random() * cells),
    y: Math.floor(Math.random() * cells)
  };
}

/**
 * Initialise deux serpents pour la room.
 */
function createInitialSnakes() {
  return [
    { body: [{ x: 5, y: 5 }], direction: 'Right' },   // Joueur vert
    { body: [{ x: 14, y: 14 }], direction: 'Left' }   // Joueur bleu
  ];
}

/**
 * Déplace un serpent d’une case selon sa direction actuelle.
 */
function moveSnake(snake) {
  const head = { ...snake.body[0] };
  switch (snake.direction) {
    case 'Up':    head.y--; break;
    case 'Down':  head.y++; break;
    case 'Left':  head.x--; break;
    case 'Right': head.x++; break;
  }
  snake.body.unshift(head);
  snake.body.pop();
}

/**
 * Vérifie toutes les collisions pour deux serpents.
 * @returns 'draw' si tête-à-tête, 'green' ou 'blue' si un joueur perd, ou null sinon.
 */
function checkCollision(snakes) {
  const h0 = snakes[0].body[0];
  const h1 = snakes[1].body[0];

  // Tête-à-tête
  if (h0.x === h1.x && h0.y === h1.y) return 'draw';

  // Tête contre son propre corps
  for (let i = 1; i < snakes[0].body.length; i++) {
    if (h0.x === snakes[0].body[i].x && h0.y === snakes[0].body[i].y) {
      return 'blue';
    }
  }
  for (let i = 1; i < snakes[1].body.length; i++) {
    if (h1.x === snakes[1].body[i].x && h1.y === snakes[1].body[i].y) {
      return 'green';
    }
  }

  // Tête contre le corps de l’autre serpent
  for (let part of snakes[1].body) {
    if (h0.x === part.x && h0.y === part.y) {
      return 'blue';
    }
  }
  for (let part of snakes[0].body) {
    if (h1.x === part.x && h1.y === part.y) {
      return 'green';
    }
  }

  // Collision avec les murs (grille 20×20)
  if (h0.x < 0 || h0.x >= 20 || h0.y < 0 || h0.y >= 20) return 'blue';
  if (h1.x < 0 || h1.x >= 20 || h1.y < 0 || h1.y >= 20) return 'green';

  return null;
}

/**
 * Boucle serveur : déplace, gère collisions, nourriture, et notifie les clients.
 */
function updateRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  room.snakes.forEach(moveSnake);

  const result = checkCollision(room.snakes);
  if (result) {
    clearInterval(room.interval);
    if (result !== 'draw') {
      room.scores[result] += 1;
      io.to(roomCode).emit('scoreUpdate', room.scores);
    }
    io.to(roomCode).emit('gameOver', result);
    return;
  }

  // Gérer la nourriture
  room.snakes.forEach(snake => {
    const head = snake.body[0];
    if (head.x === room.food.x && head.y === room.food.y) {
      snake.body.push({ ...snake.body[snake.body.length - 1] });
      room.food = createFood();
    }
  });

  io.to(roomCode).emit('updateGame', {
    snakes: room.snakes,
    food:   room.food
  });
}

/**
 * Empêche les mouvements en demi-tour.
 */
function isValidMove(current, next) {
  return !(
    (current === 'Up'    && next === 'Down') ||
    (current === 'Down'  && next === 'Up') ||
    (current === 'Left'  && next === 'Right') ||
    (current === 'Right' && next === 'Left')
  );
}

io.on('connection', socket => {
  console.log('Client connecté:', socket.id);

  // Rejoindre une salle
  socket.on('joinRoom', roomCode => {
    socket.join(roomCode);
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: [],
        snakes: [],
        food: createFood(),
        interval: null,
        ready: 0,
        scores: { green: 0, blue: 0 }
      };
    }
    const room = rooms[roomCode];
    if (!room.players.includes(socket.id)) {
      room.players.push(socket.id);
    }

    // Si deux joueurs sont présents, on démarre
    if (room.players.length === 2) {
      room.snakes = createInitialSnakes();
      room.ready  = 0;
      io.to(roomCode).emit('startGame', {
        initialFood:   room.food,
        initialSnakes: room.snakes,
        scores:        room.scores
      });
      // Attendre 4s pour laisser le compte-à-rebours client s'afficher
      setTimeout(() => {
        room.interval = setInterval(() => updateRoom(roomCode), 150);
      }, 4000);
    } else {
      socket.emit('waiting');
    }
  });

  // Qui suis-je ? (0 = vert, 1 = bleu)
  socket.on('whoAmI', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;
    socket.emit('youAre', room.players.indexOf(socket.id));
  });

  // Mouvement du serpent
  socket.on('move', ({ roomCode, direction, playerIndex }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const current = room.snakes[playerIndex].direction;
    if (isValidMove(current, direction)) {
      room.snakes[playerIndex].direction = direction;
    }
  });

  // Rejouer : chaque joueur clique -> on attend les deux
  socket.on('replay', roomCode => {
    const room = rooms[roomCode];
    if (!room) return;
    room.ready++;
    if (room.ready === 2) {
      clearInterval(room.interval);
      room.snakes = createInitialSnakes();
      room.food   = createFood();
      room.ready  = 0;
      io.to(roomCode).emit('startGame', {
        initialFood:   room.food,
        initialSnakes: room.snakes,
        scores:        room.scores
      });
      setTimeout(() => {
        room.interval = setInterval(() => updateRoom(roomCode), 150);
      }, 4000);
    }
  });

  // Déconnexion : nettoyage de la room si vide
  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
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

// Lancement du serveur
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur en écoute sur http://0.0.0.0:${PORT}`);
});
