const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
  getUserProfile, 
  updateUserProfile, 
  updateUserInterests, 
  uploadUserProfilePhoto, 
  searchUsersAndCommunities,
  getUserCommunities,
  getUserSolutions,
  getUserDashboardFeed
} = require('../controllers/userController');
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

const upload = multer({ storage });

router.get('/search/global', authenticateToken, searchUsersAndCommunities);
router.get('/:userId/communities', authenticateToken, getUserCommunities);
router.get('/:userId/solutions', authenticateToken, getUserSolutions);
router.get('/:userId/dashboard-feed', authenticateToken, getUserDashboardFeed);
router.get('/:userId', authenticateToken, getUserProfile);
router.put('/:userId', authenticateToken, updateUserProfile);
router.put('/:userId/interests', authenticateToken, updateUserInterests);
router.post('/:userId/profile-photo', authenticateToken, upload.single('profile_photo'), uploadUserProfilePhoto);

module.exports = router;

