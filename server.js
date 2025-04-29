const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 3000;

app.use(express.static('public'));

let rooms = {};

io.on('connection', (socket) => {
    console.log('Nouvelle connexion');

    socket.on('joinRoom', (roomCode) => {
        socket.join(roomCode);
        console.log(`Joueur dans la room ${roomCode}`);

        if (!rooms[roomCode]) {
            rooms[roomCode] = [];
        }

        rooms[roomCode].push(socket.id);

        if (rooms[roomCode].length === 2) {
            io.to(roomCode).emit('startGame');
        } else {
            socket.emit('waiting');
        }
    });

    socket.on('move', (data) => {
        socket.to(data.roomCode).emit('opponentMove', data);
    });

    socket.on('disconnect', () => {
        console.log('Déconnexion');
    });
});

http.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur lancé sur http://0.0.0.0:${PORT}`);
});
