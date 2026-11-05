import express from 'express';
import {
  getUsersByInterests,
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateMyInterests
} from '../controllers/userController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/interests', protect, getUsersByInterests);
router.put('/interests', protect, updateMyInterests);

router.use(protect, requireAdmin);
router.get('/', listUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;

