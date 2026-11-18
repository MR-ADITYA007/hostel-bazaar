import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    usn: {
      type: String,
      required: true,
      unique: true,
      set: (v) => v.toUpperCase(),
      validate: {
        validator: (v) => /^1MS(23|24|25|26)[A-Z]{2,3}\d{3}$/.test(v),
        message: 'Invalid USN format',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

export default User;
