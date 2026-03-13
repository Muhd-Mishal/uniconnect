import express from 'express';
import { getResources, addResource, deleteResource } from '../controllers/resourceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getResources).post(protect, admin, addResource);

router.route('/:id').delete(protect, admin, deleteResource);

export default router;
