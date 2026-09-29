const { pool } = require('../config/database');

const sendRequest = async (req, res) => {
  try {
    const from_user_id = req.user.id;
    const { to_user_id, message } = req.body;

    if (from_user_id === parseInt(to_user_id)) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    // Check if either user has blocked the other
    const blockCheck = await pool.query(
      'SELECT id, username, blocked_users FROM users WHERE id IN ($1, $2)',
      [from_user_id, to_user_id]
    );
    const userA = blockCheck.rows.find(u => u.id === from_user_id);
    const userB = blockCheck.rows.find(u => u.id === parseInt(to_user_id));

    if (
      (userA?.blocked_users || []).includes(parseInt(to_user_id)) ||
      (userB?.blocked_users || []).includes(from_user_id)
    ) {
      return res.status(403).json({ message: 'Cannot send connection request to this user' });
    }

    const senderUsername = userA?.username || req.user.username || 'Someone';

    const newRequest = await pool.query(
      `INSERT INTO connection_requests (from_user_id, to_user_id, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [from_user_id, to_user_id, message]
    );

    // Create notification for the receiver
    await pool.query(
      `INSERT INTO notifications (user_id, triggered_by, type, title, message, related_entity_id, related_entity_type)
       VALUES ($1, $2, 'CONNECTION_REQUEST', 'New Connection Request', $3, $4, 'CONNECTION_REQUEST')`,
      [to_user_id, from_user_id, `${senderUsername} wants to connect with you.`, newRequest.rows[0].id]
    );

    res.status(201).json(newRequest.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // unique violation
      return res.status(400).json({ message: 'Request already exists' });
    }
    console.error('Error sending connection request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const acceptRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await client.query('BEGIN');

    // Verify request is to this user and pending
    const requestRes = await client.query(
      'SELECT * FROM connection_requests WHERE id = $1 AND to_user_id = $2 AND status = $3',
      [id, user_id, 'pending']
    );

    if (requestRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    const request = requestRes.rows[0];

    // Update request status
    await client.query(
      'UPDATE connection_requests SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['accepted', id]
    );

    // Mark notification as read
    await client.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND related_entity_id = $2 AND related_entity_type = 'CONNECTION_REQUEST'",
      [user_id, id]
    );

    // Add to friends list for both users
    await client.query(
      'UPDATE users SET friends = array_append(friends, $1) WHERE id = $2 AND NOT ($1 = ANY(friends))',
      [request.from_user_id, user_id]
    );
    await client.query(
      'UPDATE users SET friends = array_append(friends, $1) WHERE id = $2 AND NOT ($1 = ANY(friends))',
      [user_id, request.from_user_id]
    );

    // Notify sender
    await client.query(
      `INSERT INTO notifications (user_id, triggered_by, type, title, message)
       VALUES ($1, $2, 'CONNECTION_ACCEPTED', 'Connection Accepted', 'Your connection request was accepted.')`,
      [request.from_user_id, user_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Request accepted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

const declineRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await client.query('BEGIN');

    // Update connection request status to declined
    const requestRes = await client.query(
      'UPDATE connection_requests SET status = $1, responded_at = CURRENT_TIMESTAMP WHERE id = $2 AND to_user_id = $3 AND status = $4 RETURNING *',
      ['declined', id, user_id, 'pending']
    );

    if (requestRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    // Mark notification as read
    await client.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND related_entity_id = $2 AND related_entity_type = 'CONNECTION_REQUEST'",
      [user_id, id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Request declined' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error declining connection request:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

const disconnectConnection = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { id: targetUserId } = req.params;
    const targetId = parseInt(targetUserId);

    await client.query('BEGIN');

    // Remove target from user's friends list
    await client.query(
      'UPDATE users SET friends = array_remove(friends, $1) WHERE id = $2',
      [targetId, userId]
    );

    // Remove user from target's friends list
    await client.query(
      'UPDATE users SET friends = array_remove(friends, $1) WHERE id = $2',
      [userId, targetId]
    );

    // Remove any connection requests between them
    await client.query(
      'DELETE FROM connection_requests WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)',
      [userId, targetId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Disconnected successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error disconnecting:', error);
    res.status(500).json({ message: 'Server error disconnecting' });
  } finally {
    client.release();
  }
};

const blockUser = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { id: targetUserId } = req.params;
    const targetId = parseInt(targetUserId);

    if (userId === targetId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    await client.query('BEGIN');

    // Append targetId to user's blocked_users list
    await client.query(
      'UPDATE users SET blocked_users = array_append(blocked_users, $1) WHERE id = $2 AND NOT ($1 = ANY(blocked_users))',
      [targetId, userId]
    );

    // Remove each other from friends list
    await client.query(
      'UPDATE users SET friends = array_remove(friends, $1) WHERE id = $2',
      [targetId, userId]
    );
    await client.query(
      'UPDATE users SET friends = array_remove(friends, $1) WHERE id = $2',
      [userId, targetId]
    );

    // Delete any pending or existing connection requests
    await client.query(
      'DELETE FROM connection_requests WHERE (from_user_id = $1 AND to_user_id = $2) OR (from_user_id = $2 AND to_user_id = $1)',
      [userId, targetId]
    );

    await client.query('COMMIT');
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error blocking user' });
  } finally {
    client.release();
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: targetUserId } = req.params;
    const targetId = parseInt(targetUserId);

    await pool.query(
      'UPDATE users SET blocked_users = array_remove(blocked_users, $1) WHERE id = $2',
      [targetId, userId]
    );

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ message: 'Server error unblocking user' });
  }
};

const getConnections = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user's friends list
    const userRes = await pool.query('SELECT friends FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friendsList = userRes.rows[0].friends || [];
    if (friendsList.length === 0) {
      return res.json([]);
    }

    // Fetch user details for friends
    const friendsRes = await pool.query(
      'SELECT id, username, first_name, last_name, bio, profile_photo, interests, college_name, class FROM users WHERE id = ANY($1)',
      [friendsList]
    );

    res.json(friendsRes.rows);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ message: 'Server error fetching connections' });
  }
};

const getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    const messagesRes = await pool.query(
      `SELECT dm.*, u.username as sender_username, u.profile_photo as sender_photo 
       FROM direct_messages dm 
       JOIN users u ON dm.sender_id = u.id 
       WHERE (dm.sender_id = $1 AND dm.receiver_id = $2) OR (dm.sender_id = $2 AND dm.receiver_id = $1) 
       ORDER BY dm.created_at ASC`,
      [userId, friendId]
    );

    res.json(messagesRes.rows);
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    res.status(500).json({ message: 'Server error fetching direct messages' });
  }
};

const sendDirectMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    // Check if either user has blocked the other
    const blockCheck = await pool.query(
      'SELECT id, blocked_users FROM users WHERE id IN ($1, $2)',
      [userId, friendId]
    );
    const userA = blockCheck.rows.find(u => u.id === userId);
    const userB = blockCheck.rows.find(u => u.id === parseInt(friendId));

    if (
      (userA?.blocked_users || []).includes(parseInt(friendId)) ||
      (userB?.blocked_users || []).includes(userId)
    ) {
      return res.status(403).json({ message: 'Messaging is disabled due to a block' });
    }

    const result = await pool.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, friendId, content.trim()]
    );

    const savedMessage = result.rows[0];

    // Fetch username of sender to return complete object
    const senderRes = await pool.query('SELECT username, profile_photo FROM users WHERE id = $1', [userId]);
    savedMessage.sender_username = senderRes.rows[0].username;
    savedMessage.sender_photo = senderRes.rows[0].profile_photo;

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending direct message:', error);
    res.status(500).json({ message: 'Server error sending direct message' });
  }
};

module.exports = { 
  sendRequest, 
  acceptRequest, 
  declineRequest, 
  disconnectConnection,
  blockUser,
  unblockUser,
  getConnections, 
  getDirectMessages, 
  sendDirectMessage 
};
