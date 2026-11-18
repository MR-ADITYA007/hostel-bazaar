import Item from '../models/Item.model.js';
import Conversation from '../models/Conversation.model.js';
import Message from '../models/Message.model.js';

export const createOrFetchConversation = async (req, res) => {
  try {
    const { itemId } = req.body;

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot chat with yourself' });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { item: itemId, buyer: req.user._id },
      { $setOnInsert: { item: itemId, buyer: req.user._id, seller: item.seller } },
      { upsert: true, new: true, runValidators: true }
    );

    await conversation
      .populate('item', 'title imageUrl status')
      .then((c) => c.populate('buyer', 'usn name'))
      .then((c) => c.populate('seller', 'usn name'));

    return res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getInbox = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      $or: [{ buyer: req.user._id }, { seller: req.user._id }],
    })
      .populate('item', 'title imageUrl status')
      .populate('buyer', 'usn name')
      .populate('seller', 'usn name')
      .sort({ updatedAt: -1 });

    return res.status(200).json({ success: true, data: conversations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const userId = req.user._id.toString();
    const isBuyer = conversation.buyer.toString() === userId;
    const isSeller = conversation.seller.toString() === userId;
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 30;

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'usn name')
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: messages,
      pagination: { page, limit },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const postMessage = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const userId = req.user._id.toString();
    const isBuyer = conversation.buyer.toString() === userId;
    const isSeller = conversation.seller.toString() === userId;
    if (!isBuyer && !isSeller) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!req.body.text || !req.body.text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }

    const message = new Message({
      conversation: req.params.id,
      sender: req.user._id,
      text: req.body.text,
    });
    await message.save();

    conversation.lastMessage = req.body.text;
    await conversation.save();

    await message.populate('sender', 'usn name');

    return res.status(201).json({ success: true, data: message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
