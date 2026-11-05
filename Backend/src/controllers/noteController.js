import Note from '../models/Note.js';
import { getPagination, buildPaginatedResponse } from '../utils/pagination.js';

export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = await Note.create({
      title,
      content,
      user: req.user._id
    });

    return res.status(201).json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const listNotes = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const isAdmin = req.user.role === 'admin';
    const viewAll = isAdmin && req.query.all === 'true';

    const filter = viewAll ? {} : { user: req.user._id };

    const [notes, totalCount] = await Promise.all([
      Note.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Note.countDocuments(filter)
    ]);

    return res.json(buildPaginatedResponse(notes, totalCount, page, limit));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('user', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const isOwner = note.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const isOwner = note.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (title) note.title = title;
    if (content) note.content = content;

    await note.save();

    return res.json(note);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const isOwner = note.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Note.findByIdAndDelete(req.params.id);

    return res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

