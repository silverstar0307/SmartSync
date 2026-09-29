const { pool } = require('../config/database');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
const createCommunity = async (req, res) => {
  try {
    const { name, slug, description, domain, tags, is_public, requires_approval } = req.body;
    const admin_id = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Community name is required' });
    }

    // Generate or clean slug
    let cleanSlug = slug && slug.trim() !== '' 
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    if (!cleanSlug) {
      cleanSlug = `community-${Date.now()}`;
    }

    // Check if community with same name exists (case-insensitive)
    const existingName = await pool.query(
      'SELECT id FROM communities WHERE LOWER(name) = LOWER($1)',
      [name.trim()]
    );

    if (existingName.rows.length > 0) {
      return res.status(400).json({ message: 'A community with this name already exists. Please choose a different name.' });
    }

    // Check if slug exists, append unique suffix if needed
    const existingSlug = await pool.query(
      'SELECT id FROM communities WHERE slug = $1',
      [cleanSlug]
    );

    if (existingSlug.rows.length > 0) {
      cleanSlug = `${cleanSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newCommunity = await pool.query(
      `INSERT INTO communities (name, slug, description, domain, tags, admin_id, members, is_public, requires_approval) 
       VALUES ($1, $2, $3, $4, $5, $6, ARRAY[$6]::INTEGER[], $7, $8) 
       RETURNING *`,
      [
        name.trim(), 
        cleanSlug, 
        description || '', 
        domain || '', 
        Array.isArray(tags) ? tags : [], 
        admin_id, 
        is_public !== undefined ? Boolean(is_public) : false, 
        requires_approval !== undefined ? Boolean(requires_approval) : false
      ]
    );

    // Update user's joined_communities and created_communities safely
    await pool.query(
      `UPDATE users 
       SET joined_communities = array_append(COALESCE(joined_communities, '{}'), $1),
           created_communities = array_append(COALESCE(created_communities, '{}'), $1)
       WHERE id = $2 AND NOT ($1 = ANY(COALESCE(joined_communities, '{}')))`,
      [newCommunity.rows[0].id, admin_id]
    );

    res.status(201).json(newCommunity.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'A community with this name or slug already exists. Please choose a different name.' });
    }
    console.error('Error creating community:', error);
    res.status(500).json({ message: error.message || 'Server error creating community' });
  }
};

const requestCommunity = async (req, res) => {
  try {
    const { name, slug, description, domain, tags, requires_approval } = req.body;
    const admin_id = req.user.id;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }

    const userRes = await pool.query('SELECT first_name, last_name, email FROM users WHERE id = $1', [admin_id]);
    const user = userRes.rows[0];
    const profileName = `${user.first_name} ${user.last_name}`;
    const userEmail = user.email;

    const token = jwt.sign(
      { name, slug, description, domain, tags, admin_id, requires_approval, is_public: true },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const approveLink = `${req.protocol}://${req.get('host')}/api/v1/communities/approve?token=${token}`;
    const denyLink = `${req.protocol}://${req.get('host')}/api/v1/communities/deny?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@smartsync.com',
      to: 'silverstunner106@gmail.com',
      replyTo: userEmail,
      subject: 'New Public Community Request',
      text: `Hii, my name is ${profileName}, i want an approval to create an public community.\nMy community name is ${name} and this community is dedicated only for ${tags ? tags.join(', ') : 'all'}.\n\nThank you for your attention.\nWaiting for your approval.\n\n[APPROVE]: ${approveLink}\n[DENIED]: ${denyLink}`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
    } else {
      console.log('\n--- EMAIL WOULD BE SENT HERE ---');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log(mailOptions.text);
      console.log('--------------------------------\n');
      console.log('NOTE: Email was not sent because EMAIL_USER and/or EMAIL_PASS are not set in the .env file.');
    }
    
    res.status(200).json({ message: 'Request sent for approval.' });
  } catch (error) {
    console.error('Error requesting community:', error);
    res.status(500).json({ message: 'Server error requesting community' });
  }
};

const approveCommunity = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const { name, slug, description, domain, tags, admin_id, requires_approval, is_public } = decoded;

    const checkRes = await pool.query('SELECT id FROM communities WHERE slug = $1', [slug]);
    if (checkRes.rows.length > 0) {
      return res.send('Community already approved/created.');
    }

    const newCommunity = await pool.query(
      `INSERT INTO communities (name, slug, description, domain, tags, admin_id, members, is_public, requires_approval) 
       VALUES ($1, $2, $3, $4, $5, $6, ARRAY[$6]::INTEGER[], $7, $8) 
       RETURNING *`,
      [name, slug, description, domain, tags || [], admin_id, is_public, requires_approval]
    );

    await pool.query(
      `UPDATE users 
       SET joined_communities = array_append(COALESCE(joined_communities, '{}'), $1),
           created_communities = array_append(COALESCE(created_communities, '{}'), $1)
       WHERE id = $2 AND NOT ($1 = ANY(COALESCE(joined_communities, '{}')))`,
      [newCommunity.rows[0].id, admin_id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, type, message, reference_id, is_read) 
       VALUES ($1, 'community_approved', $2, $3, false)`,
      [admin_id, `Your Request to create a public community named ${name} is Approved.`, newCommunity.rows[0].id]
    );

    res.send('<h1>Community Approved and Created Successfully</h1>');
  } catch (error) {
    console.error('Error approving community:', error);
    res.status(500).send('Server error or token expired');
  }
};

const denyCommunity = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Token required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const { name, admin_id } = decoded;

    await pool.query(
      `INSERT INTO notifications (user_id, type, message, is_read) 
       VALUES ($1, 'community_denied', $2, false)`,
      [admin_id, `Your Request to create a public community named ${name} is Rejected.`]
    );

    res.send('<h1>Community Request Rejected</h1>');
  } catch (error) {
    console.error('Error denying community:', error);
    res.status(500).send('Server error or token expired');
  }
};

const getCommunities = async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetch all communities and include a flag if current user has a pending request
    const result = await pool.query(`
      SELECT c.*, 
             EXISTS(SELECT 1 FROM community_join_requests cjr WHERE cjr.community_id = c.id AND cjr.user_id = $1 AND cjr.status = 'pending') as has_pending_request
      FROM communities c 
      WHERE c.is_public = TRUE OR $1 = ANY(c.members)
      ORDER BY created_at DESC
    `, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ message: 'Server error fetching communities' });
  }
};

const getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM communities WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }
    
    const community = result.rows[0];

    // Check if private community is accessed by non-member
    if (!community.is_public && (!community.members || !community.members.includes(req.user.id))) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this private community.' });
    }
    let membersDetails = [];
    if (community.members && community.members.length > 0) {
      const membersRes = await pool.query(
        `SELECT id, username, first_name, last_name, bio, profile_photo, interests,
                CASE WHEN id = $2 THEN true ELSE false END as is_admin
         FROM users WHERE id = ANY($1)
         ORDER BY (CASE WHEN id = $2 THEN 0 ELSE 1 END), username ASC`,
        [community.members, community.admin_id]
      );
      membersDetails = membersRes.rows;
    }
    community.members_details = membersDetails;
    
    res.json(community);
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const requestToJoin = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = req.user.id;
    
    const communityRes = await pool.query('SELECT admin_id, name FROM communities WHERE id = $1', [communityId]);
    if (communityRes.rows.length === 0) return res.status(404).json({ message: 'Community not found' });
    
    const community = communityRes.rows[0];

    // Always require approval
    const insertReq = await pool.query(
      'INSERT INTO community_join_requests (user_id, community_id, admin_id, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, communityId, community.admin_id, 'pending']
    );
    const requestId = insertReq.rows[0].id;

    // Fetch sender username
    const userRes = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    const senderUsername = userRes.rows[0]?.username || req.user.username || 'Someone';

    // Notify admin
    await pool.query(
      `INSERT INTO notifications (user_id, triggered_by, type, title, message, related_entity_id, related_entity_type)
       VALUES ($1, $2, 'COMMUNITY_JOIN_REQUEST', 'New Join Request', $3, $4, 'COMMUNITY_JOIN_REQUEST')`,
      [community.admin_id, userId, `${senderUsername} wants to join your community ${community.name}.`, requestId]
    );

    res.json({ message: 'Join request sent' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Request already exists' });
    }
    console.error('Error requesting to join:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const { getMemberSuggestionsForCommunity } = require('../services/openaiService');

const updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, domain, tags } = req.body;
    const adminId = req.user.id;

    // Check if community exists and requester is admin
    const communityRes = await pool.query('SELECT admin_id FROM communities WHERE id = $1', [id]);
    if (communityRes.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (communityRes.rows[0].admin_id !== adminId) {
      return res.status(403).json({ message: 'Not authorized. Only the admin can edit community details.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const result = await pool.query(
      `UPDATE communities 
       SET name = $1, slug = $2, description = $3, domain = $4, tags = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [name, slug, description, domain, tags || [], id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({ message: 'Server error updating community' });
  }
};

const uploadCommunityLogo = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Check if community exists and requester is admin
    const communityRes = await pool.query('SELECT admin_id FROM communities WHERE id = $1', [id]);
    if (communityRes.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (communityRes.rows[0].admin_id !== adminId) {
      return res.status(403).json({ message: 'Not authorized. Only the admin can edit community logo.' });
    }

    // Store absolute path or relative web url
    const logoUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `UPDATE communities SET icon = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [logoUrl, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error uploading community logo:', error);
    res.status(500).json({ message: 'Server error uploading community logo' });
  }
};

const searchCommunityMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { query, ai } = req.query;

    const communityRes = await pool.query('SELECT * FROM communities WHERE id = $1', [id]);
    if (communityRes.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }
    const community = communityRes.rows[0];

    // Fetch all users not already members
    const membersList = community.members || [];

    // Fetch pending invites
    const pendingInvitesRes = await pool.query(
      "SELECT user_id FROM notifications WHERE related_entity_id = $1 AND type = 'COMMUNITY_REQUEST' AND is_read = FALSE",
      [id]
    );
    const pendingInviteUserIds = pendingInvitesRes.rows.map(row => row.user_id);

    let candidates = [];

    if (ai === 'true') {
      let usersQuery = 'SELECT id, username, first_name, last_name, bio, profile_photo, interests FROM users';
      let queryParams = [];
      if (membersList.length > 0) {
        usersQuery += ' WHERE NOT (id = ANY($1))';
        queryParams.push(membersList);
      }
      usersQuery += ' LIMIT 100';
      const usersRes = await pool.query(usersQuery, queryParams);
      const suggestions = await getMemberSuggestionsForCommunity(community, usersRes.rows);
      candidates = suggestions;
    } else {
      let usersQuery = 'SELECT id, username, first_name, last_name, bio, profile_photo, interests FROM users WHERE 1=1';
      const queryParams = [];
      let paramCount = 1;

      if (membersList.length > 0) {
        usersQuery += ` AND NOT (id = ANY($${paramCount}))`;
        queryParams.push(membersList);
        paramCount++;
      }

      if (query && query.trim() !== '') {
        const searchTerm = `%${query.trim()}%`;
        usersQuery += ` AND (username ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR $${paramCount + 1} = ANY(interests))`;
        queryParams.push(searchTerm, query.trim());
        paramCount += 2;
      }

      usersQuery += ' LIMIT 50';
      const usersRes = await pool.query(usersQuery, queryParams);
      candidates = usersRes.rows.map(user => ({
        ...user,
        matchScore: 0,
        reason: 'Manual search match'
      }));
    }

    // Map isInvited status
    const result = candidates.map(user => ({
      ...user,
      isInvited: pendingInviteUserIds.includes(user.id)
    }));

    return res.json(result);
  } catch (error) {
    console.error('Error searching community members:', error);
    res.status(500).json({ message: 'Server error searching community members' });
  }
};

const addCommunityMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const adminId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const communityRes = await pool.query('SELECT admin_id, members FROM communities WHERE id = $1', [id]);
    if (communityRes.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const community = communityRes.rows[0];
    if (community.admin_id !== adminId) {
      return res.status(403).json({ message: 'Not authorized. Only the admin can add members.' });
    }

    if (community.members.includes(parseInt(userId))) {
      return res.status(400).json({ message: 'User is already a member of this community' });
    }

    // Add member
    await pool.query(
      'UPDATE communities SET members = array_append(members, $1), total_members = total_members + 1 WHERE id = $2',
      [userId, id]
    );

    // Update user
    await pool.query(
      'UPDATE users SET joined_communities = array_append(joined_communities, $1) WHERE id = $2',
      [id, userId]
    );

    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Error adding community member:', error);
    res.status(500).json({ message: 'Server error adding member' });
  }
};

const inviteToCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const adminId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const communityRes = await pool.query('SELECT admin_id, name, members FROM communities WHERE id = $1', [id]);
    if (communityRes.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const community = communityRes.rows[0];
    if (community.admin_id !== adminId) {
      return res.status(403).json({ message: 'Not authorized. Only the admin can invite members.' });
    }

    if (community.members.includes(parseInt(userId))) {
      return res.status(400).json({ message: 'User is already a member of this community' });
    }

    // Check if invitation already sent and is unread
    const checkNotification = await pool.query(
      "SELECT id FROM notifications WHERE user_id = $1 AND related_entity_id = $2 AND type = 'COMMUNITY_REQUEST' AND is_read = FALSE",
      [userId, id]
    );

    if (checkNotification.rows.length > 0) {
      return res.status(400).json({ message: 'An invitation is already pending for this user' });
    }

    // Send invitation notification
    await pool.query(
      `INSERT INTO notifications (user_id, triggered_by, type, title, message, related_entity_id, related_entity_type)
       VALUES ($1, $2, 'COMMUNITY_REQUEST', 'Community Invitation', $3, $4, 'COMMUNITY')`,
      [userId, adminId, `You have been invited to join the community "${community.name}" by its admin.`, id]
    );

    res.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ message: 'Server error sending invitation' });
  }
};

const acceptCommunityInvitation = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // Community ID
    const userId = req.user.id; // Joining User ID

    await client.query('BEGIN');

    const communityRes = await client.query('SELECT name, members FROM communities WHERE id = $1', [id]);
    if (communityRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Community not found' });
    }

    const community = communityRes.rows[0];
    if (community.members.includes(userId)) {
      // Already a member, just mark notification read
      await client.query(
        "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND related_entity_id = $2 AND type = 'COMMUNITY_REQUEST'",
        [userId, id]
      );
      await client.query('COMMIT');
      return res.json({ message: 'Already a member' });
    }

    // Add member
    await client.query(
      'UPDATE communities SET members = array_append(members, $1), total_members = total_members + 1 WHERE id = $2',
      [userId, id]
    );

    // Update user
    await client.query(
      'UPDATE users SET joined_communities = array_append(joined_communities, $1) WHERE id = $2',
      [id, userId]
    );

    // Mark notification as read
    await client.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND related_entity_id = $2 AND type = 'COMMUNITY_REQUEST'",
      [userId, id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Invitation accepted and joined community successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error accepting invitation' });
  } finally {
    client.release();
  }
};

const getCommunityMessages = async (req, res) => {
  try {
    const { id } = req.params;

    // Check access permissions
    const commRes = await pool.query('SELECT is_public, members FROM communities WHERE id = $1', [id]);
    if (commRes.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }
    const community = commRes.rows[0];
    if (!community.is_public && (!community.members || !community.members.includes(req.user.id))) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this private community.' });
    }

    const result = await pool.query(
      `SELECT cm.*, u.username as sender_username, u.profile_photo as sender_photo,
              p.title as post_title, p.content as post_content, p.media as post_media, 
              p.challenge_data, p.like_count, p.reply_count 
       FROM community_messages cm 
       JOIN users u ON cm.sender_id = u.id 
       LEFT JOIN posts p ON cm.post_id = p.id
       WHERE cm.community_id = $1 
       ORDER BY cm.created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching community messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const sendCommunityMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, media } = req.body;
    const senderId = req.user.id;

    // Check access permissions
    const commRes = await pool.query('SELECT is_public, members FROM communities WHERE id = $1', [id]);
    if (commRes.rows.length === 0) {
      return res.status(404).json({ message: 'Community not found' });
    }
    const community = commRes.rows[0];
    if (!community.is_public && (!community.members || !community.members.includes(senderId))) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this private community.' });
    }

    if ((!content || content.trim() === '') && (!media || media.length === 0)) {
      return res.status(400).json({ message: 'Message content or media is required' });
    }

    const result = await pool.query(
      `INSERT INTO community_messages (community_id, sender_id, content, media) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, senderId, content ? content.trim() : '', media || []]
    );

    const savedMessage = result.rows[0];

    // Fetch sender details
    const senderRes = await pool.query('SELECT username, profile_photo FROM users WHERE id = $1', [senderId]);
    savedMessage.sender_username = senderRes.rows[0].username;
    savedMessage.sender_photo = senderRes.rows[0].profile_photo;

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error('Error sending community message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadCommunityMessageFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } catch (error) {
    console.error('Error uploading community message file:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const acceptJoinRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const { requestId } = req.params;
    const adminId = req.user.id;

    await client.query('BEGIN');

    // Get the request
    const reqRes = await client.query('SELECT * FROM community_join_requests WHERE id = $1 AND admin_id = $2 AND status = $3', [requestId, adminId, 'pending']);
    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    const joinRequest = reqRes.rows[0];

    // Update request status
    await client.query("UPDATE community_join_requests SET status = 'accepted', responded_at = CURRENT_TIMESTAMP WHERE id = $1", [requestId]);

    // Add user to community
    await client.query('UPDATE communities SET members = array_append(members, $1), total_members = total_members + 1 WHERE id = $2', [joinRequest.user_id, joinRequest.community_id]);
    await client.query('UPDATE users SET joined_communities = array_append(joined_communities, $1) WHERE id = $2', [joinRequest.community_id, joinRequest.user_id]);

    // Mark notification as read for admin
    await client.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND related_entity_id = $2 AND type = 'COMMUNITY_JOIN_REQUEST'",
      [adminId, requestId]
    );

    // Notify user
    const commRes = await client.query('SELECT name FROM communities WHERE id = $1', [joinRequest.community_id]);
    await client.query(
      `INSERT INTO notifications (user_id, triggered_by, type, title, message)
       VALUES ($1, $2, 'COMMUNITY_JOIN_ACCEPTED', 'Join Request Accepted', $3)`,
      [joinRequest.user_id, adminId, `Your request to join ${commRes.rows[0].name} has been accepted.`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Join request accepted' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting join request:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

const declineJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adminId = req.user.id;

    const reqRes = await pool.query('SELECT * FROM community_join_requests WHERE id = $1 AND admin_id = $2 AND status = $3', [requestId, adminId, 'pending']);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    const joinRequest = reqRes.rows[0];

    await pool.query("UPDATE community_join_requests SET status = 'rejected', responded_at = CURRENT_TIMESTAMP WHERE id = $1", [requestId]);

    // Mark notification as read for admin
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND related_entity_id = $2 AND type = 'COMMUNITY_JOIN_REQUEST'",
      [adminId, requestId]
    );

    const commRes = await pool.query('SELECT name FROM communities WHERE id = $1', [joinRequest.community_id]);
    await pool.query(
      `INSERT INTO notifications (user_id, triggered_by, type, title, message)
       VALUES ($1, $2, 'COMMUNITY_JOIN_REJECTED', 'Join Request Rejected', $3)`,
      [joinRequest.user_id, adminId, `Your request to join ${commRes.rows[0].name} has been rejected.`]
    );

    res.json({ message: 'Join request rejected' });
  } catch (error) {
    console.error('Error declining join request:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const leaveCommunity = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // Community ID
    const userId = req.user.id;
    
    await client.query('BEGIN');
    
    // 1. Fetch community to check admin_id and if user is actually a member
    const communityRes = await client.query('SELECT admin_id, members FROM communities WHERE id = $1', [id]);
    if (communityRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Community not found' });
    }
    
    const community = communityRes.rows[0];
    if (community.admin_id === userId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Owner/Admin cannot leave the community. Delete it instead.' });
    }
    
    if (!community.members.includes(userId)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'You are not a member of this community.' });
    }
    
    // 2. Remove user from community members
    await client.query(
      'UPDATE communities SET members = array_remove(members, $1), total_members = GREATEST(0, total_members - 1) WHERE id = $2',
      [userId, id]
    );
    
    // 3. Remove community from user's joined_communities
    await client.query(
      'UPDATE users SET joined_communities = array_remove(joined_communities, $1) WHERE id = $2',
      [id, userId]
    );
    
    // 4. Delete any pending join request for this user
    await client.query(
      'DELETE FROM community_join_requests WHERE user_id = $1 AND community_id = $2',
      [userId, id]
    );
    
    await client.query('COMMIT');
    res.json({ message: 'Left community successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error leaving community:', error);
    res.status(500).json({ message: 'Server error leaving community' });
  } finally {
    client.release();
  }
};

const deleteCommunity = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params; // Community ID
    const adminId = req.user.id;
    
    await client.query('BEGIN');
    
    // 1. Check if community exists and requester is admin
    const communityRes = await client.query('SELECT admin_id FROM communities WHERE id = $1', [id]);
    if (communityRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Community not found' });
    }
    
    if (communityRes.rows[0].admin_id !== adminId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Not authorized. Only the admin can delete the community.' });
    }
    
    // 2. Delete community messages
    await client.query('DELETE FROM community_messages WHERE community_id = $1', [id]);
    
    // 3. Delete community posts
    await client.query('DELETE FROM posts WHERE community_id = $1', [id]);
    
    // 4. Delete events for this community
    await client.query('DELETE FROM events WHERE community_id = $1', [id]);
    
    // 5. Delete join requests
    await client.query('DELETE FROM community_join_requests WHERE community_id = $1', [id]);
    
    // 6. Delete notifications related to this community or its join requests
    await client.query('DELETE FROM notifications WHERE related_entity_id = $1 AND related_entity_type = \'COMMUNITY\'', [id]);
    
    // 7. Remove community ID from all users' joined_communities and created_communities arrays
    await client.query('UPDATE users SET joined_communities = array_remove(joined_communities, $1), created_communities = array_remove(created_communities, $1)', [id]);
    
    // 8. Delete the community itself
    await client.query('DELETE FROM communities WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.json({ message: 'Community deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting community:', error);
    res.status(500).json({ message: 'Server error deleting community' });
  } finally {
    client.release();
  }
};

module.exports = { 
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
};
