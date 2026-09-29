-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  bio TEXT,
  profile_photo VARCHAR(500),
  cover_image VARCHAR(500),
  college_email VARCHAR(255) UNIQUE,
  college_name VARCHAR(255),
  class VARCHAR(50),
  division VARCHAR(50),
  interests TEXT[] DEFAULT '{}',
  joined_communities INTEGER[] DEFAULT '{}',
  created_communities INTEGER[] DEFAULT '{}',
  friends INTEGER[] DEFAULT '{}',
  blocked_users INTEGER[] DEFAULT '{}',
  total_posts INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  notification_preferences JSONB DEFAULT '{"emailNotifications": true}',
  privacy_setting VARCHAR(50) DEFAULT 'public',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_college_email ON users(college_email);

-- Communities Table
CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(500),
  banner VARCHAR(500),
  domain VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  admin_id INTEGER NOT NULL REFERENCES users(id),
  moderators INTEGER[] DEFAULT '{}',
  members INTEGER[] DEFAULT '{}',
  total_members INTEGER DEFAULT 1,
  total_posts INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  rules TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_communities_domain ON communities(domain);
CREATE INDEX IF NOT EXISTS idx_communities_admin_id ON communities(admin_id);
CREATE INDEX IF NOT EXISTS idx_communities_tags ON communities USING GIN(tags);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500),
  content TEXT NOT NULL,
  media VARCHAR(500)[],
  community_id INTEGER NOT NULL REFERENCES communities(id),
  author_id INTEGER NOT NULL REFERENCES users(id),
  parent_post_id INTEGER REFERENCES posts(id),
  thread_id INTEGER REFERENCES posts(id),
  likes INTEGER[] DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  sentiment VARCHAR(20),
  post_type VARCHAR(50) DEFAULT 'standard',
  challenge_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  triggered_by INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  action_url VARCHAR(500),
  related_entity_id INTEGER,
  related_entity_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Connection Requests Table
CREATE TABLE IF NOT EXISTS connection_requests (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  to_user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_connection_from_user ON connection_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_connection_to_user ON connection_requests(to_user_id);

-- Community Join Requests Table
CREATE TABLE IF NOT EXISTS community_join_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  community_id INTEGER NOT NULL REFERENCES communities(id),
  admin_id INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  admin_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  UNIQUE(user_id, community_id)
);

CREATE INDEX IF NOT EXISTS idx_join_requests_user ON community_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_community ON community_join_requests(community_id);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50),
  community_id INTEGER NOT NULL REFERENCES communities(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  location VARCHAR(500),
  event_link VARCHAR(500),
  attendees INTEGER[] DEFAULT '{}',
  going_count INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,
  cover_image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_community_id ON events(community_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);

-- AI Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  recommended_communities JSONB,
  recommended_people JSONB,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON ai_recommendations(user_id);

-- Interest Tags Table
CREATE TABLE IF NOT EXISTS interest_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
