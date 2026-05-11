import { Router } from 'express';
import { authenticateUser, registerUser } from '../controllers/authController';
import { createMeeting, getMeetings } from '../controllers/meetingController';
import { getActionItems, createActionItem } from '../controllers/actionItemController';

const router = Router();

// Authentication routes
router.post('/auth/register', registerUser);
router.post('/auth/login', authenticateUser);

// Meeting routes
router.post('/meetings', createMeeting);
router.get('/meetings', getMeetings);

// Action item routes
router.post('/action-items', createActionItem);
router.get('/action-items', getActionItems);

export default router;