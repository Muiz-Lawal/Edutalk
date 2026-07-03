import express from 'express';
import {
  createReview,
  getClassReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  getReviewStats,
} from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create a new review
router.post('/', authenticateToken, createReview);

// Get reviews for a specific class
router.get('/class/:classId', getClassReviews);

// Get reviews by current user
router.get('/my-reviews', authenticateToken, getUserReviews);

// Get review statistics for a class
router.get('/stats/:classId', getReviewStats);

// Update a review
router.put('/:id', authenticateToken, updateReview);

// Delete a review
router.delete('/:id', authenticateToken, deleteReview);

export default router;