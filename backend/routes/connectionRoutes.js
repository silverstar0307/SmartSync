const express = require('express');
const router = express.Router();
const { 
  sendRequest, 
  acceptRequest, 
  declineRequest,
  disconnectConnection,
  blockUser,
  unblockUser,
  getConnections,
  getDirectMessages,
  sendDirectMessage
} = require('../controllers/connectionController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getConnections);
router.post('/request', authenticateToken, sendRequest);
router.post('/request/:id/accept', authenticateToken, acceptRequest);
router.post('/request/:id/decline', authenticateToken, declineRequest);

// Disconnect & Block Routes
router.post('/disconnect/:id', authenticateToken, disconnectConnection);
router.post('/block/:id', authenticateToken, blockUser);
router.post('/unblock/:id', authenticateToken, unblockUser);

// Direct Messages
router.get('/chat/:friendId', authenticateToken, getDirectMessages);
router.post('/chat/:friendId', authenticateToken, sendDirectMessage);

module.exports = router;
