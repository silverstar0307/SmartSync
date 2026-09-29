const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  createCommunity, 
  requestCommunity,
  approveCommunity,
  denyCommunity,
  getCommunities, 
  getCommunityById, 
  requestToJoin,
  updateCommunity,
  uploadCommunityLogo,
  searchCommunityMembers,
  addCommunityMember,
  inviteToCommunity,
  acceptCommunityInvitation,
  getCommunityMessages,
  sendCommunityMessage,
  uploadCommunityMessageFile,
  acceptJoinRequest,
  declineJoinRequest,
  leaveCommunity,
  deleteCommunity
} = require('../controllers/communityController');
const { authenticateToken } = require('../middleware/auth');

// Multer Setup
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit (allows videos)
});

// Community Creation & Approval Flow
router.post('/request', authenticateToken, requestCommunity);
router.get('/approve', approveCommunity);
router.get('/deny', denyCommunity);

router.post('/', authenticateToken, createCommunity);
router.get('/', authenticateToken, getCommunities);
router.get('/:id', authenticateToken, getCommunityById);
router.post('/:communityId/join-request', authenticateToken, requestToJoin);

// Admin / Membership Routes
router.put('/:id', authenticateToken, updateCommunity);
router.delete('/:id', authenticateToken, deleteCommunity);
router.post('/:id/leave', authenticateToken, leaveCommunity);
router.post('/:id/logo', authenticateToken, upload.single('logo'), uploadCommunityLogo);
router.get('/:id/search-members', authenticateToken, searchCommunityMembers);
router.post('/:id/members', authenticateToken, addCommunityMember);
router.post('/:id/invite', authenticateToken, inviteToCommunity);
router.post('/:id/accept-invitation', authenticateToken, acceptCommunityInvitation);

// Messaging Routes
router.get('/:id/messages', authenticateToken, getCommunityMessages);
router.post('/:id/messages', authenticateToken, sendCommunityMessage);
router.post('/:id/messages/upload', authenticateToken, upload.single('file'), uploadCommunityMessageFile);

// Join Requests
router.post('/join-requests/:requestId/accept', authenticateToken, acceptJoinRequest);
router.post('/join-requests/:requestId/decline', authenticateToken, declineJoinRequest);

module.exports = router;
