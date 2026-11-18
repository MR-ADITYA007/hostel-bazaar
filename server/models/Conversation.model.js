import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ item: 1, buyer: 1 }, { unique: true });
ConversationSchema.index({ buyer: 1, updatedAt: -1 });
ConversationSchema.index({ seller: 1, updatedAt: -1 });

const Conversation = mongoose.model('Conversation', ConversationSchema);

export default Conversation;
