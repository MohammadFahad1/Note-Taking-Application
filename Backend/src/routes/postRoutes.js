import express from 'express';
import {
  createPost,
  listPosts,
  getPostById,
  getPostsByUser
} from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listPosts);
router.get('/user/:userId', getPostsByUser);
router.get('/:id', getPostById);
router.post('/', protect, createPost);

export default router;

