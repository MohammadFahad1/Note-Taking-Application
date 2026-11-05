import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';

export const getUsersByInterests = async (req, res) => {
  try {
    const results = await User.aggregate([
      { $unwind: '$interests' },
      {
        $group: {
          _id: '$interests',
          users: {
            $push: {
              _id: '$_id',
              name: '$name',
              email: '$email',
              role: '$role'
            }
          },
          userCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          interest: '$_id',
          userCount: 1,
          users: 1
        }
      },
      { $sort: { interest: 1 } }
    ]);

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const [users, totalCount] = await Promise.all([
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    return res.json(buildPaginatedResponse(users, totalCount, page, limit));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, interests } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      interests: Array.isArray(interests) ? interests : []
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, interests, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (Array.isArray(interests)) user.interests = interests;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateMyInterests = async (req, res) => {
  try {
    const { interests } = req.body;
    if (!Array.isArray(interests)) {
      return res.status(400).json({ message: 'Interests must be an array of strings' });
    }

    const user = await User.findById(req.user._id);
    user.interests = interests;
    await user.save();

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      interests: user.interests
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

