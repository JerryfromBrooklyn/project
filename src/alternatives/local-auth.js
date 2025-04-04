// Local Authentication Implementation
// This provides a simple localStorage-based authentication system for testing
// No server or external service required

// Sample user structure - matches your existing User interface
class User {
  constructor(email, fullName, role) {
    this.id = 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
    this.email = email;
    this.full_name = fullName || '';
    this.role = role || 'user';
    this.created_at = new Date().toISOString();
    this.updated_at = new Date().toISOString();
    this.verified = true; // All users are auto-verified
  }
}

// Get users from localStorage
const getUsers = () => {
  return JSON.parse(localStorage.getItem('local_users') || '[]');
};

// Save users to localStorage
const saveUsers = (users) => {
  localStorage.setItem('local_users', JSON.stringify(users));
};

// Get current user
let currentUser = null;

// Setup auth change listeners
const listeners = [];

// Subscribe to auth changes
export const onAuthStateChange = (callback) => {
  listeners.push(callback);
  // Immediately call with current state
  if (currentUser) {
    callback(currentUser);
  }
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};

// Notify all listeners of auth state change
const notifyAuthChange = (user) => {
  currentUser = user;
  listeners.forEach(callback => callback(user));
};

// Sign up with email and password
export const signUp = async (email, password, userData = {}) => {
  console.log('[LOCAL-AUTH] Starting sign-up process for email:', email);
  
  try {
    // Basic validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Check if email already exists
    const users = getUsers();
    const emailExists = users.some(user => user.email === email);
    
    if (emailExists) {
      throw new Error('An account with this email already exists.');
    }
    
    // Create new user
    const newUser = new User(email, userData.full_name, userData.role);
    
    // Store password securely (for a real app, you'd use hashing)
    const userWithPassword = {
      ...newUser,
      password_hash: password // In a real app, hash this password!
    };
    
    // Save to localStorage
    users.push(userWithPassword);
    saveUsers(users);
    
    console.log('[LOCAL-AUTH] User created successfully:', newUser.id);
    
    // For public API, don't return the password
    const { password_hash, ...userWithoutPassword } = userWithPassword;
    
    return {
      data: {
        user: userWithoutPassword,
        userConfirmed: true // All local users are auto-confirmed
      },
      error: null
    };
  } catch (error) {
    console.error('[LOCAL-AUTH] Sign-up error:', error);
    return {
      data: { user: null, userConfirmed: false },
      error: error instanceof Error ? error : new Error('Unknown error in sign-up')
    };
  }
};

// Sign in with email and password
export const signInWithPassword = async (email, password) => {
  console.log('[LOCAL-AUTH] Attempting sign-in for email:', email);
  
  try {
    // Find user with matching email and password
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password_hash === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Create session (stored in localStorage)
    const session = {
      accessToken: 'local-token-' + Math.random().toString(36).substring(2, 15),
      refreshToken: 'local-refresh-' + Math.random().toString(36).substring(2, 15),
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour from now
    };
    
    localStorage.setItem('local_auth_session', JSON.stringify(session));
    
    // For public API, don't return the password
    const { password_hash, ...userWithoutPassword } = user;
    
    // Update current user and notify listeners
    notifyAuthChange(userWithoutPassword);
    
    return {
      data: {
        user: userWithoutPassword,
        session
      },
      error: null
    };
  } catch (error) {
    console.error('[LOCAL-AUTH] Sign-in error:', error);
    notifyAuthChange(null);
    return {
      data: { user: null, session: null },
      error: error instanceof Error ? error : new Error('Unknown error in sign-in')
    };
  }
};

// Sign out
export const signOut = async () => {
  console.log('[LOCAL-AUTH] Signing out user');
  
  localStorage.removeItem('local_auth_session');
  notifyAuthChange(null);
  
  return { error: null };
};

export default {
  signUp,
  signInWithPassword,
  signOut,
  onAuthStateChange
}; 