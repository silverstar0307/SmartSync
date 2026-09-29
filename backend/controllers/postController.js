const { pool } = require('../config/database');

const createPost = async (req, res) => {
  try {
    const { title, content, media, community_id, parent_post_id, thread_id, post_type, challenge_data } = req.body;
    const author_id = req.user.id;

    // Check community access if creating a post in a community
    if (community_id) {
      const commRes = await pool.query('SELECT is_public, members FROM communities WHERE id = $1', [community_id]);
      if (commRes.rows.length > 0) {
        const community = commRes.rows[0];
        if (!community.is_public && (!community.members || !community.members.includes(author_id))) {
          return res.status(403).json({ message: 'Access denied. You are not a member of this private community.' });
        }
      }
    }

    if (!content && !challenge_data) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const newPost = await pool.query(
      `INSERT INTO posts (title, content, media, community_id, author_id, parent_post_id, thread_id, post_type, challenge_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [title || null, (content && content.trim()) || '', media || [], community_id || null, author_id, parent_post_id || null, thread_id || null, post_type || 'standard', challenge_data || null]
    );

    // Update community total posts if it's a main post and community_id is provided
    if (!parent_post_id) {
      if (community_id) {
        await pool.query('UPDATE communities SET total_posts = total_posts + 1 WHERE id = $1', [community_id]);
      }
      await pool.query('UPDATE users SET total_posts = total_posts + 1 WHERE id = $1', [author_id]);
    } else {
      await pool.query('UPDATE posts SET reply_count = reply_count + 1 WHERE id = $1', [parent_post_id]);
      await pool.query('UPDATE users SET total_replies = total_replies + 1 WHERE id = $1', [author_id]);
    }

    // If it's a challenge, broadcast it in the community chat as well
    if (post_type === 'challenge' && community_id) {
      await pool.query(
        `INSERT INTO community_messages (community_id, sender_id, message_type, post_id, content) 
         VALUES ($1, $2, 'challenge', $3, 'Raised a new challenge!')`,
        [community_id, author_id, newPost.rows[0].id]
      );
    }

    // Fetch author details to return full post object
    const authorRes = await pool.query('SELECT username, profile_photo, first_name, last_name FROM users WHERE id = $1', [author_id]);
    const fullPost = {
      ...newPost.rows[0],
      ...authorRes.rows[0]
    };

    res.status(201).json(fullPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error creating post' });
  }
};

const getCommunityPosts = async (req, res) => {
  try {
    const { communityId } = req.params;
    
    // Check community access
    const commRes = await pool.query('SELECT is_public, members FROM communities WHERE id = $1', [communityId]);
    if (commRes.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }
    const community = commRes.rows[0];
    if (!community.is_public && (!community.members || !community.members.includes(req.user.id))) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this private community.' });
    }

    const result = await pool.query(
      `SELECT p.*, u.username, u.profile_photo, u.first_name, u.last_name 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.community_id = $1 AND p.parent_post_id IS NULL AND p.is_deleted = FALSE 
       ORDER BY p.created_at DESC LIMIT 50`,
      [communityId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, u.username, u.profile_photo, u.first_name, u.last_name 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.author_id = $1 AND p.parent_post_id IS NULL AND p.is_deleted = FALSE 
       ORDER BY p.created_at DESC LIMIT 50`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error fetching user posts' });
  }
};

const getPostReplies = async (req, res) => {
  try {
    const { postId } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, u.username, u.profile_photo, u.first_name, u.last_name 
       FROM posts p 
       JOIN users u ON p.author_id = u.id 
       WHERE p.parent_post_id = $1 AND p.is_deleted = FALSE 
       ORDER BY p.created_at ASC`,
      [postId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching post replies:', error);
    res.status(500).json({ message: 'Server error fetching replies' });
  }
};

const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `UPDATE posts 
       SET likes = array_append(likes, $1), like_count = like_count + 1 
       WHERE id = $2 AND NOT ($1 = ANY(likes)) RETURNING *`,
      [userId, postId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Post already liked or does not exist' });
    }

    res.json({ message: 'Post liked successfully', post: result.rows[0] });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error liking post' });
  }
};

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const postRes = await pool.query('SELECT * FROM posts WHERE id = $1 AND author_id = $2', [postId, userId]);
    if (postRes.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized to delete this post or post not found' });
    }

    await pool.query('UPDATE posts SET is_deleted = TRUE WHERE id = $1', [postId]);
    await pool.query('UPDATE users SET total_posts = GREATEST(0, total_posts - 1) WHERE id = $1', [userId]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error deleting post' });
  }
};

const uploadPostMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No media file provided' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl, originalName: req.file.originalname, mimeType: req.file.mimetype });
  } catch (error) {
    console.error('Error uploading post media:', error);
    res.status(500).json({ message: 'Server error uploading media' });
  }
};

module.exports = { createPost, getCommunityPosts, getUserPosts, getPostReplies, likePost, deletePost, uploadPostMedia };
