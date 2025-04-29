import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Image
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { sendHint, checkForMatch, createActivity, ACTIVITY_TYPES } from '../../utils/activityUtils';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs, where, limit } from 'firebase/firestore';
import { db, isDev } from '../../firebase';

const mockUsers = [
  {
    id: 'user1',
    username: 'alice',
    photoURL: null,
  },
  {
    id: 'user2',
    username: 'bob',
    photoURL: null,
  },
  {
    id: 'user3',
    username: 'charlie',
    photoURL: null,
  },
  {
    id: 'user4',
    username: 'diana',
    photoURL: null,
  },
  {
    id: 'user5',
    username: 'evan',
    photoURL: null,
  },
];

export default function SendHintScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  useEffect(() => {
    const fetchUsers = async () => {
      if (isDev) {
        console.log('Development mode: Using mock users');
        const filteredMockUsers = mockUsers.filter(u => u.id !== user?.uid);
        setUsers(filteredMockUsers);
        setFilteredUsers(filteredMockUsers);
        setLoading(false);
        return;
      }
      
      try {
        const usersQuery = query(
          collection(db, 'users'),
          limit(50)
        );
        
        const snapshot = await getDocs(usersQuery);
        const usersList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(u => u.id !== user?.uid); // Filter out the current user
          
        setUsers(usersList);
        setFilteredUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
        Alert.alert('Error', 'Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [user]);
  
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);
  
  const handleSendHint = async (toUser) => {
    if (sending) return;
    
    setSending(true);
    
    try {
      await sendHint(user.uid, toUser.id);
      
      await createActivity(
        user.uid,
        user.username,
        ACTIVITY_TYPES.SENT_HINT,
        `sent a hint to ${toUser.username}`
      );
      
      const isMatch = await checkForMatch(user.uid, toUser.id);
      
      if (isMatch) {
        await createActivity(
          user.uid,
          user.username,
          ACTIVITY_TYPES.MATCH,
          `matched with ${toUser.username}`
        );
        
        Alert.alert(
          '🎉 It\'s a Match!',
          `You and ${toUser.username} have both shown interest in each other!`,
          [
            { text: 'OK', onPress: () => console.log('Match acknowledged') }
          ]
        );
      } else {
        Alert.alert(
          'Hint Sent!',
          `Your hint has been sent to ${toUser.username}.`,
          [
            { text: 'OK', onPress: () => console.log('Hint acknowledged') }
          ]
        );
      }
    } catch (error) {
      console.error('Error sending hint:', error);
      Alert.alert('Error', 'Failed to send hint. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarText}>
              {item.username?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <Text style={styles.username}>{item.username}</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.sendHintButton}
        onPress={() => handleSendHint(item)}
        disabled={sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="heart" size={18} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : (
        <>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#ddd" />
              <Text style={styles.emptyStateText}>No users found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try a different search term
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 15,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
  },
  sendHintButton: {
    backgroundColor: '#e91e63',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 5,
  },
});
