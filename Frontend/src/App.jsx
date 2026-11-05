import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8008/api';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  const [activeTab, setActiveTab] = useState('notes');
  const [authMode, setAuthMode] = useState('login');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Auth Form State
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    interests: 'chess, reading'
  });

  // Notes State
  const [notes, setNotes] = useState([]);
  const [notesPagination, setNotesPagination] = useState({ page: 1, totalPages: 1 });
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteData, setEditingNoteData] = useState({ title: '', content: '' });

  // Admin All Notes State
  const [allNotes, setAllNotes] = useState([]);
  const [allNotesPagination, setAllNotesPagination] = useState({ page: 1, totalPages: 1 });

  // Posts State
  const [posts, setPosts] = useState([]);
  const [postsPagination, setPostsPagination] = useState({ page: 1, totalPages: 1 });
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [targetUserId, setTargetUserId] = useState('');
  const [userLookupPosts, setUserLookupPosts] = useState(null);

  // Aggregation Interests State
  const [interestsGroups, setInterestsGroups] = useState([]);
  const [myInterestsInput, setMyInterestsInput] = useState('');

  // Admin Users State
  const [usersList, setUsersList] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, totalPages: 1 });
  const [newAdminUser, setNewAdminUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    interests: ''
  });

  const clearNotifications = () => {
    setMessage('');
    setError('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    clearNotifications();

    const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
    const body = authMode === 'login'
      ? { email: authForm.email, password: authForm.password }
      : {
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: authForm.role,
          interests: authForm.interests.split(',').map((i) => i.trim()).filter(Boolean)
        };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setMyInterestsInput((data.user.interests || []).join(', '));
      setMessage(`Welcome, ${data.user.name}!`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    clearNotifications();
  };

  // Fetch User's Notes
  const fetchMyNotes = async (page = 1) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notes?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setNotes(data.data || []);
        setNotesPagination(data.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Everyone's Notes (Admin)
  const fetchAllNotes = async (page = 1) => {
    if (!token || user?.role !== 'admin') return;
    try {
      const res = await fetch(`${API_BASE}/notes?all=true&page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAllNotes(data.data || []);
        setAllNotesPagination(data.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Note
  const handleCreateNote = async (e) => {
    e.preventDefault();
    clearNotifications();
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newNote)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewNote({ title: '', content: '' });
      setMessage('Note created successfully');
      fetchMyNotes(1);
      if (user?.role === 'admin') fetchAllNotes(1);
    } catch (err) {
      setError(err.message);
    }
  };

  // Update Note
  const handleUpdateNote = async (id) => {
    clearNotifications();
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingNoteData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEditingNoteId(null);
      setMessage('Note updated successfully');
      fetchMyNotes(notesPagination.page);
      if (user?.role === 'admin') fetchAllNotes(allNotesPagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete Note
  const handleDeleteNote = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    clearNotifications();
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage('Note deleted successfully');
      fetchMyNotes(notesPagination.page);
      if (user?.role === 'admin') fetchAllNotes(allNotesPagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  // Fetch Public Posts
  const fetchPosts = async (page = 1) => {
    try {
      const res = await fetch(`${API_BASE}/posts?page=${page}&limit=5`);
      const data = await res.json();
      if (res.ok) {
        setPosts(data.data || []);
        setPostsPagination(data.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    clearNotifications();
    try {
      const res = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewPost({ title: '', content: '' });
      setMessage('Post created successfully');
      fetchPosts(1);
    } catch (err) {
      setError(err.message);
    }
  };

  // Scenario 2 Aggregation: Retrieve User Posts with $lookup
  const handleLookupUserPosts = async (e) => {
    e?.preventDefault();
    clearNotifications();
    if (!targetUserId.trim()) {
      setError('Please provide a User ID for lookup');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/posts/user/${targetUserId.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUserLookupPosts(data);
      setMessage(`Found ${data.length} post(s) via $lookup aggregation`);
    } catch (err) {
      setError(err.message);
      setUserLookupPosts([]);
    }
  };

  // Scenario 1 Aggregation: Group by Interests
  const fetchInterestsGroups = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/users/interests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setInterestsGroups(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update Logged-in User Interests
  const handleUpdateMyInterests = async (e) => {
    e.preventDefault();
    clearNotifications();
    const interestsArray = myInterestsInput.split(',').map((i) => i.trim()).filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/users/interests`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ interests: interestsArray })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setMessage('Interests updated');
      fetchInterestsGroups();
    } catch (err) {
      setError(err.message);
    }
  };

  // Admin: Fetch All Users
  const fetchUsersList = async (page = 1) => {
    if (!token || user?.role !== 'admin') return;
    try {
      const res = await fetch(`${API_BASE}/users?page=${page}&limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.data || []);
        setUsersPagination(data.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Create User
  const handleAdminCreateUser = async (e) => {
    e.preventDefault();
    clearNotifications();
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newAdminUser.name,
          email: newAdminUser.email,
          password: newAdminUser.password,
          role: newAdminUser.role,
          interests: newAdminUser.interests.split(',').map((i) => i.trim()).filter(Boolean)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNewAdminUser({ name: '', email: '', password: '', role: 'user', interests: '' });
      setMessage('User created successfully');
      fetchUsersList(1);
    } catch (err) {
      setError(err.message);
    }
  };

  // Admin: Delete User
  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    clearNotifications();
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage('User deleted successfully');
      fetchUsersList(usersPagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyNotes(1);
      fetchPosts(1);
      fetchInterestsGroups();
      if (user?.role === 'admin') {
        fetchAllNotes(1);
        fetchUsersList(1);
      }
      if (user?._id && !targetUserId) {
        setTargetUserId(user._id);
      }
      if (user?.interests) {
        setMyInterestsInput(user.interests.join(', '));
      }
    }
  }, [token]);

  if (!token) {
    return (
      <div className="auth-container">
        <header className="header">
          <h1>Secure Note-Taking Platform</h1>
          <p>Technical Assessment Implementation</p>
        </header>

        <div className="auth-card">
          <div className="auth-toggle">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => { setAuthMode('login'); clearNotifications(); }}
            >
              Sign In
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => { setAuthMode('register'); clearNotifications(); }}
            >
              Register
            </button>
          </div>

          {error && <div className="banner error">{error}</div>}
          {message && <div className="banner success">{message}</div>}

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label>Account Role</label>
                  <select
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Interests (comma separated)</label>
                  <input
                    type="text"
                    value={authForm.interests}
                    onChange={(e) => setAuthForm({ ...authForm, interests: e.target.value })}
                    placeholder="chess, reading, sports"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="btn-primary">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="brand">
          <h2>Secure Notes</h2>
        </div>
        <div className="user-info">
          <span>Signed in as <strong>{user?.name}</strong></span>
          <span className={`badge ${user?.role}`}>{user?.role?.toUpperCase()}</span>
          <button className="btn-secondary" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}
      {message && <div className="banner success">{message}</div>}

      <nav className="tabs">
        <button
          className={activeTab === 'notes' ? 'active' : ''}
          onClick={() => { setActiveTab('notes'); clearNotifications(); fetchMyNotes(1); }}
        >
          My Notes
        </button>

        {user?.role === 'admin' && (
          <button
            className={activeTab === 'all-notes' ? 'active' : ''}
            onClick={() => { setActiveTab('all-notes'); clearNotifications(); fetchAllNotes(1); }}
          >
            All Notes (Admin)
          </button>
        )}

        <button
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => { setActiveTab('posts'); clearNotifications(); fetchPosts(1); }}
        >
          Posts & $lookup Aggregation
        </button>

        <button
          className={activeTab === 'interests' ? 'active' : ''}
          onClick={() => { setActiveTab('interests'); clearNotifications(); fetchInterestsGroups(); }}
        >
          Interests Aggregation
        </button>

        {user?.role === 'admin' && (
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => { setActiveTab('users'); clearNotifications(); fetchUsersList(1); }}
          >
            User Management (Admin)
          </button>
        )}
      </nav>

      <main className="tab-content">
        {/* TAB 1: MY NOTES */}
        {activeTab === 'notes' && (
          <section>
            <div className="card">
              <h3>Create New Note</h3>
              <form onSubmit={handleCreateNote}>
                <div className="form-group">
                  <input
                    type="text"
                    required
                    placeholder="Note Title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <textarea
                    rows={3}
                    required
                    placeholder="Write your note here..."
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary">Add Note</button>
              </form>
            </div>

            <div className="list-section">
              <h3>My Notes ({notesPagination.totalCount || 0})</h3>
              {notes.length === 0 ? (
                <p className="empty-text">No notes yet. Create your first note above!</p>
              ) : (
                notes.map((note) => (
                  <div key={note._id} className="note-card">
                    {editingNoteId === note._id ? (
                      <div className="edit-box">
                        <input
                          type="text"
                          value={editingNoteData.title}
                          onChange={(e) =>
                            setEditingNoteData({ ...editingNoteData, title: e.target.value })
                          }
                        />
                        <textarea
                          rows={3}
                          value={editingNoteData.content}
                          onChange={(e) =>
                            setEditingNoteData({ ...editingNoteData, content: e.target.value })
                          }
                        />
                        <div className="btn-row">
                          <button
                            className="btn-primary"
                            onClick={() => handleUpdateNote(note._id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => setEditingNoteId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="note-header">
                          <h4>{note.title}</h4>
                          <span className="timestamp">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="note-content">{note.content}</p>
                        <div className="btn-row">
                          <button
                            className="btn-secondary"
                            onClick={() => {
                              setEditingNoteId(note._id);
                              setEditingNoteData({
                                title: note.title,
                                content: note.content
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteNote(note._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}

              {notesPagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={!notesPagination.hasPrevPage}
                    onClick={() => fetchMyNotes(notesPagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {notesPagination.page} of {notesPagination.totalPages}
                  </span>
                  <button
                    disabled={!notesPagination.hasNextPage}
                    onClick={() => fetchMyNotes(notesPagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 2: ALL NOTES (ADMIN ONLY) */}
        {activeTab === 'all-notes' && user?.role === 'admin' && (
          <section>
            <div className="list-section">
              <h3>All Users Notes (Admin View - {allNotesPagination.totalCount || 0})</h3>
              {allNotes.length === 0 ? (
                <p className="empty-text">No notes found across the platform.</p>
              ) : (
                allNotes.map((note) => (
                  <div key={note._id} className="note-card">
                    <div className="note-header">
                      <h4>{note.title}</h4>
                      <span className="user-tag">
                        Author: {note.user?.name || 'Unknown'} ({note.user?.email || 'N/A'})
                      </span>
                    </div>
                    <p className="note-content">{note.content}</p>
                    <div className="btn-row">
                      <span className="timestamp">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteNote(note._id)}
                      >
                        Delete as Admin
                      </button>
                    </div>
                  </div>
                ))
              )}

              {allNotesPagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={!allNotesPagination.hasPrevPage}
                    onClick={() => fetchAllNotes(allNotesPagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {allNotesPagination.page} of {allNotesPagination.totalPages}
                  </span>
                  <button
                    disabled={!allNotesPagination.hasNextPage}
                    onClick={() => fetchAllNotes(allNotesPagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: POSTS & $LOOKUP AGGREGATION */}
        {activeTab === 'posts' && (
          <section>
            <div className="card">
              <h3>Create Public Post</h3>
              <form onSubmit={handleCreatePost}>
                <div className="form-group">
                  <input
                    type="text"
                    required
                    placeholder="Post Title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <textarea
                    rows={3}
                    required
                    placeholder="Share something with everyone..."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary">Publish Post</button>
              </form>
            </div>

            <div className="card highlight-card">
              <h3>Scenario 2: Retrieve User Posts ($lookup Aggregation)</h3>
              <p>Constraint: Uses a single MongoDB aggregation pipeline with a $lookup stage.</p>
              <div className="form-inline">
                <input
                  type="text"
                  placeholder="Enter User ID (e.g. your ID below)"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setTargetUserId(user?._id || '')}
                >
                  My User ID
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleLookupUserPosts}
                >
                  Run $lookup Pipeline
                </button>
              </div>

              {userLookupPosts !== null && (
                <div className="lookup-results">
                  <h4>Aggregation Results ({userLookupPosts.length} posts found)</h4>
                  {userLookupPosts.length === 0 ? (
                    <p className="empty-text">No posts found for this user.</p>
                  ) : (
                    userLookupPosts.map((p) => (
                      <div key={p._id} className="lookup-item">
                        <h5>{p.title}</h5>
                        <p>{p.content}</p>
                        <small>
                          Author: {p.author?.name} ({p.author?.email}) | Posted:{' '}
                          {new Date(p.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="list-section">
              <h3>All Public Posts ({postsPagination.totalCount || 0})</h3>
              {posts.map((post) => (
                <div key={post._id} className="note-card">
                  <div className="note-header">
                    <h4>{post.title}</h4>
                    <span className="user-tag">
                      By: {post.author?.name} (ID: {post.author?._id})
                    </span>
                  </div>
                  <p className="note-content">{post.content}</p>
                  <div className="btn-row">
                    <span className="timestamp">
                      {new Date(post.createdAt).toLocaleString()}
                    </span>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setTargetUserId(post.author?._id);
                        setActiveTab('posts');
                      }}
                    >
                      Filter by this Author
                    </button>
                  </div>
                </div>
              ))}

              {postsPagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={!postsPagination.hasPrevPage}
                    onClick={() => fetchPosts(postsPagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {postsPagination.page} of {postsPagination.totalPages}
                  </span>
                  <button
                    disabled={!postsPagination.hasNextPage}
                    onClick={() => fetchPosts(postsPagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 4: INTERESTS AGGREGATION */}
        {activeTab === 'interests' && (
          <section>
            <div className="card">
              <h3>Update My Interests</h3>
              <form onSubmit={handleUpdateMyInterests} className="form-inline">
                <input
                  type="text"
                  placeholder="chess, reading, traveling"
                  value={myInterestsInput}
                  onChange={(e) => setMyInterestsInput(e.target.value)}
                />
                <button type="submit" className="btn-primary">Save Interests</button>
              </form>
            </div>

            <div className="list-section">
              <div className="header-with-btn">
                <h3>Scenario 1: Users Grouped by Interests</h3>
                <button className="btn-secondary" onClick={fetchInterestsGroups}>
                  Refresh Aggregation
                </button>
              </div>
              <p className="subtext">
                Constraint: Computed using exactly one <code>collection.aggregate()</code> call
                with <code>$unwind</code>, <code>$group</code>, and <code>$sort</code> supported
                by an index on <code>interests</code>.
              </p>

              {interestsGroups.length === 0 ? (
                <p className="empty-text">No interests grouped yet.</p>
              ) : (
                <div className="grid">
                  {interestsGroups.map((group) => (
                    <div key={group.interest} className="interest-card">
                      <div className="interest-header">
                        <span className="interest-title">{group.interest}</span>
                        <span className="count-badge">{group.userCount} user(s)</span>
                      </div>
                      <ul className="user-list">
                        {group.users.map((u) => (
                          <li key={u._id}>
                            <strong>{u.name}</strong> ({u.email})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 5: ADMIN USER MANAGEMENT */}
        {activeTab === 'users' && user?.role === 'admin' && (
          <section>
            <div className="card">
              <h3>Admin: Create User</h3>
              <form onSubmit={handleAdminCreateUser}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={newAdminUser.name}
                      onChange={(e) =>
                        setNewAdminUser({ ...newAdminUser, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      required
                      value={newAdminUser.email}
                      onChange={(e) =>
                        setNewAdminUser({ ...newAdminUser, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      required
                      value={newAdminUser.password}
                      onChange={(e) =>
                        setNewAdminUser({ ...newAdminUser, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newAdminUser.role}
                      onChange={(e) =>
                        setNewAdminUser({ ...newAdminUser, role: e.target.value })
                      }
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Interests (comma separated)</label>
                  <input
                    type="text"
                    value={newAdminUser.interests}
                    onChange={(e) =>
                      setNewAdminUser({ ...newAdminUser, interests: e.target.value })
                    }
                    placeholder="chess, photography, gaming"
                  />
                </div>
                <button type="submit" className="btn-primary">Add User</button>
              </form>
            </div>

            <div className="list-section">
              <h3>All Users ({usersPagination.totalCount || 0})</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Interests</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role}`}>{u.role}</span>
                      </td>
                      <td>{(u.interests || []).join(', ') || '-'}</td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        {u._id !== user._id && (
                          <button
                            className="btn-danger-sm"
                            onClick={() => handleDeleteUser(u._id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {usersPagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={!usersPagination.hasPrevPage}
                    onClick={() => fetchUsersList(usersPagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {usersPagination.page} of {usersPagination.totalPages}
                  </span>
                  <button
                    disabled={!usersPagination.hasNextPage}
                    onClick={() => fetchUsersList(usersPagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
