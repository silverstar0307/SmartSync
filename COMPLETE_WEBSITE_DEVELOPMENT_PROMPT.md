# EMERGENT CODING PROMPT - SMART COMMUNITY WEBSITE FOR COLLEGE STUDENTS

**Copy and paste this entire prompt into Claude, Claude Code, or any AI coding agent to start building the website.**

---

## 🎯 PROJECT OVERVIEW

You are building a **Smart Community Website for College Students** - a platform that connects students based on shared interests and domains using AI recommendations.

### Problem Statement
College students struggle to find like-minded peers and communities aligned with their interests. They're isolated in their domains (coding, music, art, fitness, etc.) and can't easily discover communities or connect with similar students.

### Solution
A web application where:
1. Students signup with college email and select interest domains
2. AI recommends relevant communities and peer profiles
3. Students can join communities, create clubs, and collaborate
4. Students can connect with peers sharing similar interests
5. Real-time notifications keep users engaged

### Key Features
- Email verification with college domain
- Interest-based profile creation
- AI-powered community suggestions
- AI-powered peer recommendations
- Community discovery and joining
- Community creation (student-led)
- User profiles with interests and stats
- Connection/friend request system
- Community post discussions
- Event management
- Real-time notifications
- Sidebar navigation (dashboard, communities, interests, notifications, profile)

---

## 📋 TECHNOLOGY STACK

### Updated Tech Stack (As Per Requirements)
- **Frontend:** Next.js 14+ with App Router
- **Backend:** Node.js with Express.js
- **Database:** Neon (PostgreSQL with Serverless)
- **Authentication:** Neon auth or JWT with Neon
- **AI:** OpenAI API (GPT-4)
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit or Zustand
- **API Client:** Axios or Fetch
- **Email Service:** SendGrid or Nodemailer
- **File Storage:** Cloudinary or Supabase Storage
- **Deployment:** Vercel (frontend), Railway/Render (backend)

### Design Reference
Style the UI like: https://automaterra.webflow.io/
- Modern, clean aesthetic
- Smooth animations
- Professional color scheme
- Responsive design
- Card-based layouts
- Intuitive navigation

---

## 🗄️ DATABASE SCHEMA (Neon PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_college_email ON users(college_email);
```

### Communities Table
```sql
CREATE TABLE communities (
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

CREATE INDEX idx_communities_domain ON communities(domain);
CREATE INDEX idx_communities_admin_id ON communities(admin_id);
CREATE INDEX idx_communities_tags ON communities USING GIN(tags);
```

### Posts Table
```sql
CREATE TABLE posts (
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_community_id ON posts(community_id);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### Notifications Table
```sql
CREATE TABLE notifications (
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

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

### Connection Requests Table
```sql
CREATE TABLE connection_requests (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id),
  to_user_id INTEGER NOT NULL REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX idx_connection_from_user ON connection_requests(from_user_id);
CREATE INDEX idx_connection_to_user ON connection_requests(to_user_id);
```

### Community Join Requests Table
```sql
CREATE TABLE community_join_requests (
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

CREATE INDEX idx_join_requests_user ON community_join_requests(user_id);
CREATE INDEX idx_join_requests_community ON community_join_requests(community_id);
```

### Events Table
```sql
CREATE TABLE events (
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

CREATE INDEX idx_events_community_id ON events(community_id);
CREATE INDEX idx_events_start_date ON events(start_date);
```

### AI Recommendations Table
```sql
CREATE TABLE ai_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  recommended_communities JSONB,
  recommended_people JSONB,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_user ON ai_recommendations(user_id);
```

### Interest Tags Table
```sql
CREATE TABLE interest_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 API ENDPOINTS (Backend Routes)

### Authentication Endpoints
```
POST   /api/v1/auth/register              - Register new user
POST   /api/v1/auth/verify-email          - Verify email with token
POST   /api/v1/auth/login                 - Login user
POST   /api/v1/auth/refresh-token         - Refresh JWT token
POST   /api/v1/auth/logout                - Logout user
POST   /api/v1/auth/forgot-password       - Send password reset email
POST   /api/v1/auth/reset-password        - Reset password with token
```

### User Endpoints
```
GET    /api/v1/users/:userId              - Get user profile
PUT    /api/v1/users/:userId              - Update user profile
PUT    /api/v1/users/:userId/interests    - Update user interests
GET    /api/v1/users/:userId/friends      - Get user's friends list
GET    /api/v1/users/:userId/communities  - Get user's joined communities
GET    /api/v1/users/search               - Search users by name/interest
```

### Community Endpoints
```
POST   /api/v1/communities                - Create community
GET    /api/v1/communities                - Get all communities (with filters)
GET    /api/v1/communities/:communityId   - Get community details
PUT    /api/v1/communities/:communityId   - Update community (admin)
DELETE /api/v1/communities/:communityId   - Delete community (admin)
POST   /api/v1/communities/:communityId/join     - Join community
POST   /api/v1/communities/:communityId/leave    - Leave community
GET    /api/v1/communities/:communityId/members - Get community members
POST   /api/v1/communities/:communityId/posts   - Create post in community
GET    /api/v1/communities/:communityId/posts   - Get community posts
```

### Post Endpoints
```
GET    /api/v1/posts/:postId              - Get post details
PUT    /api/v1/posts/:postId              - Update post
DELETE /api/v1/posts/:postId              - Delete post
POST   /api/v1/posts/:postId/like         - Like a post
DELETE /api/v1/posts/:postId/like         - Unlike a post
POST   /api/v1/posts/:postId/replies      - Reply to post
GET    /api/v1/posts/:postId/replies      - Get post replies
```

### Notification Endpoints
```
GET    /api/v1/notifications              - Get all notifications
GET    /api/v1/notifications/unread-count - Get unread count
PATCH  /api/v1/notifications/:id/read     - Mark as read
PATCH  /api/v1/notifications/read-all     - Mark all as read
DELETE /api/v1/notifications/:id          - Delete notification
```

### Connection Request Endpoints
```
POST   /api/v1/connections/request        - Send connection request
POST   /api/v1/connections/request/:id/accept - Accept request
POST   /api/v1/connections/request/:id/reject - Reject request
GET    /api/v1/connections/requests/pending    - Get pending requests
```

### Community Join Request Endpoints
```
POST   /api/v1/communities/:communityId/join-request          - Request to join
GET    /api/v1/communities/:communityId/join-requests         - Get join requests (admin)
POST   /api/v1/communities/:communityId/join-requests/:id/approve - Approve request
POST   /api/v1/communities/:communityId/join-requests/:id/reject  - Reject request
```

### Event Endpoints
```
POST   /api/v1/communities/:communityId/events     - Create event
GET    /api/v1/communities/:communityId/events     - Get events
GET    /api/v1/events/:eventId                     - Get event details
PUT    /api/v1/events/:eventId                     - Update event
DELETE /api/v1/events/:eventId                     - Delete event
POST   /api/v1/events/:eventId/rsvp                - RSVP to event
```

### AI Recommendation Endpoints
```
GET    /api/v1/recommendations/communities        - Get recommended communities
GET    /api/v1/recommendations/people              - Get recommended people
POST   /api/v1/recommendations/generate            - Generate recommendations
```

---

## 🎨 FRONTEND COMPONENTS & PAGES

### Pages/Routes
```
/                              - Public landing page
/auth/signup                   - Signup page
/auth/verify-email             - Email verification page
/auth/login                    - Login page
/dashboard                     - Main dashboard (protected)
/communities                   - My communities page
/communities/:id               - Community detail page
/communities/:id/settings      - Community settings (admin)
/interests                     - My interests page
/notifications                 - Notifications page
/profile/:userId               - User profile page
/profile/:userId/edit          - Edit profile page
/search/communities            - Community discovery/search
/search/people                 - People discovery/search
/events                        - Events page
```

### Main Components (Sidebar + Dashboard)
```
Layout/
  ├── Sidebar.tsx             - Left sidebar navigation
  ├── TopBar.tsx              - Top navigation with notification bell
  └── MainLayout.tsx          - Main layout wrapper

Dashboard/
  ├── Dashboard.tsx           - Main dashboard page
  ├── ActivityFeed.tsx        - Community posts feed
  ├── RecommendedPeople.tsx   - AI-matched people cards
  ├── FindNewPeopleBtn.tsx    - Trigger AI matching button
  └── NotificationPanel.tsx   - Notification dropdown

Communities/
  ├── CommunitiesList.tsx     - All joined communities
  ├── CommunityCard.tsx       - Community preview card
  ├── CommunityDetail.tsx     - Community page
  ├── CommunityFeed.tsx       - Posts in community
  ├── CommunityMembers.tsx    - Community members list
  ├── CommunityEvents.tsx     - Community events
  ├── JoinedCommunities.tsx   - User's joined communities
  ├── RecommendedCommunities.tsx - AI suggestions
  ├── DiscoveryCommunities.tsx - Search & filter communities
  ├── CreateCommunity.tsx     - Community creation form
  └── CommunitySettings.tsx   - Community management (admin)

Interests/
  ├── MyInterests.tsx         - My interests page
  ├── InterestTag.tsx         - Individual interest tag
  ├── PopularInterests.tsx    - Trending interests
  ├── SearchInterests.tsx     - Interest search
  └── InterestSelector.tsx    - Multi-select interests

Notifications/
  ├── NotificationsPage.tsx   - All notifications
  ├── NotificationItem.tsx    - Individual notification
  ├── NotificationFilters.tsx - Filter by type
  └── NotificationActions.tsx - Accept/decline buttons

Profile/
  ├── UserProfile.tsx         - Public profile view
  ├── ProfileHeader.tsx       - Photo, cover, bio
  ├── ProfileInfo.tsx         - Basic info section
  ├── ProfileStats.tsx        - User stats
  ├── ProfileInterests.tsx    - Interest tags display
  ├── ProfileFriends.tsx      - Friends list
  ├── ProfileCommunities.tsx  - Joined communities
  ├── EditProfile.tsx         - Edit profile form
  └── EditProfileModal.tsx    - Modal for editing

Posts/
  ├── PostCard.tsx            - Individual post card
  ├── PostCreate.tsx          - Create post form
  ├── PostDetail.tsx          - Full post view
  ├── PostComments.tsx        - Post comments/replies
  ├── CommentForm.tsx         - Comment input
  └── PostActions.tsx         - Like, reply, delete

Auth/
  ├── SignupForm.tsx          - Signup form
  ├── LoginForm.tsx           - Login form
  ├── EmailVerification.tsx   - Verify email
  ├── InterestSelection.tsx   - Select interests after signup
  └── ProtectedRoute.tsx      - Route protection wrapper

Common/
  ├── Header.tsx              - Page header
  ├── Button.tsx              - Reusable button
  ├── Card.tsx                - Card component
  ├── Modal.tsx               - Modal dialog
  ├── Loading.tsx             - Loading spinner
  ├── Toast.tsx               - Toast notifications
  ├── Avatar.tsx              - User avatar
  └── SearchBar.tsx           - Search component
```

---

## 🔄 APP FLOW & BUTTON INTERACTIONS

### 1. Dashboard Page Interactions
- **Notification icon (top)** → Opens notification panel showing:
  - New friend requests
  - Community join requests
  - Recommended people profiles
  - Event reminders
  
- **Community new posts** → Shows feed of recent posts from joined communities with:
  - Author name + avatar
  - Post content
  - Like count, comment count
  - Reply action
  
- **Recommended people** → Click person card → View full profile with:
  - Profile photo, name, college, class
  - Shared interests
  - Connect button → Send friend request → Notification appears
  
- **Find new people button (bottom)** → Trigger AI matching:
  - AI analyzes user interests + activity
  - Generates match scores
  - Shows expanded results page with 10-15 matched students
  - Each has match %, common interests, connect button

### 2. My Communities Page Interactions
- **Joined communities** → List of all communities user joined
  - Click community → Enter community page (posts, members, events)
  
- **Recommended communities** → AI suggestions based on interests
  - Join button → Add to joined communities
  - Removed from suggestions
  
- **Find communities button** → Full community discovery page with:
  - Search bar (by name, keyword)
  - Filter by interest tags (coding, music, art, etc.)
  - Sort options (members, activity, newest)
  - Display all communities
  - Each community card shows: name, description, member count
  
- **Create a community button** → Opens form:
  - Community name (required)
  - Description, icon/banner upload
  - Select interest domain/tags
  - Invite members (optional)
  - Set rules
  - Submit → Community created, user is admin

### 3. My Interests Page Interactions
- **Currently selected interests** → Display your tags
  - X button on each → Removes tag, AI re-suggests communities
  
- **Popular interests** → Trending site-wide tags
  - + button on each → Adds to your interests
  
- **Search interests** → Search bar with autocomplete
  - Type to search
  - Results dropdown shows matching tags
  - Click result → Adds to interests
  
- **Save interests button (bottom)** → Saves all changes
  - Dashboard updates with new AI recommendations
  - Recommended communities & people refresh

### 4. Notifications Page Interactions
- **Notification categories** → Tabs to filter:
  - Community join requests (people asking to join your clubs)
  - Connection requests (friend requests)
  - Event reminders (upcoming events)
  
- **Notification card shows:**
  - Avatar + name
  - Action type (e.g., "requested to join coding club")
  - Timestamp, action buttons
  
- **Accept request** → User joins community or becomes friend
  - Connection confirmed
  
- **Decline / Dismiss** → Remove notification
  - User not added/connected
  
- **View profile** → See sender's full profile
- **Other actions** → Message, block, etc.

### 5. My Profile Page Interactions
- **Profile header** → Shows:
  - Profile photo (click to upload)
  - Cover image (click to upload)
  - Edit profile button
  
- **Basic info section** → Shows:
  - Username, full name, email (read-only)
  - College name, class, division
  - Bio
  
- **Interest tags** → Display your domains
  - Click tag → Shows related communities
  
- **Friends/connections list** → Shows connected students
  - Click friend → View their profile
  
- **Communities I joined** → Shows all communities
  - Click community → Enter community
  
- **Profile stats** → Posts made, replies, communities joined, member since
  
- **Edit profile button** → Opens modal with all editable fields:
  - Photo upload, bio, username
  - Class, division
  - Email is read-only (cannot edit)
  - Save & Cancel buttons
  
- **Save button** → Profile updated, modal closes, success notification

### Cross-Page Navigation
- Sidebar navigation → Jump to any page instantly
- Click interest tag anywhere → Shows related communities
- Click community name → Enter community page
- Click person avatar → View their profile
- All pages have consistent sidebar + top navigation

---

## 🤖 AI INTEGRATION (OPENAI API)

### Community Recommendation Prompt
```
You are a college community recommendation AI.

User Profile:
- Name: [username]
- Interests: [joined interests]
- Joined Communities: [community names]
- Class: [user class]

Available Communities:
[List of communities with name, description, domain, current members count]

Task: Recommend top 10 communities for this student.

For each:
1. Community name
2. Why it's a good match (1 sentence)
3. Relevance score (0-100)

Return as JSON array with: {communityName, reason, score}

Prioritize by:
- Interest alignment (60%)
- Member overlap (20%)
- Activity level (15%)
- Community growth (5%)
```

### People Recommendation Prompt
```
You are a college networking AI.

Current User:
- Name: [username]
- Interests: [interests]
- Joined Communities: [communities]

Available Students:
[List of students with name, interests, communities, class]

Task: Find top 15 students to connect with.

For each match:
- Student name
- Common interests (list)
- Match percentage (0-100)
- Why they'd be good connection (1 sentence)

Return as JSON array with: {studentName, commonInterests, matchPercentage, reason}

Prioritize by:
- Common interests (40%)
- Shared communities (30%)
- Same class/college (20%)
- Engagement level (10%)
```

### Implementation Details
- Cache recommendations for 7 days
- Refresh on interest change
- Fallback: Show popular communities if AI fails
- Rate limit: 1 recommendation generation per user per 24 hours

---

## 📱 FRONTEND DESIGN GUIDELINES

### Design Reference: https://automaterra.webflow.io/
- Modern, minimal aesthetic
- Smooth transitions and animations
- Professional color scheme (white background, accent colors)
- Card-based layouts with subtle shadows
- Responsive mobile design
- Intuitive icons
- Clean typography

### Color Palette (Suggested)
- Primary: Blue (#3B82F6) or Purple (#8B5CF6)
- Secondary: Teal (#14B8A6)
- Accent: Orange (#F97316)
- Background: White (#FFFFFF)
- Text: Dark Gray (#1F2937)
- Borders: Light Gray (#E5E7EB)

### Component Styling
- Border radius: 8-12px
- Shadows: Subtle (0 1px 3px rgba(0,0,0,0.1))
- Spacing: 8px, 16px, 24px, 32px grid
- Font: Inter or Poppins
- Animations: Smooth 200-300ms transitions

---

## 🚀 IMPLEMENTATION PRIORITIES

### Phase 1 (Weeks 1-2): Foundation
1. Setup Next.js project with Auth
2. Create Neon database schema
3. Implement authentication endpoints
4. User registration and email verification
5. Login and JWT tokens
6. Protected routes

### Phase 2 (Weeks 3-4): Core Features
1. User profile endpoints and UI
2. Community CRUD operations
3. Posts and comments system
4. Dashboard with posts feed
5. Interest selection and management

### Phase 3 (Weeks 5-6): Recommendations & Interactions
1. Connection request system
2. Community join workflows
3. Notification system
4. Event management
5. Like/reply on posts

### Phase 4 (Weeks 7-8): AI Integration
1. OpenAI API integration
2. Community recommendation engine
3. People recommendation engine
4. Background jobs for recommendations
5. Caching strategy

### Phase 5 (Weeks 9-10): Polish
1. UI refinement and responsiveness
2. Performance optimization
3. Error handling and validation
4. Loading states
5. Toast notifications

### Phase 6 (Week 11): Deployment
1. Environment setup
2. Backend deployment (Railway/Render)
3. Frontend deployment (Vercel)
4. Database backups
5. Monitoring setup

---

## 🔐 SECURITY REQUIREMENTS

- [ ] Hash passwords with bcrypt (10 rounds minimum)
- [ ] JWT tokens with 15-minute expiry
- [ ] Refresh tokens with 7-day expiry (HTTP-only cookies)
- [ ] Email verification for registration
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Never log passwords or sensitive data
- [ ] Sanitize HTML in user content
- [ ] File upload validation (type, size)

---

## 📊 PERFORMANCE REQUIREMENTS

- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Pagination for large result sets (default 20 per page)
- [ ] Lazy loading for images
- [ ] Database query optimization with proper indexes
- [ ] Cache AI recommendations (Redis or in-memory)
- [ ] Compress responses (gzip)
- [ ] CDN for static assets and images

---

## 🧪 TESTING REQUIREMENTS

Write tests for:
- Authentication flow (signup, verify email, login)
- User profile management
- Community CRUD operations
- Post creation and replies
- Friend request workflow
- Community join workflow
- AI recommendation generation (mock OpenAI)
- Notification creation and retrieval
- Permission/authorization (admin vs user)

---

## 📝 REQUIRED FILES TO CREATE

### Backend
```
backend/
├── .env.example
├── .gitignore
├── package.json
├── server.js
├── config/
│   ├── database.js
│   └── openai.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── models/
│   ├── User.js
│   ├── Community.js
│   ├── Post.js
│   ├── Notification.js
│   ├── ConnectionRequest.js
│   ├── Event.js
│   └── [others from schema]
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── communityRoutes.js
│   ├── postRoutes.js
│   ├── notificationRoutes.js
│   ├── recommendationRoutes.js
│   └── [others]
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── communityController.js
│   ├── postController.js
│   └── [others]
├── services/
│   ├── authService.js
│   ├── emailService.js
│   ├── openaiService.js
│   └── [others]
└── utils/
    ├── errorClasses.js
    ├── validators.js
    └── helpers.js
```

### Frontend
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/
│   │   ├── signup/page.tsx
│   │   ├── login/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   ├── communities/page.tsx
│   │   ├── communities/[id]/page.tsx
│   │   ├── interests/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── profile/[userId]/page.tsx
│   │   └── profile/[userId]/edit/page.tsx
│   └── api/
│       └── [routes for server actions]
├── components/
│   ├── Layout/
│   ├── Dashboard/
│   ├── Communities/
│   ├── Interests/
│   ├── Notifications/
│   ├── Profile/
│   ├── Posts/
│   ├── Auth/
│   └── Common/
├── styles/
│   ├── globals.css
│   └── variables.css
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── constants.ts
│   └── utils.ts
├── store/
│   ├── authSlice.ts
│   ├── userSlice.ts
│   ├── communitySlice.ts
│   └── notificationSlice.ts
├── types/
│   ├── index.ts
│   ├── api.ts
│   └── database.ts
├── .env.example
├── .gitignore
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 🎯 SUCCESS CRITERIA

The project is complete when:
- [x] Users can signup with college email and verify
- [x] Users can select multiple interests
- [x] AI recommends communities based on interests
- [x] AI recommends people based on interests
- [x] Users can join and create communities
- [x] Users can post in communities and reply
- [x] Users can connect with peers
- [x] Dashboard shows personalized feed
- [x] Notifications work for all events
- [x] User profiles are complete
- [x] All CRUD operations work
- [x] UI matches design reference
- [x] Mobile responsive
- [x] All pages protected with auth
- [x] Deployed and live

---

## 📞 DEVELOPMENT NOTES

- Start with backend authentication first
- Create all database tables before controllers
- Test each endpoint with Postman before connecting to frontend
- Use TypeScript for type safety
- Follow RESTful API conventions
- Keep components small and reusable
- Use proper error boundaries in React
- Implement loading states for all async operations
- Add proper logging throughout
- Test AI recommendations thoroughly (mock first)
- Use environment variables for all secrets
- Document all API endpoints

---

## 🚢 DEPLOYMENT CHECKLIST

### Backend (Node.js + Express)
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Email service verified
- [ ] OpenAI API quota set
- [ ] Error tracking (Sentry) setup
- [ ] Logging configured
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Health check endpoint created
- [ ] Deploy to Railway/Render

### Frontend (Next.js)
- [ ] Environment variables set
- [ ] API endpoints configured to backend
- [ ] Analytics enabled
- [ ] Sitemap.xml created
- [ ] robots.txt created
- [ ] Meta tags optimized
- [ ] Images optimized
- [ ] Performance tested
- [ ] Deploy to Vercel

### Database (Neon PostgreSQL)
- [ ] All tables created
- [ ] Indexes created
- [ ] Backups enabled
- [ ] Connection pooling configured
- [ ] SSL enabled

---

## 📚 REFERENCE DOCUMENTS

This prompt includes:
1. Complete database schema (12 tables)
2. 30+ API endpoints with request/response examples
3. Component structure for all pages
4. Complete app flow with button interactions
5. AI prompt templates
6. Security and performance requirements
7. Implementation timeline
8. Deployment instructions

---

## ⚡ START BUILDING!

You now have everything needed to build this website. Follow this structure:

1. Create Next.js project
2. Setup Neon database
3. Create backend API (Node.js)
4. Implement authentication
5. Create database models
6. Build API endpoints
7. Create frontend components
8. Integrate AI recommendations
9. Polish and deploy

**All details are specified above. Begin coding!**

---

**Generated for: AI Agent / Claude Code / ChatGPT / Emergent**  
**Project:** Smart Community Website for College Students  
**Status:** Ready to Build  
**Date:** 2024
