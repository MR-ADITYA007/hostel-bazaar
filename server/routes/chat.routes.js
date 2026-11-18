import express from 'express';
import protectRoute from '../middleware/auth.middleware.js';
import {
  createOrFetchConversation,
  getInbox,
  getMessages,
  postMessage,
} from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/conversations', protectRoute, createOrFetchConversation);
router.get('/conversations', protectRoute, getInbox);
router.get('/conversations/:id/messages', protectRoute, getMessages);
router.post('/conversations/:id/messages', protectRoute, postMessage);

export default router;
