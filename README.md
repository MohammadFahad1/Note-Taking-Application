# Secure Note-Taking Application

A secure, role-based note-taking application built with Node.js, Express, MongoDB with Mongoose, and a functional React frontend.

## Tech Stack
- **Backend:** Node.js (v22), Express (v5), Mongoose (v9), JWT, bcryptjs
- **Frontend:** React 19, Vite
- **Database:** MongoDB 7.0
- **Containerization:** Docker & Docker Compose

## Quick Start
To build and run the entire platform with persistent storage:

```bash
docker compose up -d --build
```

- **Frontend:** [http://localhost:8009](http://localhost:8009) (or `http://nta.fahadbd.com`)
- **Backend API:** [http://localhost:8008](http://localhost:8008) (or `https://nta-api.fahadbd.com`)
- **MongoDB:** `localhost:27017`

Data is persisted inside the `mongodb_data` Docker volume across rebuilds and container restarts.

## Roles & Permissions
- **User:**
  - Can create, read, update, delete, and list their own notes with pagination.
  - Can create public posts and view public posts.
  - Can update their own interests.
- **Admin:**
  - Inherits all User capabilities.
  - Can view everyone's notes across the platform.
  - Can manage users (create, update, delete, and list all users with pagination).

## Database Indexing Strategy
All indexes are explicitly created in the schemas using `schema.index(...)` to strictly support required queries and aggregations with no unnecessary indexes:

### User Collection
- `userSchema.index({ email: 1 }, { unique: true })`: Supports user login lookup by email (`User.findOne({ email })`).
- `userSchema.index({ createdAt: -1 })`: Supports admin user listing with pagination sorted by newest first (`User.find().sort({ createdAt: -1 })`).
- `userSchema.index({ interests: 1 })`: Supports Scenario 1 aggregation to unwind and group users by interest.

### Note Collection
- `noteSchema.index({ user: 1, createdAt: -1 })`: Supports user listing their own notes with pagination sorted newest first (`Note.find({ user }).sort({ createdAt: -1 })`).
- `noteSchema.index({ createdAt: -1 })`: Supports admin listing all notes across all users sorted newest first (`Note.find().sort({ createdAt: -1 })`).

### Post Collection
- `postSchema.index({ author: 1, createdAt: -1 })`: Supports Scenario 2 aggregation to retrieve all posts for a particular user sorted by newest first.

*Note: Default `_id` indexes automatically support direct GET operations by ID.*

## Aggregation Pipelines

### Scenario 1: Group by Interests
- **Endpoint:** `GET /api/users/interests`
- **Constraint:** Computed using exactly one `collection.aggregate()` call.
- **Pipeline:**
  ```javascript
  User.aggregate([
    { $unwind: '$interests' },
    {
      $group: {
        _id: '$interests',
        users: {
          $push: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            role: '$role'
          }
        },
        userCount: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        interest: '$_id',
        userCount: 1,
        users: 1
      }
    },
    { $sort: { interest: 1 } }
  ]);
  ```

### Scenario 2: User Posts ($lookup)
- **Endpoint:** `GET /api/posts/user/:userId`
- **Constraint:** Uses a single aggregation pipeline with a `$lookup` stage.
- **Pipeline:**
  ```javascript
  Post.aggregate([
    {
      $match: {
        author: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $unwind: '$author'
    },
    {
      $project: {
        title: 1,
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        'author._id': 1,
        'author.name': 1,
        'author.email': 1
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);
  ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (`name`, `email`, `password`, `role`, `interests`)
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/profile` - Get logged-in user profile

### Notes
- `GET /api/notes?page=1&limit=10` - List notes (paginated, user's own notes; pass `?all=true` for admin)
- `POST /api/notes` - Create note (`title`, `content`)
- `GET /api/notes/:id` - Read single note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Posts & Aggregations
- `GET /api/posts?page=1&limit=10` - List public posts (paginated)
- `POST /api/posts` - Create post (`title`, `content`)
- `GET /api/posts/user/:userId` - Scenario 2: Retrieve posts belonging to a user using `$lookup` aggregation
- `GET /api/users/interests` - Scenario 1: Group users by interests aggregation

### User Management (Admin Only)
- `GET /api/users?page=1&limit=10` - List users (paginated)
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/interests` - Update logged-in user's interests

