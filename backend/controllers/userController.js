const { pool } = require('../config/database');

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;

    const result = await pool.query(
      'SELECT id, username, first_name, last_name, bio, profile_photo, cover_image, college_name, class, division, interests, joined_communities, created_at, total_posts, total_replies, friends, blocked_users FROM users WHERE id = $1', 
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = result.rows[0];

    // Check if target user has blocked the requester
    const targetBlockedList = profile.blocked_users || [];
    if (targetBlockedList.includes(requesterId)) {
      return res.status(403).json({
        isBlocked: true,
        username: profile.username,
        message: `${profile.username} blocked you`
      });
    }

    // Check if requester has blocked the target user
    const requesterRes = await pool.query(
      'SELECT blocked_users FROM users WHERE id = $1',
      [requesterId]
    );
    const requesterBlockedList = requesterRes.rows[0]?.blocked_users || [];

    // Determine connection status
    let connectionStatus = 'none';
    let connectionRequestId = null;

    if (parseInt(userId) === requesterId) {
      connectionStatus = 'self';
    } else if (requesterBlockedList.includes(parseInt(userId))) {
      connectionStatus = 'blocked_by_me';
    } else {
      const friendsList = profile.friends || [];
      if (friendsList.includes(requesterId)) {
        connectionStatus = 'connected';
      } else {
        // Check for pending request
        const requestRes = await pool.query(
          `SELECT id, from_user_id, status FROM connection_requests 
           WHERE ((from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1))
           AND status = 'pending'`,
          [requesterId, userId]
        );

        if (requestRes.rows.length > 0) {
          const reqItem = requestRes.rows[0];
          if (reqItem.from_user_id === requesterId) {
            connectionStatus = 'pending_sent';
          } else {
            connectionStatus = 'pending_received';
          }
          connectionRequestId = reqItem.id;
        }
      }
    }

    res.json({
      ...profile,
      connectionStatus,
      connectionRequestId
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Only allow users to update their own profile
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { first_name, last_name, bio, division, branch } = req.body;
    
    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, bio = $3, division = $4, college_name = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING id, username, first_name, last_name, bio, division, college_name, profile_photo`,
      [first_name, last_name, bio, division || null, branch || null, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error updating user profile' });
  }
};

const updateUserInterests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { interests } = req.body; // Expecting an array of strings
    
    const result = await pool.query(
      `UPDATE users 
       SET interests = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING id, interests`,
      [interests || [], userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user interests:', error);
    res.status(500).json({ message: 'Server error updating interests' });
  }
};

const uploadUserProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;

    if (parseInt(userId) !== requesterId) {
      return res.status(403).json({ message: 'Not authorized to upload photo for this user' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No photo file provided' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `UPDATE users SET profile_photo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, profile_photo`,
      [photoUrl, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading user profile photo:', error);
    res.status(500).json({ message: 'Server error uploading profile photo' });
  }
};

const searchUsersAndCommunities = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({ users: [], communities: [] });
    }

    const searchTerm = `%${q.trim()}%`;
    const interestSearchTerm = q.trim();

    // 1. Search Users (excluding password hash)
    const usersResult = await pool.query(
      `SELECT id, username, first_name, last_name, bio, profile_photo, college_name, class, division, interests 
       FROM users 
       WHERE username ILIKE $1 
          OR first_name ILIKE $1 
          OR last_name ILIKE $1 
          OR college_name ILIKE $1
          OR $2 = ANY(interests)
       LIMIT 10`,
      [searchTerm, interestSearchTerm]
    );

    // 2. Search Communities
    const userId = req.user.id;
    const communitiesResult = await pool.query(
      `SELECT id, name, slug, description, icon, domain, tags, total_members 
       FROM communities 
       WHERE (name ILIKE $1 OR description ILIKE $1 OR domain ILIKE $1)
         AND (is_public = TRUE OR $2 = ANY(members))
       LIMIT 10`,
      [searchTerm, userId]
    );

    res.json({
      users: usersResult.rows,
      communities: communitiesResult.rows
    });
  } catch (error) {
    console.error('Error performing global search:', error);
    res.status(500).json({ message: 'Server error performing search' });
  }
};

const getUserCommunities = async (req, res) => {
  try {
    const { userId } = req.params;
    const userRes = await pool.query('SELECT joined_communities FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const joinedIds = userRes.rows[0].joined_communities || [];
    if (joinedIds.length === 0) {
      return res.json([]);
    }
    const result = await pool.query(
      `SELECT id, name, slug, description, icon, banner, domain, tags, total_members 
       FROM communities 
       WHERE id = ANY($1::INTEGER[])
       ORDER BY total_members DESC`,
      [joinedIds]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user communities:', error);
    res.status(500).json({ message: 'Server error fetching user communities' });
  }
};

const getUserSolutions = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT 
         s.id, 
         s.title AS solution_title, 
         s.content AS solution_content, 
         s.media AS solution_media, 
         s.challenge_data AS solution_challenge_data, 
         s.created_at AS solution_created_at,
         s.like_count, 
         s.likes,
         c.id AS challenge_id, 
         c.title AS challenge_title, 
         c.content AS challenge_content, 
         c.challenge_data AS challenge_meta, 
         c.created_at AS challenge_created_at,
         comm.id AS community_id, 
         comm.name AS community_name, 
         comm.slug AS community_slug
       FROM posts s
       JOIN posts c ON s.parent_post_id = c.id
       LEFT JOIN communities comm ON s.community_id = comm.id
       WHERE s.author_id = $1 AND s.post_type = 'challenge_submission' AND s.is_deleted = FALSE
       ORDER BY s.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user solutions:', error);
    res.status(500).json({ message: 'Server error fetching user solutions' });
  }
};

const getUserDashboardFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      `WITH user_communities AS (
         SELECT unnest(joined_communities) AS community_id 
         FROM users 
         WHERE id = $1
       ),
       latest_activity AS (
         SELECT 
           'post' AS item_type,
           p.id AS item_id,
           p.community_id,
           p.author_id AS user_id,
           u.username AS author_name,
           p.content,
           p.created_at,
           p.like_count,
           p.reply_count,
           c.name AS community_name
         FROM posts p
         JOIN users u ON p.author_id = u.id
         JOIN communities c ON p.community_id = c.id
         JOIN user_communities uc ON p.community_id = uc.community_id
         WHERE p.parent_post_id IS NULL AND p.is_deleted = false
         
         UNION ALL
         
         SELECT 
           'message' AS item_type,
           m.id AS item_id,
           m.community_id,
           m.sender_id AS user_id,
           u.username AS author_name,
           m.content,
           m.created_at,
           0 AS like_count,
           0 AS reply_count,
           c.name AS community_name
         FROM community_messages m
         JOIN users u ON m.sender_id = u.id
         JOIN communities c ON m.community_id = c.id
         JOIN user_communities uc ON m.community_id = uc.community_id
       ),
       ranked_activity AS (
         SELECT *, ROW_NUMBER() OVER(PARTITION BY community_id ORDER BY created_at DESC) as rn
         FROM latest_activity
       )
       SELECT * FROM ranked_activity WHERE rn = 1 ORDER BY created_at DESC;`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching dashboard feed:', error);
    res.status(500).json({ message: 'Server error fetching dashboard feed' });
  }
};

module.exports = { 
  getUserProfile, 
  updateUserProfile, 
  updateUserInterests, 
  uploadUserProfilePhoto,
  searchUsersAndCommunities,
  getUserCommunities,
  getUserSolutions,
  getUserDashboardFeed
};

