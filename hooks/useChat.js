import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, isDev } from '../firebase';
import { formatActivityTime } from '../utils/activityUtils';

const mockOtherUser = {
  uid: 'other-user-123',
  username: 'chatpartner',
  photoURL: null,
};

const mockMessages = [
  {
    id: 'msg1',
    text: 'Hey there!',
    senderId: 'other-user-123',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg2',
    text: 'Hi! How are you?',
    senderId: 'mock-user-123',
    timestamp: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    id: 'msg3',
    text: 'I\'m good, thanks for asking. Excited to chat with you!',
    senderId: 'other-user-123',
    timestamp: new Date(Date.now() - 3400000).toISOString(),
  },
];

export const useChat = (chatId, userId) => {
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    if (!chatId || !userId) {
      setLoading(false);
      return;
    }
    
    const loadChat = async () => {
      if (isDev) {
        console.log('Development mode: Using mock messages');
        setOtherUser(mockOtherUser);
        setMessages(mockMessages);
        setLoading(false);
        return;
      }
      
      try {
        const chatRef = doc(db, 'chats', chatId);
        const chatDoc = await getDoc(chatRef);
        
        if (!chatDoc.exists()) {
          setError('Chat not found');
          setLoading(false);
          return;
        }
        
        const chatData = chatDoc.data();
        
        const otherUserId = chatData.participants.find(id => id !== userId);
        
        const userRef = doc(db, 'users', otherUserId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setOtherUser({
            uid: userDoc.id,
            ...userDoc.data()
          });
        }
        
        const typingUnsubscribe = onSnapshot(chatRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setIsTyping(data.typingUsers && data.typingUsers.includes(otherUserId));
          }
        });
        
        const messagesQuery = query(
          collection(db, 'chats', chatId, 'messages'),
          orderBy('timestamp', 'asc')
        );
        
        const messagesUnsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const messagesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
            }));
            
            setMessages(messagesList);
            setLoading(false);
            
            markMessagesAsRead(chatId, userId, snapshot.docs);
          },
          (err) => {
            console.error('Error listening to messages:', err);
            setError(err.message);
            setLoading(false);
          }
        );
        
        return () => {
          messagesUnsubscribe();
          typingUnsubscribe();
        };
      } catch (err) {
        console.error('Error loading chat:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    loadChat();
  }, [chatId, userId]);
  
  const sendMessage = async (text) => {
    if (isDev) {
      console.log('Development mode: Mocking sendMessage', text);
      const newMessage = {
        id: `mock-msg-${Date.now()}`,
        text,
        senderId: 'mock-user-123',
        timestamp: new Date().toISOString(),
      };
      
      setMessages([...messages, newMessage]);
      return newMessage;
    }
    
    try {
      const messageData = {
        text,
        senderId: userId,
        timestamp: serverTimestamp(),
        read: false,
      };
      
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const docRef = await addDoc(messagesRef, messageData);
      
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      
      await updateDoc(chatRef, {
        lastMessage: {
          text,
          timestamp: serverTimestamp(),
          senderId: userId
        },
        [`unreadCount.${otherUser.uid}`]: (chatData.unreadCount?.[otherUser.uid] || 0) + 1,
        updatedAt: serverTimestamp(),
      });
      
      return {
        id: docRef.id,
        ...messageData
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  const markMessagesAsRead = async (chatId, userId, messageDocs) => {
    if (isDev) return;
    
    try {
      const unreadMessages = messageDocs.filter(doc => {
        const data = doc.data();
        return data.senderId !== userId && !data.read;
      });
      
      if (unreadMessages.length > 0) {
        const updates = unreadMessages.map(doc => 
          updateDoc(doc.ref, { read: true })
        );
        
        await Promise.all(updates);
        
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
          [`unreadCount.${userId}`]: 0
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  const setTypingStatus = async (isTyping) => {
    if (isDev) return;
    
    try {
      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        let typingUsers = data.typingUsers || [];
        
        if (isTyping && !typingUsers.includes(userId)) {
          typingUsers.push(userId);
        } else if (!isTyping && typingUsers.includes(userId)) {
          typingUsers = typingUsers.filter(id => id !== userId);
        } else {
          return;
        }
        
        await updateDoc(chatRef, { typingUsers });
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };
  
  return { 
    messages, 
    otherUser, 
    loading, 
    error, 
    sendMessage,
    isTyping,
    setTypingStatus
  };
};
