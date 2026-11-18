import express from 'express';
import protectRoute from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';
import {
  createItem,
  getFeed,
  getItem,
  updateItem,
  deleteItem,
  toggleStatus,
  getMyListings,
} from '../controllers/item.controller.js';

const router = express.Router();

router.get('/my', protectRoute, getMyListings);
router.get('/', getFeed);
router.get('/:id', getItem);
router.post('/', protectRoute, upload.single('image'), createItem);
router.put('/:id', protectRoute, upload.single('image'), updateItem);
router.delete('/:id', protectRoute, deleteItem);
router.patch('/:id/status', protectRoute, toggleStatus);

export default router;
