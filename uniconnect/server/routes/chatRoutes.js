import express from 'express';
import { createGroup, addGroupMember, getChatHistory, getUserChats, getGroupMembers, removeGroupMember, leaveGroup, deleteGroup } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Ensure all chat routes are private

router.post('/groups', createGroup);
router.post('/groups/add', addGroupMember);
router.get('/groups/:id/members', getGroupMembers);
router.delete('/groups/:groupId/members/:userId', removeGroupMember);
router.delete('/groups/:groupId/leave', leaveGroup);
router.delete('/groups/:groupId', deleteGroup);
router.get('/groups/user-groups', getUserChats);
router.get('/history', getChatHistory);
router.get('/connections', getUserChats);

export default router;
