const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

let io;

// Initialize Socket.io
const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user-specific room
    socket.join(socket.userId);

    // Join admin room if user is admin
    if (socket.userRole === 'admin' || socket.userRole === 'superadmin') {
      socket.join('admin');
    }

    // Handle order updates subscription
    socket.on('subscribe_order_updates', (orderId) => {
      socket.join(`order_${orderId}`);
      console.log(`User ${socket.userId} subscribed to order ${orderId}`);
    });

    // Handle unsubscribe
    socket.on('unsubscribe_order_updates', (orderId) => {
      socket.leave(`order_${orderId}`);
      console.log(`User ${socket.userId} unsubscribed from order ${orderId}`);
    });

    // Handle typing indicator (for chat)
    socket.on('typing', (data) => {
      socket.to(data.room).emit('user_typing', {
        userId: socket.userId,
        isTyping: data.isTyping,
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Get io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(userId.toString()).emit(event, data);
  }
};

// Emit to admin room
const emitToAdmin = (event, data) => {
  if (io) {
    io.to('admin').emit(event, data);
  }
};

// Emit to all connected clients
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Emit to specific room
const emitToRoom = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

// Broadcast notification
const broadcastNotification = (notification) => {
  if (io) {
    if (notification.broadcast) {
      io.emit('notification', notification);
    } else if (notification.recipient) {
      io.to(notification.recipient.toString()).emit('notification', notification);
    }
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToAdmin,
  emitToAll,
  emitToRoom,
  broadcastNotification,
};
