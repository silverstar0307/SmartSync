const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createPost, getCommunityPosts, getUserPosts, getPostReplies, likePost, deletePost, uploadPostMedia } = require('../controllers/postController');
const { authenticateToken } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/', authenticateToken, createPost);
router.post('/upload', authenticateToken, upload.single('file'), uploadPostMedia);
router.get('/community/:communityId', authenticateToken, getCommunityPosts);
router.get('/user/:userId', authenticateToken, getUserPosts);
router.get('/:postId/replies', authenticateToken, getPostReplies);
router.post('/:postId/like', authenticateToken, likePost);
router.delete('/:postId', authenticateToken, deletePost);

module.exports = router;
