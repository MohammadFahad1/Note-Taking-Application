import express from 'express';
import {
  createNote,
  listNotes,
  getNoteById,
  updateNote,
  deleteNote
} from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.post('/', createNote);
router.get('/', listNotes);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;

