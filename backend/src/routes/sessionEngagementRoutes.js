import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getEngagement, createMessage, deleteMessage, toggleChat, createQuestion, voteQuestion,
  updateQuestion, createPoll, votePoll, updatePoll,
} from '../controllers/sessionEngagementController.js';

const router = express.Router();
router.use(authenticateToken);
router.get('/:sessionId', getEngagement);
router.post('/:sessionId/messages', createMessage);
router.delete('/:sessionId/messages/:messageId', deleteMessage);
router.patch('/:sessionId/chat', toggleChat);
router.post('/:sessionId/questions', createQuestion);
router.post('/:sessionId/questions/:questionId/vote', voteQuestion);
router.patch('/:sessionId/questions/:questionId', updateQuestion);
router.post('/:sessionId/polls', createPoll);
router.post('/:sessionId/polls/:pollId/vote', votePoll);
router.patch('/:sessionId/polls/:pollId', updatePoll);
export default router;
