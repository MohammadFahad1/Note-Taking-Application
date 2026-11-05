import mongoose from 'mongoose';
import Post from '../models/Post.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';

export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const posts = await Post.aggregate([
      {
        $match: {
          author: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $project: {
          title: 1,
          content: 1,
          createdAt: 1,
          updatedAt: 1,
          'author._id': 1,
          'author.name': 1,
          'author.email': 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const post = await Post.create({
      title,
      content,
      author: req.user._id
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'name email');

    return res.status(201).json(populatedPost);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listPosts = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);

    const [posts, totalCount] = await Promise.all([
      Post.find()
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments()
    ]);

    return res.json(buildPaginatedResponse(posts, totalCount, page, limit));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

