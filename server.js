const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // update this to your frontend URL for security
    methods: ['GET', 'POST']
  }
});

// Map to track online users per room (optional)
const onlineUsers = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a chat room
  socket.on('joinRoom', ({ chatId, userId }) => {
    socket.join(chatId);
    console.log(`User ${userId} joined room ${chatId}`);

    // Track online user
    if (!onlineUsers[chatId]) onlineUsers[chatId] = new Set();
    onlineUsers[chatId].add(userId);

    // Broadcast to others in room that user is online
    socket.to(chatId).emit('userOnline', { userId });

    // Optionally send current online users list to this socket
    socket.emit('onlineUsers', Array.from(onlineUsers[chatId]));
  });

  // Typing indicator event
  socket.on('typing', ({ chatId, userId, isTyping }) => {
    // Broadcast typing status *including* the chatId
    socket.to(chatId).emit('typing', { chatId, userId, isTyping });
  });
  

  // Leaving a room (optional)
  socket.on('leaveRoom', ({ chatId, userId }) => {
    socket.leave(chatId);
    if (onlineUsers[chatId]) {
      onlineUsers[chatId].delete(userId);
      socket.to(chatId).emit('userOffline', { userId });
    }
  });

  // Handle disconnect cleanup
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove user from all rooms they were in
    // (To do this properly, you might need to track userId per socket)
    // Simplified example (needs enhancement for production)
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
