import { useState, useEffect, createContext, useContext } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, isDev } from '../firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const User = {
  uid: '',
  email: null,
  username: null,
  isAnonymous: false,
  photoURL: null,
  bio: '',
  socialLinks: {},
  hintsReceived: 0,
  hintsSent: 0,
};

const mockUser = {
  uid: 'mock-user-123',
  email: 'user@example.com',
  username: 'user123',
  isAnonymous: false,
  photoURL: null,
  bio: 'This is a sample bio for testing',
  socialLinks: {
    twitter: '@testuser',
    instagram: 'testuser',
    facebook: 'testuser',
    linkedin: 'testuser'
  },
  hintsReceived: 5,
  hintsSent: 3,
};

const AuthContextType = {
  user: null,
  loading: false,
  error: null,
  signInWithGoogle: async () => {},
  signInAnonymousUser: async () => {},
  signInWithEmail: async (email, password) => {},
  signUpWithEmail: async (email, password, username) => {},
  updateUserData: (userData) => {},
  incrementHintCount: (type) => {},
  logout: async () => {},
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '737673462489-vj8qm1lv7q9c9g5j7nrqjvtk3f7o4hs1.apps.googleusercontent.com',
    androidClientId: '737673462489-vj8qm1lv7q9c9g5j7nrqjvtk3f7o4hs1.apps.googleusercontent.com',
    iosClientId: '737673462489-vj8qm1lv7q9c9g5j7nrqjvtk3f7o4hs1.apps.googleusercontent.com',
  });
  
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);
  
  useEffect(() => {
    if (isDev) {
      const timer = setTimeout(() => {
        setLoading(false);
        setUser(mockUser);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            console.log('Firebase user authenticated:', firebaseUser.uid);
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            
            let userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || `user_${firebaseUser.uid.substring(0, 5)}`,
              isAnonymous: firebaseUser.isAnonymous,
              photoURL: firebaseUser.photoURL || null,
              bio: '',
              socialLinks: {},
              hintsReceived: 0,
              hintsSent: 0,
            };
            
            if (!userDoc.exists()) {
              console.log('Creating new user document in Firestore');
              await setDoc(userDocRef, userData);
            } else {
              console.log('User document exists in Firestore');
              userData = { ...userData, ...userDoc.data() };
            }
            
            setUser(userData);
          } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to fetch user data. Please try again.');
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      
      return unsubscribe;
    }
  }, []);
  
  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    if (isDev) {
      console.log('Mock Google Sign-In');
      setUser(mockUser);
      setLoading(false);
    } else {
      try {
        console.log('Attempting Google Sign-In');
        await promptAsync();
      } catch (error) {
        console.error('Google Sign-In Error:', error);
        setError('Failed to sign in with Google. Please try again.');
        setLoading(false);
      }
    }
  };
  
  const signInAnonymousUser = async () => {
    setError(null);
    setLoading(true);
    if (isDev) {
      console.log('Mock Anonymous Sign-In');
      const anonymousUser = {
        uid: 'mock-anon-' + Math.random().toString(36).substring(2, 7),
        email: null,
        username: 'anonymous_user',
        isAnonymous: true,
        photoURL: null,
        hintsReceived: 0,
        hintsSent: 0,
      };
      setUser(anonymousUser);
      setLoading(false);
    } else {
      try {
        console.log('Attempting Anonymous Sign-In');
        const result = await signInAnonymously(auth);
        const user = result.user;
        console.log('Anonymous user created:', user.uid);
        
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          email: null,
          username: `anonymous_${user.uid.substring(0, 5)}`,
          isAnonymous: true,
          photoURL: null,
          hintsReceived: 0,
          hintsSent: 0,
        });
        console.log('Anonymous user document created in Firestore');
      } catch (error) {
        console.error('Anonymous Sign-In Error:', error);
        setError('Failed to sign in anonymously. Please try again.');
        setLoading(false);
      }
    }
  };
  
  const signInWithEmail = async (email, password) => {
    setError(null);
    if (isDev) {
      console.log('Mock Email Sign-In', { email });
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!email.includes('@') || password.length < 6) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }
        
        setUser({
          ...mockUser,
          email,
          username: email.split('@')[0],
        });
        setLoading(false);
      } catch (error) {
        console.error('Mock Email Sign-In Error:', error);
        setError('Failed to sign in');
        setLoading(false);
      }
    } else {
      try {
        console.log('Attempting Email Sign-In:', email);
        setLoading(true);
        await signInWithEmailAndPassword(auth, email, password);
        console.log('Email sign-in successful');
      } catch (error) {
        console.error('Email Sign-In Error:', error);
        setError(error.message || 'Failed to sign in');
        setLoading(false);
      }
    }
  };
  
  const signUpWithEmail = async (email, password, username) => {
    setError(null);
    if (isDev) {
      console.log('Mock Email Sign-Up', { email, username });
      try {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!email.includes('@') || password.length < 6) {
          setError('Invalid email or password');
          setLoading(false);
          return;
        }
        
        const newUser = {
          uid: 'mock-email-' + Math.random().toString(36).substring(2, 7),
          email,
          username: username || email.split('@')[0],
          isAnonymous: false,
          photoURL: null,
          hintsReceived: 0,
          hintsSent: 0,
        };
        
        setUser(newUser);
        setLoading(false);
      } catch (error) {
        console.error('Mock Email Sign-Up Error:', error);
        setError('Failed to sign up');
        setLoading(false);
      }
    } else {
      try {
        console.log('Attempting Email Sign-Up:', email);
        setLoading(true);
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        console.log('User created successfully:', user.uid);
        
        const userData = {
          uid: user.uid,
          email: user.email,
          username: username || email.split('@')[0],
          isAnonymous: false,
          photoURL: null,
          hintsReceived: 0,
          hintsSent: 0,
        };
        
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, userData);
        console.log('User document created in Firestore');
      } catch (error) {
        console.error('Email Sign-Up Error:', error);
        setError(error.message || 'Failed to sign up');
        setLoading(false);
      }
    }
  };
  
  const updateUserData = (userData) => {
    if (user) {
      setUser({ ...user, ...userData });
      
      if (!isDev && userData) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          updateDoc(userDocRef, userData);
        } catch (error) {
          console.error('Error updating user data:', error);
        }
      }
    }
  };
  
  const incrementHintCount = (type) => {
    if (user) {
      const field = type === 'sent' ? 'hintsSent' : 'hintsReceived';
      const currentValue = user[field] || 0;
      updateUserData({ [field]: currentValue + 1 });
    }
  };
  
  const logout = async () => {
    setError(null);
    if (isDev) {
      console.log('Mock Logout');
      setUser(null);
    } else {
      try {
        console.log('Attempting to sign out');
        await signOut(auth);
        console.log('User signed out successfully');
      } catch (error) {
        console.error('Logout Error:', error);
        setError('Failed to sign out. Please try again.');
      }
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      signInWithGoogle, 
      signInAnonymousUser, 
      signInWithEmail,
      signUpWithEmail,
      updateUserData,
      incrementHintCount,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
