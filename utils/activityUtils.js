import { collection, addDoc, query, where, getDocs, orderBy, limit, Timestamp, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { ref, set, push, onValue, off } from 'firebase/database';
import { db, rtdb, isDev } from '../firebase';

export const ACTIVITY_TYPES = {
  JOINED: 'joined',
  UPDATED_PROFILE: 'updated_profile',
  UPDATED_PHOTO: 'updated_photo',
  SENT_HINT: 'sent_hint',
  RECEIVED_HINT: 'received_hint',
  MATCH: 'match',
};

export const createActivity = async (userId, username, type, description) => {
  if (isDev) {
    console.log('Development mode: Mocking createActivity', { userId, username, type, description });
    return { id: `mock-activity-${Date.now()}` };
  }
  
  try {
    const activityData = {
      userId,
      username,
      type,
      description,
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
  
  const date = timestamp instanceof Date 
    ? timestamp 
    : new Date(timestamp);
  
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const sendHint = async (fromUserId, toUserId) => {
  if (isDev) {
    console.log('Development mode: Mocking sendHint', { fromUserId, toUserId });
    return { id: `mock-hint-${Date.now()}` };
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
    
    const isMatch = !snapshot1.empty && !snapshot2.empty;
    
    if (isMatch) {
      await createOrGetChat(user1Id, user2Id);
    }
    
    return isMatch;
  } catch (error) {
    console.error('Error checking for match:', error);
    return false;
  }
};

export const createOrGetChat = async (user1Id, user2Id) => {
  if (isDev) {
    console.log('Development mode: Mocking createOrGetChat', { user1Id, user2Id });
    return { id: `mock-chat-${user1Id}-${user2Id}` };
  }

  try {
    const chatsRef = collection(db, 'chats');
    
    const q1 = query(
      chatsRef,
      where('participants', 'array-contains', user1Id)
    );
    
    const snapshot = await getDocs(q1);
    const existingChat = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(user2Id);
    });
    
    if (existingChat) {
      return { id: existingChat.id, ...existingChat.data() };
    }
    
    const chatData = {
      participants: [user1Id, user2Id],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      typingUsers: [],
      unreadCount: {
        [user1Id]: 0,
        [user2Id]: 0
      }
    };
    
    const docRef = await addDoc(chatsRef, chatData);
    return { id: docRef.id, ...chatData };
  } catch (error) {
    console.error('Error creating or getting chat:', error);
    throw error;
  }
};
