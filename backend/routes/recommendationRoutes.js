const express = require('express');
const router = express.Router();
const { getRecommendedCommunities, getRecommendedPeople } = require('../controllers/recommendationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/communities', authenticateToken, getRecommendedCommunities);
router.get('/people', authenticateToken, getRecommendedPeople);

module.exports = router;
