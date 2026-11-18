import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Books',
        'Electronics',
        'Stationery',
        'Clothing',
        'Bicycles',
        'Lab Equipment',
        'Hostel Essentials',
        'Other',
      ],
    },
    condition: {
      type: String,
      required: true,
      enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
    },
    imageUrl: {
      type: String,
      required: true,
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Sold'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

ItemSchema.index({ status: 1, createdAt: -1 });
ItemSchema.index({ seller: 1 });
ItemSchema.index({ title: 'text', description: 'text' });

const Item = mongoose.model('Item', ItemSchema);

export default Item;
