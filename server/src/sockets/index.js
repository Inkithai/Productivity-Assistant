const { Server } = require('socket.io');

const config = require('../config/env');
const { verifyAuthToken } = require('../utils/tokens');

let io = null;

function initSockets(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.clientOrigin },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) {
        throw new Error('missing token');
      }
      const payload = verifyAuthToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
  });

  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return false;
  io.to(`user:${String(userId)}`).emit(event, payload);
  return true;
}

function getIo() {
  return io;
}

module.exports = { initSockets, emitToUser, getIo };
