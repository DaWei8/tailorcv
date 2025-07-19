// utils/auth.js
"use client";

import { createClient } from "./supabase";

// Safe localStorage wrapper
const safeStorage = {
  setItem: (key, value) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  },
  
  getItem: (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return null;
      }
    }
    return null;
  },
  
  removeItem: (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }
  },
  
  clear: () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }
};

// Auth utility functions
export const authStorage = {
  // Keys for localStorage
  USER_KEY: 'authenticated_user',
  SESSION_KEY: 'user_session',
  
  // Store user data when authenticated
  setUser: (user, session = null) => {
    if (user) {
      const userData = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        stored_at: Date.now() // Track when we stored this
      };
      
      safeStorage.setItem(authStorage.USER_KEY, JSON.stringify(userData));
      
      if (session) {
        const sessionData = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type
        };
        safeStorage.setItem(authStorage.SESSION_KEY, JSON.stringify(sessionData));
      }
    }
  },
  
  // Get stored user data
  getUser: () => {
    const userData = safeStorage.getItem(authStorage.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },
  
  // Get stored session data
  getSession: () => {
    const sessionData = safeStorage.getItem(authStorage.SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
  },
  
  // Clear all auth data
  clearAuth: () => {
    safeStorage.removeItem(authStorage.USER_KEY);
    safeStorage.removeItem(authStorage.SESSION_KEY);
    // You can also clear other user-specific data here
    // safeStorage.removeItem('user_preferences');
    // safeStorage.removeItem('user_settings');
  },
  
  // Check if user is authenticated (basic check)
  isAuthenticated: () => {
    const user = authStorage.getUser();
    const session = authStorage.getSession();
    
    if (!user || !session) return false;
    
    // Check if session is expired
    const now = Date.now() / 1000; // Convert to seconds
    const expiresAt = session.expires_at;
    
    if (expiresAt && now >= expiresAt) {
      // Session expired, clear storage
      authStorage.clearAuth();
      return false;
    }
    
    return true;
  },
  
  // Check if stored data is stale (optional - for data freshness)
  isDataStale: (maxAgeInMinutes = 60) => {
    const user = authStorage.getUser();
    if (!user || !user.stored_at) return true;
    
    const ageInMinutes = (Date.now() - user.stored_at) / (1000 * 60);
    return ageInMinutes > maxAgeInMinutes;
  }
};

// Main authentication functions
export async function handleLogin(email, password) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    if (data.user && data.session) {
      // Store user data in localStorage
      authStorage.setUser(data.user, data.session);
      return { user: data.user, session: data.session, error: null };
    }
    
    return { user: null, session: null, error: "Login failed" };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, session: null, error: error.message };
  }
}

export async function handleLogout() {
  try {
    const supabase = await createClient();
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    // Clear localStorage regardless of Supabase signout success
    authStorage.clearAuth();
    
    return { success: true, error: null };
  } catch (error) {
    // Still clear localStorage even if Supabase signout fails
    authStorage.clearAuth();
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    
    // First check Supabase for current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (user) {
      // Get fresh session data
      const { data: { session } } = await supabase.auth.getSession();
      
      // Update localStorage with fresh data
      authStorage.setUser(user, session);
      return user;
    } else {
      // No user in Supabase, clear localStorage
      authStorage.clearAuth();
      return null;
    }
  } catch (error) {
    console.error('Get current user error:', error);
    // On error, clear potentially stale data
    authStorage.clearAuth();
    return null;
  }
}

// Hook for React components
export function useAuthState() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  
  React.useEffect(() => {
    // Check localStorage first for immediate UI update
    const storedUser = authStorage.getUser();
    const isAuth = authStorage.isAuthenticated();
    
    if (storedUser && isAuth) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
    
    // Then verify with Supabase
    getCurrentUser().then((freshUser) => {
      setUser(freshUser);
      setIsAuthenticated(!!freshUser);
      setLoading(false);
    });
    
    // Set up auth state change listener
    const setupAuthListener = async () => {
      const supabase = await createClient();
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth state changed:', event);
          
          if (event === 'SIGNED_IN' && session?.user) {
            authStorage.setUser(session.user, session);
            setUser(session.user);
            setIsAuthenticated(true);
          } else if (event === 'SIGNED_OUT') {
            authStorage.clearAuth();
            setUser(null);
            setIsAuthenticated(false);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            authStorage.setUser(session.user, session);
            setUser(session.user);
            setIsAuthenticated(true);
          }
        }
      );
      
      return subscription;
    };
    
    let subscription;
    setupAuthListener().then((sub) => {
      subscription = sub;
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
  
  return { user, loading, isAuthenticated };
}

// Utility to get user ID specifically (what you originally needed)
export function getUserId() {
  const user = authStorage.getUser();
  return user?.id || null;
}

// Example usage in a component or API call
export function useUserId() {
  const userId = getUserId();
  return userId;
}