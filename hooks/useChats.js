import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db, isDev } from '../firebase';

const mockChats = [
  {
    id: 'chat1',
    otherUser: {
      uid: 'user1',
      username: 'alice',
      photoURL: null,
    },
    lastMessage: {
      text: 'Hey there!',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      senderId: 'user1',
    },
    unreadCount: 2,
  },
  {
    id: 'chat2',
    otherUser: {
      uid: 'user2',
      username: 'bob',
      photoURL: null,
    },
    lastMessage: {
      text: 'Looking forward to chatting more!',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      senderId: 'mock-user-123',
    },
    unreadCount: 0,
  },
];

export const useChats = (userId) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    if (isDev) {
      console.log('Development mode: Using mock chats');
      setChats(mockChats);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        chatsQuery,
        async (snapshot) => {
          const chatPromises = snapshot.docs.map(async (doc) => {
            const chatData = doc.data();
            
            const otherUserId = chatData.participants.find(id => id !== userId);
            
            const userRef = doc(db, 'users', otherUserId);
            const userDoc = await getDoc(userRef);
            
            let otherUser = { uid: otherUserId };
            if (userDoc.exists()) {
              otherUser = {
                uid: userDoc.id,
                ...userDoc.data()
              };
            }
            
            return {
              id: doc.id,
              otherUser,
              lastMessage: chatData.lastMessage,
              unreadCount: chatData.unreadCount?.[userId] || 0,
            };
          });
          
          const chatsList = await Promise.all(chatPromises);
          setChats(chatsList);
          setLoading(false);
        },
        (err) => {
          console.error('Error getting chats:', err);
          setError(err.message);
          setLoading(false);
        }
      );
      
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up chats listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [userId]);
  
  return { chats, loading, error };
};
