import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, serverTimestamp } from 'firebase/firestore';
import { ref, set, push, onValue, off } from 'firebase/database';
import { db, rtdb, isDev } from '../firebase';
import { format } from 'date-fns';

const mockActivities = [
  {
    id: 'act1',
    userId: 'user1',
    username: 'alice',
    type: 'profile_update',
    detail: 'updated their profile picture',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'act2',
    userId: 'user2',
    username: 'bob',
    type: 'new_user',
    detail: 'joined MentaCrush',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'act3',
    userId: 'user3',
    username: 'charlie',
    type: 'profile_update',
    detail: 'updated their bio',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
];

export const ACTIVITY_TYPES = {
  PROFILE_UPDATE: 'profile_update',
  NEW_USER: 'new_user',
  SENT_HINT: 'sent_hint',
  MATCH: 'match',
};

export const createActivity = async (userId, username, type, detail) => {
  if (isDev) {
    console.log('Development mode: Mocking createActivity', { userId, username, type, detail });
    return { id: 'mock-activity-' + Date.now(), timestamp: new Date().toISOString() };
  }

  try {
    const activityData = {
      userId,
      username,
      type,
      detail,
      timestamp: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'activities'), activityData);
    return { id: docRef.id, ...activityData };
  } catch (error) {
    console.error('Error creating activity:', error);
    throw error;
  }
};

export const formatActivityTime = (timestamp) => {
  if (!timestamp) return '';
  
  const date = typeof timestamp === 'string' 
    ? new Date(timestamp) 
    : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  
  return format(date, 'MMM d');
};

export const sendHint = async (fromUserId, toUserId) => {
  if (isDev) {
    console.log('Development mode: Mocking sendHint', { fromUserId, toUserId });
    return { id: 'mock-hint-' + Date.now() };
  }

  try {
    const hintData = {
      fromUserId,
      toUserId,
      timestamp: serverTimestamp(),
      read: false,
    };

    const docRef = await addDoc(collection(db, 'hints'), hintData);
    return { id: docRef.id, ...hintData };
  } catch (error) {
    console.error('Error sending hint:', error);
    throw error;
  }
};

export const checkForMatch = async (user1Id, user2Id) => {
  if (isDev) {
    console.log('Development mode: Mocking checkForMatch', { user1Id, user2Id });
    return Math.random() > 0.5;
  }

  try {
    const hintsFrom1To2 = query(
      collection(db, 'hints'),
      where('fromUserId', '==', user1Id),
      where('toUserId', '==', user2Id)
    );
    
    const hintsFrom2To1 = query(
      collection(db, 'hints'),
      where('fromUserId', '==', user2Id),
      where('toUserId', '==', user1Id)
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(hintsFrom1To2),
      getDocs(hintsFrom2To1)
    ]);
    
    return !snapshot1.empty && !snapshot2.empty;
  } catch (error) {
    console.error('Error checking for match:', error);
    return false;
  }
};
