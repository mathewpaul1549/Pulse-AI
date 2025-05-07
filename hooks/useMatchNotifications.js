import { useState, useEffect } from 'react';
import { ref, onValue, off, update } from 'firebase/database';
import { rtdb, isDev } from '../firebase';

const mockNotifications = [
  {
    id: 'notif1',
    type: 'match',
    matchedUser: {
      id: 'user1',
      username: 'alice',
      photoURL: null
    },
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false
  }
];

export const useMatchNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (isDev) {
      console.log('Development mode: Using mock notifications');
      setNotifications(mockNotifications);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const notificationsRef = ref(rtdb, `notifications/${userId}`);
    
    const handleData = (snapshot) => {
      if (snapshot.exists()) {
        const notificationData = snapshot.val();
        const notificationArray = Object.keys(notificationData).map(key => ({
          id: key,
          ...notificationData[key]
        }));
        
        notificationArray.sort((a, b) => {
          const timeA = new Date(a.timestamp);
          const timeB = new Date(b.timestamp);
          return timeB - timeA;
        });
        
        setNotifications(notificationArray);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    };
    
    const handleError = (err) => {
      console.error('Error getting notifications:', err);
      setError(err.message);
      setLoading(false);
    };
    
    onValue(notificationsRef, handleData, handleError);
    
    return () => {
      off(notificationsRef, 'value', handleData);
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    if (isDev) {
      console.log('Development mode: Mocking markAsRead', notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      return;
    }

    try {
      const notificationRef = ref(rtdb, `notifications/${userId}/${notificationId}`);
      await update(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  return { notifications, loading, error, markAsRead };
};
