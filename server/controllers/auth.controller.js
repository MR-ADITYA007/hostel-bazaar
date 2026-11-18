import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';

const USN_REGEX = /^1ms(23|24|25|26)[a-zA-Z]{2,3}\d{3}$/i;

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { usn, password, name } = req.body;

    if (!usn || !USN_REGEX.test(usn)) {
      return res.status(400).json({ success: false, message: 'Invalid USN format' });
    }

    // Check uniqueness against stored uppercase USN
    const existingUser = await User.findOne({ usn: usn.toUpperCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'USN already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Derive branch: letters between year digits and roll number (positions 5 to length-3)
    const usnUpper = usn.toUpperCase();
    const branch = usnUpper.slice(5, usnUpper.length - 3);

    const user = new User({ usn: usnUpper, password: hashedPassword, name, branch });
    await user.save();

    generateTokenAndSetCookie(res, user._id);

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        usn: user.usn,
        name: user.name,
        branch: user.branch,
      },
    });
  } catch (err) {
    console.error('register error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { usn, password } = req.body;

    if (!usn || !USN_REGEX.test(usn)) {
      return res.status(400).json({ success: false, message: 'Invalid USN format' });
    }

    const user = await User.findOne({ usn: usn.toUpperCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        usn: user.usn,
        name: user.name,
        branch: user.branch,
      },
    });
  } catch (err) {
    console.error('login error:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ success: true, message: 'Logged out' });
};

// GET /api/auth/me
export const getMe = (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
};
