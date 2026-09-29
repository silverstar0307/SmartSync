const { pool } = require('../config/database');
const { getCommunityRecommendations, getPeopleRecommendations } = require('../services/openaiService');

const getRecommendedCommunities = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile
    const userRes = await pool.query('SELECT username, interests, joined_communities FROM users WHERE id = $1', [userId]);
    const userProfile = userRes.rows[0];
    const joinedCommunities = userProfile?.joined_communities || [];

    // Get pending community join requests for this user
    const pendingReqsRes = await pool.query(
      "SELECT community_id FROM community_join_requests WHERE user_id = $1 AND status = 'pending'",
      [userId]
    );
    const pendingCommunityIds = pendingReqsRes.rows.map(r => r.community_id);

    const excludedCommunityIds = new Set([...joinedCommunities, ...pendingCommunityIds]);

    // Get all available communities
    const communitiesRes = await pool.query('SELECT id, name, description, domain, total_members, tags, members FROM communities WHERE is_public = TRUE');
    
    // Filter out communities where user is already joined, a member, or has pending request
    const availableCommunities = communitiesRes.rows.filter(c => {
      if (excludedCommunityIds.has(c.id)) return false;
      if (Array.isArray(c.members) && c.members.includes(userId)) return false;
      return true;
    });

    const recommendations = await getCommunityRecommendations(userProfile, availableCommunities);
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error generating community recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getRecommendedPeople = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user profile
    const userRes = await pool.query('SELECT username, interests, friends FROM users WHERE id = $1', [userId]);
    const userProfile = userRes.rows[0];
    const friendsList = userProfile?.friends || [];

    // Get user IDs with pending or accepted connection requests
    const connReqsRes = await pool.query(
      `SELECT from_user_id, to_user_id FROM connection_requests 
       WHERE (from_user_id = $1 OR to_user_id = $1) AND status IN ('pending', 'accepted')`,
      [userId]
    );

    const excludedUserIds = new Set([userId, ...friendsList]);
    connReqsRes.rows.forEach(r => {
      if (r.from_user_id === userId) excludedUserIds.add(r.to_user_id);
      if (r.to_user_id === userId) excludedUserIds.add(r.from_user_id);
    });

    const excludedArray = Array.from(excludedUserIds);

    // Get other students excluding connected users, self, and pending requests
    const studentsRes = await pool.query(
      'SELECT id, username, interests, class FROM users WHERE NOT (id = ANY($1)) LIMIT 100',
      [excludedArray]
    );
    const availableStudents = studentsRes.rows;

    const recommendations = await getPeopleRecommendations(userProfile, availableStudents);
    
    // Ensure every recommendation has studentId
    const formattedRecs = recommendations.map(rec => {
      if (!rec.studentId) {
        const matchedStudent = availableStudents.find(s => s.username === rec.studentName);
        if (matchedStudent) {
          rec.studentId = matchedStudent.id;
        }
      }
      return rec;
    });

    res.json(formattedRecs);
  } catch (error) {
    console.error('Error generating people recommendations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getRecommendedCommunities, getRecommendedPeople };
