import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // JWT authentication on handshake
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const cookies = Object.fromEntries(
        cookieHeader.split(';').map((c) => {
          const [k, ...v] = c.trim().split('=');
          return [k.trim(), decodeURIComponent(v.join('='))];
        })
      );
      const token = cookies['token'];
      if (!token) return next(new Error('Authentication error: no token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join_conversation', ({ conversationId }) => {
      socket.join(conversationId);
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(conversationId);
    });

    socket.on('send_message', async ({ conversationId, text }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        const userId = socket.user._id.toString();
        const isBuyer = conversation.buyer.toString() === userId;
        const isSeller = conversation.seller.toString() === userId;
        if (!isBuyer && !isSeller) {
          return socket.emit('error', { message: 'Not authorized' });
        }

        if (!text || !text.trim()) {
          return socket.emit('error', { message: 'Message text is required' });
        }

        const message = new Message({
          conversation: conversationId,
          sender: socket.user._id,
          text,
        });
        await message.save();

        conversation.lastMessage = text;
        await conversation.save();

        await message.populate('sender', 'usn name');

        io.to(conversationId).emit('receive_message', {
          _id: message._id,
          conversationId,
          sender: {
            _id: message.sender._id,
            usn: message.sender.usn,
            name: message.sender.name,
          },
          text: message.text,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
