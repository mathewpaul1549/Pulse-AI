import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, isDev } from '../firebase';
import { ACTIVITY_TYPES } from '../utils/activityUtils';

const mockActivities = [
  {
    id: 'act1',
    userId: 'user1',
    username: 'alice',
    type: ACTIVITY_TYPES.PROFILE_UPDATE,
    detail: 'updated their profile picture',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'act2',
    userId: 'user2',
    username: 'bob',
    type: ACTIVITY_TYPES.NEW_USER,
    detail: 'joined MentaCrush',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'act3',
    userId: 'user3',
    username: 'charlie',
    type: ACTIVITY_TYPES.PROFILE_UPDATE,
    detail: 'updated their bio',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
  },
];

export const useActivities = (limit = 20, userId = null) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isDev) {
      console.log('Development mode: Using mock activities');
      setActivities(mockActivities);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    let activitiesQuery;
    
    if (userId) {
      activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
    } else {
      activitiesQuery = query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
    }
    
    const unsubscribe = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activityList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActivities(activityList);
        setLoading(false);
      },
      (err) => {
        console.error('Error getting activities:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [limit, userId]);

  return { activities, loading, error };
};
