# Backend Schema & Implementation Plan
## Smart Community Website for College Students

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Business Logic & Workflows](#business-logic--workflows)
7. [AI Integration (OpenAI)](#ai-integration-openai)
8. [Implementation Timeline](#implementation-timeline)
9. [Code Structure](#code-structure)

---

## Project Overview

**Project Name:** Smart Community Website for College Students

**Purpose:** Connect college students based on their interests and domains (coding, music, art, fitness, etc.). AI suggests communities and peers. Students can discover communities, join, create, and collaborate.

**Key Features:**
- Email-based signup with college email verification
- Interest-based community discovery
- AI-powered community and people recommendations
- Community management (create, join, moderate)
- Real-time notifications and event management
- User profiles and connections

**Target Users:** College students aged 18-25

---

## Technology Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB (NoSQL) + Redis (caching)
- **Authentication:** JWT (JSON Web Tokens)
- **Email Service:** Nodemailer + SendGrid
- **AI/ML:** OpenAI API (GPT-4)
- **File Storage:** Cloudinary (images) or AWS S3
- **Deployment:** Docker + AWS EC2 / Heroku

### Frontend
- **Framework:** React.js (Vite)
- **State Management:** Redux Toolkit
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios

### DevOps & Tools
- **Version Control:** Git
- **Environment:** .env configuration
- **Testing:** Jest, Mocha
- **Logging:** Winston, Morgan
- **API Documentation:** Swagger/OpenAPI

---

## Database Schema

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  
  // Authentication
  email: String (unique, indexed),
  password: String (hashed),
  emailVerified: Boolean,
  emailVerificationToken: String,
  emailVerificationExpiresAt: Date,
  
  // Profile Information
  username: String (unique, indexed),
  firstName: String,
  lastName: String,
  bio: String,
  profilePhoto: String (URL from Cloudinary),
  coverImage: String (URL),
  
  // College Information
  collegeEmail: String (unique, indexed),
  collegeName: String,
  class: String (e.g., "Second Year", "Final Year"),
  division: String (e.g., "A", "B", "C"),
  
  // Interests & Domains
  interests: Array<String> (e.g., ["coding", "music", "art"]),
  domainTags: Array<String>, // Primary categories
  
  // Community & Connection Info
  joinedCommunities: Array<ObjectId> (references to Communities),
  createdCommunities: Array<ObjectId> (user is admin),
  friends: Array<ObjectId> (connected users),
  blockedUsers: Array<ObjectId>,
  
  // Statistics
  totalPosts: Number,
  totalReplies: Number,
  totalCommunitiesJoined: Number,
  memberSinceDate: Date,
  
  // Settings & Preferences
  notificationPreferences: {
    emailNotifications: Boolean,
    communityJoinNotifications: Boolean,
    friendRequestNotifications: Boolean,
    eventReminderNotifications: Boolean,
    newPostNotifications: Boolean
  },
  
  privacySetting: Enum (public, friends-only, private),
  isActive: Boolean,
  isAdmin: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

**Indexes:**
- `email` (unique)
- `username` (unique)
- `collegeEmail` (unique)
- `interests` (array index)
- `joinedCommunities` (array index)

---

### 2. Communities Collection

```javascript
{
  _id: ObjectId,
  
  // Basic Info
  name: String (unique, indexed),
  slug: String (unique, URL-friendly),
  description: String (max 500 chars),
  icon: String (URL),
  banner: String (URL),
  
  // Domain & Categorization
  domain: String (e.g., "coding", "music", "art"),
  tags: Array<String> (multiple domains),
  category: Enum (academic, hobby, sports, cultural, tech, etc.),
  
  // Membership
  admin: ObjectId (reference to User),
  moderators: Array<ObjectId>,
  members: Array<ObjectId> (indexed),
  totalMembers: Number,
  
  // Community Settings
  isPublic: Boolean,
  requiresApproval: Boolean (for membership),
  rules: String,
  
  // Activity Metrics
  totalPosts: Number,
  totalMembers: Number,
  totalEvents: Number,
  averageEngagement: Number,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  lastActivityAt: Date,
  
  // AI Metadata (for recommendations)
  similarCommunities: Array<ObjectId>,
  recommendationScore: Number (0-100)
}
```

**Indexes:**
- `name` (unique)
- `slug` (unique)
- `domain` (indexed)
- `tags` (array index)
- `members` (array index)
- `admin` (indexed)

---

### 3. Posts Collection

```javascript
{
  _id: ObjectId,
  
  // Content
  title: String,
  content: String,
  media: Array<String> (URLs),
  
  // Relationships
  communityId: ObjectId (reference to Community, indexed),
  authorId: ObjectId (reference to User, indexed),
  threadId: ObjectId (for nested replies, indexed),
  parentPostId: ObjectId (for replies),
  
  // Engagement
  likes: Array<ObjectId> (user IDs who liked),
  likeCount: Number,
  replyCount: Number,
  replies: Array<ObjectId> (nested post IDs),
  
  // Status
  isApproved: Boolean (moderator approval),
  isPinned: Boolean (community-wide pin),
  isDeleted: Boolean (soft delete),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  
  // AI Metadata
  sentiment: Enum (positive, neutral, negative),
  flaggedForReview: Boolean
}
```

**Indexes:**
- `communityId` (indexed)
- `authorId` (indexed)
- `threadId` (indexed)
- `createdAt` (indexed)
- `likes` (array index for quick count)

---

### 4. Comments Collection (Alternative: Nested in Posts)

```javascript
{
  _id: ObjectId,
  
  // Content
  content: String,
  media: Array<String> (URLs),
  
  // Relationships
  postId: ObjectId (reference to Post, indexed),
  authorId: ObjectId (reference to User, indexed),
  communityId: ObjectId (reference to Community, indexed),
  
  // Engagement
  likes: Array<ObjectId>,
  likeCount: Number,
  
  // Status
  isApproved: Boolean,
  isDeleted: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

### 5. Notifications Collection

```javascript
{
  _id: ObjectId,
  
  // Target & Source
  userId: ObjectId (who receives notification, indexed),
  triggeredBy: ObjectId (who triggered - user/system),
  
  // Notification Type
  type: Enum (
    community_join_request,
    community_join_approved,
    friend_request,
    friend_request_accepted,
    new_post,
    post_reply,
    event_reminder,
    user_mention,
    community_invite
  ),
  
  // Content
  title: String,
  message: String,
  icon: String,
  actionUrl: String (link to related resource),
  
  // Related Data
  relatedEntityId: ObjectId (community, post, user, event),
  relatedEntityType: Enum (community, post, user, event),
  
  // Status
  isRead: Boolean,
  isArchived: Boolean,
  
  // Timestamps
  createdAt: Date,
  expiresAt: Date (TTL index for auto-deletion)
}
```

**Indexes:**
- `userId` (indexed)
- `type` (indexed)
- `isRead` (indexed)
- `createdAt` (indexed, descending)
- `expiresAt` (TTL index)

---

### 6. Connection Requests Collection

```javascript
{
  _id: ObjectId,
  
  // Users
  fromUserId: ObjectId (who sent request, indexed),
  toUserId: ObjectId (who receives request, indexed),
  
  // Status
  status: Enum (pending, accepted, rejected, blocked),
  
  // Message (Optional)
  message: String,
  
  // Timestamps
  createdAt: Date,
  respondedAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `fromUserId` (indexed)
- `toUserId` (indexed)
- `status` (indexed)
- Unique compound index on `fromUserId` + `toUserId`

---

### 7. Community Join Requests Collection

```javascript
{
  _id: ObjectId,
  
  // Users & Community
  userId: ObjectId (who wants to join, indexed),
  communityId: ObjectId (which community, indexed),
  adminId: ObjectId (who can approve),
  
  // Status
  status: Enum (pending, approved, rejected),
  
  // Reason/Message
  message: String (why they want to join),
  
  // Admin Response
  adminMessage: String,
  
  // Timestamps
  createdAt: Date,
  respondedAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (indexed)
- `communityId` (indexed)
- `status` (indexed)
- Unique compound index on `userId` + `communityId`

---

### 8. Events Collection

```javascript
{
  _id: ObjectId,
  
  // Event Info
  title: String,
  description: String,
  eventType: Enum (meeting, workshop, competition, social, webinar),
  
  // Community
  communityId: ObjectId (indexed),
  createdBy: ObjectId (user ID),
  
  // Details
  startDate: Date,
  endDate: Date,
  location: String (online or offline),
  eventLink: String (Zoom, Google Meet, etc.),
  
  // Participation
  attendees: Array<ObjectId> (RSVPed users),
  interestedCount: Number,
  goingCount: Number,
  
  // Cover
  coverImage: String (URL),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `communityId` (indexed)
- `startDate` (indexed)
- `createdBy` (indexed)

---

### 9. AI Recommendations Collection

```javascript
{
  _id: ObjectId,
  
  // User
  userId: ObjectId (indexed),
  
  // Recommendations
  recommendedCommunities: Array<{
    communityId: ObjectId,
    score: Number (0-100),
    reason: String,
    tags: Array<String>
  }>,
  
  recommendedPeople: Array<{
    userId: ObjectId,
    matchPercentage: Number (0-100),
    commonInterests: Array<String>,
    reason: String
  }>,
  
  // Metadata
  generatedAt: Date,
  expiresAt: Date (refresh recommendations),
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId` (indexed)
- `expiresAt` (TTL index)

---

### 10. Interest Tags Collection (Reference)

```javascript
{
  _id: ObjectId,
  
  // Tag Info
  name: String (unique, indexed),
  slug: String (unique),
  description: String,
  icon: String (emoji or SVG),
  
  // Popularity
  usageCount: Number,
  isActive: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `name` (unique)
- `slug` (unique)
- `usageCount` (descending)

---

### 11. Email Verification Tokens Collection (TTL)

```javascript
{
  _id: ObjectId,
  
  // User & Token
  userId: ObjectId,
  email: String,
  token: String (unique, indexed),
  
  // Type
  type: Enum (email_verification, password_reset),
  
  // Timestamps
  createdAt: Date,
  expiresAt: Date (TTL index - 24 hours)
}
```

**Indexes:**
- `token` (unique)
- `userId` (indexed)
- `expiresAt` (TTL index)

---

### 12. Activity Log Collection (Optional)

```javascript
{
  _id: ObjectId,
  
  // User
  userId: ObjectId (indexed),
  
  // Action
  action: String (e.g., "joined_community", "created_post", "sent_friend_request"),
  actionType: Enum (create, update, delete, join, leave, like),
  
  // Related Entity
  relatedEntityId: ObjectId,
  relatedEntityType: Enum (community, post, user, event),
  
  // IP & Device
  ipAddress: String,
  userAgent: String,
  
  // Timestamps
  createdAt: Date
}
```

**Indexes:**
- `userId` (indexed)
- `action` (indexed)
- `createdAt` (indexed)

---

## API Endpoints

### Authentication Endpoints

#### 1. Register User
```
POST /api/v1/auth/register
Content-Type: application/json

Request:
{
  "email": "student@college.edu",
  "firstName": "John",
  "lastName": "Doe",
  "password": "securePassword123",
  "collegeName": "University Name",
  "class": "Second Year",
  "division": "A"
}

Response (201):
{
  "success": true,
  "message": "Registration successful. Verification email sent.",
  "data": {
    "userId": "userId123",
    "email": "student@college.edu"
  }
}
```

#### 2. Verify Email
```
POST /api/v1/auth/verify-email
Content-Type: application/json

Request:
{
  "token": "emailVerificationToken"
}

Response (200):
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": { ...user object }
  }
}
```

#### 3. Login
```
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
  "email": "student@college.edu",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "user": { ...user object }
  }
}
```

#### 4. Refresh Token
```
POST /api/v1/auth/refresh-token
Content-Type: application/json

Request:
{
  "refreshToken": "refresh_token"
}

Response (200):
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

#### 5. Logout
```
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### User Endpoints

#### 1. Get User Profile
```
GET /api/v1/users/:userId
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": { ...user object }
}
```

#### 2. Update User Profile
```
PUT /api/v1/users/:userId
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "firstName": "Updated",
  "bio": "New bio",
  "profilePhoto": "image_url"
}

Response (200):
{
  "success": true,
  "data": { ...updated user object }
}
```

#### 3. Update User Interests
```
PUT /api/v1/users/:userId/interests
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "interests": ["coding", "music", "fitness"]
}

Response (200):
{
  "success": true,
  "message": "Interests updated. AI generating new recommendations...",
  "data": { ...user object }
}
```

#### 4. Get User's Friends List
```
GET /api/v1/users/:userId/friends
Authorization: Bearer {accessToken}

Query Parameters:
- page: Number (default: 1)
- limit: Number (default: 20)

Response (200):
{
  "success": true,
  "data": {
    "friends": [ ...array of user objects ],
    "totalCount": 45,
    "page": 1,
    "hasMore": true
  }
}
```

#### 5. Get User's Joined Communities
```
GET /api/v1/users/:userId/communities
Authorization: Bearer {accessToken}

Query Parameters:
- page: Number
- limit: Number

Response (200):
{
  "success": true,
  "data": {
    "communities": [ ...array of community objects ],
    "totalCount": 12
  }
}
```

---

### Community Endpoints

#### 1. Create Community
```
POST /api/v1/communities
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "name": "Web Development Club",
  "description": "For learning and discussing web technologies",
  "domain": "coding",
  "tags": ["coding", "web", "javascript"],
  "isPublic": true,
  "rules": "Be respectful..."
}

Response (201):
{
  "success": true,
  "data": { ...community object }
}
```

#### 2. Get All Communities
```
GET /api/v1/communities
Authorization: Bearer {accessToken}

Query Parameters:
- domain: String (filter by domain)
- tags: Array<String> (filter by tags)
- search: String (search by name)
- page: Number
- limit: Number
- sortBy: Enum (members, activity, new)

Response (200):
{
  "success": true,
  "data": {
    "communities": [ ...array ],
    "totalCount": 150,
    "page": 1
  }
}
```

#### 3. Get Community Details
```
GET /api/v1/communities/:communityId
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": { ...full community object with posts }
}
```

#### 4. Join Community
```
POST /api/v1/communities/:communityId/join
Authorization: Bearer {accessToken}

Response (201):
{
  "success": true,
  "message": "Successfully joined community"
}
```

#### 5. Leave Community
```
POST /api/v1/communities/:communityId/leave
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Left community successfully"
}
```

#### 6. Get Community Members
```
GET /api/v1/communities/:communityId/members
Authorization: Bearer {accessToken}

Query Parameters:
- page: Number
- limit: Number

Response (200):
{
  "success": true,
  "data": {
    "members": [ ...array of user objects ],
    "totalCount": 234
  }
}
```

#### 7. Update Community (Admin Only)
```
PUT /api/v1/communities/:communityId
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "description": "Updated description",
  "rules": "Updated rules"
}

Response (200):
{
  "success": true,
  "data": { ...updated community object }
}
```

---

### Post Endpoints

#### 1. Create Post
```
POST /api/v1/communities/:communityId/posts
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "title": "How to learn React?",
  "content": "I'm new to React and want to know best practices...",
  "media": ["image_url1", "image_url2"]
}

Response (201):
{
  "success": true,
  "data": { ...post object }
}
```

#### 2. Get Community Posts
```
GET /api/v1/communities/:communityId/posts
Authorization: Bearer {accessToken}

Query Parameters:
- page: Number
- limit: Number
- sortBy: Enum (recent, popular, trending)

Response (200):
{
  "success": true,
  "data": {
    "posts": [ ...array of post objects ],
    "totalCount": 450,
    "page": 1
  }
}
```

#### 3. Get Post Details
```
GET /api/v1/posts/:postId
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": { ...full post object with comments/replies }
}
```

#### 4. Like Post
```
POST /api/v1/posts/:postId/like
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": { "likeCount": 45 }
}
```

#### 5. Unlike Post
```
DELETE /api/v1/posts/:postId/like
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": { "likeCount": 44 }
}
```

#### 6. Add Reply to Post
```
POST /api/v1/posts/:postId/replies
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "content": "Great question! Here's my approach...",
  "media": []
}

Response (201):
{
  "success": true,
  "data": { ...reply post object }
}
```

#### 7. Delete Post (Own Posts Only)
```
DELETE /api/v1/posts/:postId
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Post deleted successfully"
}
```

---

### Notification Endpoints

#### 1. Get All Notifications
```
GET /api/v1/notifications
Authorization: Bearer {accessToken}

Query Parameters:
- type: Enum (filter by type)
- isRead: Boolean
- page: Number
- limit: Number

Response (200):
{
  "success": true,
  "data": {
    "notifications": [ ...array of notification objects ],
    "totalCount": 23,
    "unreadCount": 5
  }
}
```

#### 2. Mark Notification as Read
```
PATCH /api/v1/notifications/:notificationId/read
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": { ...updated notification object }
}
```

#### 3. Mark All Notifications as Read
```
PATCH /api/v1/notifications/read-all
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "All notifications marked as read"
}
```

#### 4. Delete Notification
```
DELETE /api/v1/notifications/:notificationId
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### Connection Request Endpoints

#### 1. Send Connection Request
```
POST /api/v1/connections/request
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "toUserId": "userId123",
  "message": "Let's connect!" (optional)
}

Response (201):
{
  "success": true,
  "message": "Connection request sent"
}
```

#### 2. Accept Connection Request
```
POST /api/v1/connections/request/:requestId/accept
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Connection accepted"
}
```

#### 3. Reject Connection Request
```
POST /api/v1/connections/request/:requestId/reject
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Connection request rejected"
}
```

#### 4. Get Pending Requests
```
GET /api/v1/connections/requests/pending
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "pendingRequests": [ ...array of request objects ],
    "count": 7
  }
}
```

---

### Community Join Request Endpoints

#### 1. Request to Join Community
```
POST /api/v1/communities/:communityId/join-request
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "message": "I want to join because..." (optional)
}

Response (201):
{
  "success": true,
  "message": "Join request sent to community admin"
}
```

#### 2. Get Pending Join Requests (Admin)
```
GET /api/v1/communities/:communityId/join-requests
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "joinRequests": [ ...array of request objects ],
    "count": 12
  }
}
```

#### 3. Approve Join Request (Admin)
```
POST /api/v1/communities/:communityId/join-requests/:requestId/approve
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "User added to community"
}
```

#### 4. Reject Join Request (Admin)
```
POST /api/v1/communities/:communityId/join-requests/:requestId/reject
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Join request rejected"
}
```

---

### Event Endpoints

#### 1. Create Event
```
POST /api/v1/communities/:communityId/events
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "title": "JavaScript Workshop",
  "description": "Learn advanced JS concepts",
  "startDate": "2024-02-15T18:00:00Z",
  "endDate": "2024-02-15T20:00:00Z",
  "location": "Online",
  "eventLink": "https://meet.google.com/xyz",
  "coverImage": "image_url"
}

Response (201):
{
  "success": true,
  "data": { ...event object }
}
```

#### 2. Get Community Events
```
GET /api/v1/communities/:communityId/events
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "data": {
    "events": [ ...array of event objects ],
    "totalCount": 8
  }
}
```

#### 3. RSVP to Event
```
POST /api/v1/events/:eventId/rsvp
Authorization: Bearer {accessToken}
Content-Type: application/json

Request:
{
  "status": "going" // or "interested"
}

Response (200):
{
  "success": true,
  "message": "RSVP confirmed"
}
```

---

### AI Recommendation Endpoints

#### 1. Get Recommended Communities
```
GET /api/v1/recommendations/communities
Authorization: Bearer {accessToken}

Query Parameters:
- limit: Number (default: 10)

Response (200):
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "communityId": "communityId123",
        "name": "Data Science Hub",
        "matchScore": 92,
        "reason": "Based on your coding and data interests",
        "tags": ["coding", "data-science"]
      }
    ]
  }
}
```

#### 2. Get Recommended People
```
GET /api/v1/recommendations/people
Authorization: Bearer {accessToken}

Query Parameters:
- limit: Number (default: 10)

Response (200):
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "userId": "userId123",
        "firstName": "Jane",
        "lastName": "Doe",
        "matchPercentage": 85,
        "commonInterests": ["coding", "music"],
        "profilePhoto": "url"
      }
    ]
  }
}
```

#### 3. Trigger AI Recommendation Generation
```
POST /api/v1/recommendations/generate
Authorization: Bearer {accessToken}

Response (202):
{
  "success": true,
  "message": "Recommendations are being generated. You'll be notified when ready."
}
```

---

## Authentication & Authorization

### JWT Strategy

**Access Token:**
- Expiry: 15 minutes
- Used for API requests
- Contains: userId, role, permissions

**Refresh Token:**
- Expiry: 7 days
- Stored securely (HTTP-only cookie)
- Used to get new access token

**Token Payload:**
```javascript
{
  "userId": "userId123",
  "email": "student@college.edu",
  "username": "johndoe",
  "role": "user", // or "admin", "moderator"
  "permissions": ["read", "write"],
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Authorization Levels

| Role | Permissions |
|------|-------------|
| User | Read posts, create posts in joined communities, view profiles, send friend requests |
| Moderator | Approve posts, remove inappropriate content, manage community discussions |
| Admin (Community) | Create/edit community, manage members, approve join requests, moderate content |
| Admin (Platform) | Full access, user management, community management, system settings |

### Middleware

```javascript
// Authentication middleware
authMiddleware(req, res, next)
  - Verify JWT token
  - Attach user info to request
  - Return 401 if unauthorized

// Authorization middleware
authorizationMiddleware(requiredRole)
  - Check user role
  - Verify permissions
  - Return 403 if not authorized

// CORS middleware
  - Allow requests from frontend domain

// Rate limiting
  - 100 requests per 15 minutes per user
```

---

## Business Logic & Workflows

### 1. User Registration & Email Verification

```
Flow:
1. User submits registration form
2. System validates email (college domain only)
3. Password hashed using bcrypt (10 salt rounds)
4. User created with emailVerified = false
5. Email verification token generated (expires in 24 hours)
6. Verification email sent
7. User clicks link in email
8. Token validated
9. emailVerified = true
10. User logged in automatically
11. Redirected to interest selection

Error Handling:
- Duplicate email → 400 Bad Request
- Invalid college email → 400 Bad Request
- Token expired → 410 Gone (resend email)
```

### 2. Community Recommendation Workflow

```
Trigger: User updates interests or joins new community

Process:
1. Get user's interests array
2. Get user's activity history
3. Call OpenAI API with prompt:
   "Suggest 10 communities for a student interested in [interests]
    who has joined [communities]. Rate by relevance 0-100.
    Return JSON with communityName, description, relevance."
4. System matches API results with existing communities
5. Score each match based on:
   - Interest alignment (60%)
   - Member overlap (20%)
   - Activity level (15%)
   - Community growth (5%)
6. Store recommendations in AI Recommendations collection
7. Return top 10 to user
8. Send notification "New community recommendations available"

Cache Duration: 7 days
Refresh: On interest change or community join
```

### 3. People Recommendation Workflow

```
Trigger: User clicks "Find new people" button

Process:
1. Get current user's interests
2. Query AI Recommendations collection for cached matches
3. If cache valid (< 24 hours old):
   - Return cached results
4. Else:
   - Call OpenAI API:
     "Find 15 students who share interests with a user interested in
      [user interests]. They have joined [communities].
      Prioritize by:
      - Common interests (40%)
      - Similar community membership (30%)
      - Location/class (20%)
      - Activity level (10%)
      Return JSON with studentId, commonInterests, matchPercentage."
5. Filter out:
   - Blocked users
   - Already connected
   - Self
6. Score and rank results
7. Store in cache
8. Return to frontend
9. User can send connection requests

Cache Duration: 24 hours
Result Limit: 15 people
```

### 4. Community Join Request Workflow

```
Scenario A: Public Community
1. User clicks "Join" on community
2. Automatically added to community
3. Notification: "You joined [community]"
4. Post created in activity log
5. Dashboard updated

Scenario B: Private Community (with approval)
1. User clicks "Request to join"
2. Optional message from user
3. Join request stored with status = "pending"
4. Admin notified: "[User] requested to join your community"
5. Admin reviews request
6. Admin approves:
   - User added to members
   - Notification sent to user
   - Join request.status = "approved"
7. Admin rejects:
   - Join request.status = "rejected"
   - Notification sent: "Request rejected"
```

### 5. Notification Workflow

```
Notification Triggered By:
a) User joins community
   - Send to user
   - Type: community_join_approved

b) User receives friend request
   - Send to recipient
   - Type: friend_request
   - From: requesterId

c) New post in community
   - Send to all members
   - Type: new_post
   - Depends on notification preferences

d) Reply to your post
   - Type: post_reply
   - Mention in content

e) Event coming up
   - Type: event_reminder
   - Sent 24 hours before event

Notification Storage:
- All stored in Notifications collection
- Soft delete (isArchived = true)
- TTL index: auto-delete after 90 days

Notification Delivery:
- Real-time via WebSocket (Socket.IO)
- Email digests (daily/weekly based on preference)
- In-app badge count
```

### 6. Post Engagement Workflow

```
User Creates Post:
1. Validate content (no spam, profanity check via API)
2. Extract media if any
3. Generate sentiment analysis via OpenAI
4. Set isApproved based on moderator settings
5. Create post object
6. Increment community.totalPosts
7. Create activity log entry
8. Send notification to community members
9. Update user's totalPosts count
10. Return post to user

User Replies to Post:
1. System checks if reply is valid
2. Creates new post with parentPostId
3. Increments parent post's replyCount
4. Notifies post author
5. Notifies others in thread

User Likes Post:
1. Check if user already liked
2. Add userId to likes array
3. Increment likeCount
4. Notify post author (once per user)
5. Return updated count
```

---

## AI Integration (OpenAI)

### 1. Community Recommendation Prompt

```javascript
const communityPrompt = `
You are a helpful college community recommendation system.

User Profile:
- Interests: ${userInterests.join(", ")}
- Joined Communities: ${joinedCommunities.map(c => c.name).join(", ")}
- Class: ${userClass}
- Division: ${userDivision}

Available Communities:
${communitiesData.map(c => `- ${c.name}: ${c.description} (Domain: ${c.domain})`).join("\n")}

Task: Recommend the top 10 most relevant communities for this user.

For each recommendation, provide:
1. Community name
2. Why it's a good match (1 sentence)
3. Relevance score (0-100)

Format as JSON array with objects containing: communityName, reason, score

Be thoughtful and personalized in your recommendations.
`;
```

### 2. People Recommendation Prompt

```javascript
const peoplePrompt = `
You are a smart college networking assistant.

Current User:
- Name: ${userName}
- Interests: ${userInterests.join(", ")}
- Joined Communities: ${userCommunities.join(", ")}

Available Students (filtered):
${studentsData.map(s => `
- ${s.firstName} ${s.lastName}
  Interests: ${s.interests.join(", ")}
  Communities: ${s.joinedCommunities.slice(0, 5).join(", ")}
  Class: ${s.class}
`).join("\n")}

Task: Find the top 15 students this user should connect with.

Prioritize by:
1. Common interests (40%)
2. Shared communities (30%)
3. Same class/college (20%)
4. Engagement level (10%)

For each match, provide:
- Student name
- Common interests (list)
- Match percentage (0-100)
- One sentence on why they'd be a good connection

Format as JSON array with objects: studentName, commonInterests, matchPercentage, reason
`;
```

### 3. Content Moderation Prompt

```javascript
const moderationPrompt = `
Review this community post for appropriateness:

"${postContent}"

Check for:
1. Spam or self-promotion
2. Harassment or hate speech
3. Adult content
4. Misinformation
5. Copyright violations

Respond with JSON:
{
  "approved": boolean,
  "score": 0-100 (100 = perfectly appropriate),
  "issues": ["issue1", "issue2"],
  "reason": "explanation if not approved"
}
`;
```

### 4. AI Integration Code Pattern

```javascript
// Backend service
const openaiService = {
  async generateCommunityRecommendations(userId) {
    const user = await User.findById(userId);
    const communities = await Community.find({});
    
    const prompt = buildCommunityPrompt(user, communities);
    
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a college community recommendation AI."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      
      const recommendations = JSON.parse(response.choices[0].message.content);
      
      // Store in cache
      await AIRecommendation.create({
        userId,
        recommendedCommunities: recommendations,
        generatedAt: new Date(),
        expiresAt: addDays(new Date(), 7)
      });
      
      return recommendations;
    } catch (error) {
      logger.error("AI recommendation failed:", error);
      // Return cached recommendations or popular communities
      return getFallbackRecommendations(userId);
    }
  }
};
```

### API Rate Limits
- Community recommendations: 1 per user per 7 days
- People recommendations: 1 per user per 24 hours
- Content moderation: All posts
- Fallback: Use cached results if API fails

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- [ ] Setup Node.js + Express backend
- [ ] MongoDB database setup & schema creation
- [ ] User authentication (register, login, email verification)
- [ ] JWT implementation
- [ ] Environment configuration

### Phase 2: Core Features (Weeks 3-4)
- [ ] User profile endpoints (get, update)
- [ ] Community CRUD operations
- [ ] Posts and comments system
- [ ] Notification system setup

### Phase 3: Connections & Interactions (Weeks 5-6)
- [ ] Connection request system
- [ ] Community join request workflow
- [ ] Events system
- [ ] Engagement features (like, reply)

### Phase 4: AI Integration (Weeks 7-8)
- [ ] OpenAI API integration
- [ ] Community recommendation engine
- [ ] People recommendation engine
- [ ] Content sentiment analysis

### Phase 5: Polish & Optimization (Weeks 9-10)
- [ ] Performance optimization
- [ ] Caching strategy (Redis)
- [ ] Security hardening
- [ ] API documentation (Swagger)
- [ ] Unit & integration tests

### Phase 6: Deployment (Week 11)
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] AWS/Heroku deployment
- [ ] Monitoring & logging

---

## Code Structure

### Folder Organization

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   ├── redis.js             # Redis setup
│   ├── openai.js            # OpenAI API setup
│   └── environment.js       # Environment variables
│
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── authorization.js     # Role-based access
│   ├── errorHandler.js      # Error handling
│   ├── validation.js        # Input validation
│   └── rateLimit.js         # Rate limiting
│
├── models/
│   ├── User.js
│   ├── Community.js
│   ├── Post.js
│   ├── Comment.js
│   ├── Notification.js
│   ├── ConnectionRequest.js
│   ├── CommunityJoinRequest.js
│   ├── Event.js
│   ├── AIRecommendation.js
│   ├── InterestTag.js
│   ├── EmailVerificationToken.js
│   └── ActivityLog.js
│
├── routes/
│   ├── authRoutes.js        # /api/v1/auth
│   ├── userRoutes.js        # /api/v1/users
│   ├── communityRoutes.js   # /api/v1/communities
│   ├── postRoutes.js        # /api/v1/posts
│   ├── notificationRoutes.js # /api/v1/notifications
│   ├── connectionRoutes.js  # /api/v1/connections
│   ├── eventRoutes.js       # /api/v1/events
│   └── recommendationRoutes.js # /api/v1/recommendations
│
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── communityController.js
│   ├── postController.js
│   ├── notificationController.js
│   ├── connectionController.js
│   ├── eventController.js
│   └── recommendationController.js
│
├── services/
│   ├── emailService.js      # Email sending (SendGrid/Nodemailer)
│   ├── openaiService.js     # AI integration
│   ├── authService.js       # Auth logic
│   ├── communityService.js  # Community logic
│   ├── recommendationService.js # AI recommendations
│   ├── notificationService.js # Notification logic
│   └── storageService.js    # Cloudinary/S3 integration
│
├── utils/
│   ├── logger.js            # Logging (Winston)
│   ├── validators.js        # Input validators
│   ├── constants.js         # App constants
│   ├── helpers.js           # Utility functions
│   └── errorClasses.js      # Custom error classes
│
├── jobs/
│   ├── emailJobs.js         # Background email tasks (Bull)
│   ├── aiRecommendationJobs.js # AI job scheduler
│   └── notificationJobs.js  # Notification scheduling
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
├── server.js                # Entry point
└── README.md
```

### Sample Controller Structure

```javascript
// controllers/communityController.js

class CommunityController {
  async createCommunity(req, res, next) {
    try {
      const { name, description, domain, tags } = req.body;
      const userId = req.user.id;
      
      // Validation
      if (!name || !description) {
        throw new ValidationError("Missing required fields");
      }
      
      // Create community
      const community = await Community.create({
        name,
        description,
        domain,
        tags,
        admin: userId,
        members: [userId]
      });
      
      // Log activity
      await ActivityLog.create({
        userId,
        action: "created_community",
        relatedEntityId: community._id,
        relatedEntityType: "community"
      });
      
      res.status(201).json({
        success: true,
        data: community
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getCommunities(req, res, next) {
    try {
      const { domain, tags, search, page = 1, limit = 10, sortBy } = req.query;
      
      // Build filter
      const filter = {};
      if (domain) filter.domain = domain;
      if (tags) filter.tags = { $in: tags };
      if (search) filter.name = { $regex: search, $options: "i" };
      
      // Get paginated results
      const skip = (page - 1) * limit;
      const communities = await Community.find(filter)
        .sort(getSortOption(sortBy))
        .skip(skip)
        .limit(parseInt(limit))
        .select("-members"); // Exclude members for performance
      
      const totalCount = await Community.countDocuments(filter);
      
      res.json({
        success: true,
        data: {
          communities,
          totalCount,
          page: parseInt(page),
          hasMore: skip + communities.length < totalCount
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // ... other methods
}

module.exports = new CommunityController();
```

### Sample Service Structure

```javascript
// services/openaiService.js

class OpenAIService {
  async generateCommunityRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId);
      const communities = await Community.find({})
        .select("name description domain tags members");
      
      const prompt = this.buildCommunityPrompt(user, communities);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful college community recommendation system."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      
      const content = response.choices[0].message.content;
      const recommendations = JSON.parse(content);
      
      return recommendations.slice(0, limit);
    } catch (error) {
      logger.error("OpenAI recommendation error:", error);
      return this.getFallbackRecommendations(userId);
    }
  }
  
  buildCommunityPrompt(user, communities) {
    return `
      You are a college community recommendation AI...
      [prompt content]
    `;
  }
  
  // ... other methods
}

module.exports = new OpenAIService();
```

---

## Error Handling Strategy

### Custom Error Classes

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}
```

### Error Handling Middleware

```javascript
app.use((err, req, res, next) => {
  const { message, statusCode = 500, name } = err;
  
  logger.error(`${name}: ${message}`);
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      type: name,
      timestamp: new Date().toISOString(),
      requestId: req.id
    }
  });
});
```

---

## Environment Variables (.env)

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email Service
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@community.app

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# File Storage
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug
```

---

## Security Considerations

### Input Validation
- Validate all user inputs using libraries like `joi` or `zod`
- Sanitize HTML to prevent XSS
- Check file types for uploads

### Password Security
- Hash passwords with bcrypt (minimum 10 rounds)
- Enforce strong password requirements
- Never log passwords

### API Security
- HTTPS only
- CORS properly configured
- Rate limiting on authentication endpoints
- SQL/NoSQL injection prevention

### Data Protection
- Encrypt sensitive data at rest
- Use secure HTTP-only cookies for tokens
- Implement proper access control
- Audit logging for sensitive operations

### Email Verification
- 24-hour token expiration
- Single-use tokens
- Secure token generation

---

## Performance Optimization

### Caching Strategy
- Cache community lists (Redis, 1 hour)
- Cache user recommendations (7 days or on interest change)
- Cache popular posts (1 hour)
- Cache interest tags (24 hours)

### Database Optimization
- Proper indexing on frequently queried fields
- Pagination for large result sets
- Select only needed fields in queries
- Connection pooling

### API Optimization
- Response compression (gzip)
- Image optimization and CDN delivery
- Batch operations where possible
- Async processing for heavy tasks (Bull queue)

---

## Testing Strategy

### Unit Tests
```javascript
// tests/unit/communityController.test.js
describe("Community Controller", () => {
  describe("getCommunities", () => {
    it("should return paginated communities", async () => {
      // Test implementation
    });
    
    it("should filter by domain", async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests
- Test complete workflows
- Test API endpoints
- Test database operations

### E2E Tests
- User registration to dashboard
- Create community workflow
- Join and post workflow

---

## Monitoring & Logging

### Logging (Winston)
```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" })
  ]
});
```

### Monitoring
- Server uptime monitoring
- Database performance metrics
- API response times
- Error rate tracking
- User activity analytics

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)
- [ ] Database migrations tested
- [ ] API documentation deployed
- [ ] Email service verified
- [ ] OpenAI API quotas set
- [ ] File storage configured
- [ ] CDN setup for images
- [ ] Health check endpoints created
- [ ] Performance optimized

---

## Key Metrics to Track

1. **User Metrics**
   - New signups per day
   - Email verification rate
   - User retention (7-day, 30-day)
   - Monthly active users

2. **Community Metrics**
   - Communities created per week
   - Members per community (avg)
   - Posts per community per day
   - Community engagement rate

3. **AI Metrics**
   - Recommendation accuracy
   - Click-through rate on recommendations
   - AI API response time
   - Failed AI requests

4. **Performance Metrics**
   - API response time (p50, p95, p99)
   - Database query time
   - Error rate
   - Cache hit rate

---

## Next Steps for AI Agent

When implementing this backend:

1. **Start with authentication** - It's foundational
2. **Setup database models** - All schemas are defined
3. **Create API routes and controllers** - All endpoints documented
4. **Implement business logic** - Workflows provided
5. **Integrate OpenAI** - Prompts and code patterns included
6. **Add caching and optimization** - Use Redis
7. **Write comprehensive tests** - Ensure reliability
8. **Deploy and monitor** - Follow deployment checklist

All information needed for an AI agent to build this project independently is provided above.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation
