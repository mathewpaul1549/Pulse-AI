import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useMatchNotifications } from '../../hooks/useMatchNotifications';
import { Ionicons } from '@expo/vector-icons';
import { formatActivityTime } from '../../utils/activityUtils';

const NotificationItem = ({ notification, onPress, onMarkAsRead }) => {
  const isMatch = notification.type === 'match';
  
  return (
    <TouchableOpacity 
      style={[
        styles.notificationItem,
        notification.read ? styles.readNotification : {}
      ]} 
      onPress={() => onPress(notification)}
    >
      <View style={styles.notificationContent}>
        {notification.matchedUser?.photoURL ? (
          <Image 
            source={{ uri: notification.matchedUser.photoURL }} 
            style={styles.userAvatar} 
          />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarText}>
              {notification.matchedUser?.username?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        
        <View style={styles.notificationDetails}>
          <Text style={styles.notificationTitle}>
            {isMatch ? '🎉 New Match!' : 'New Hint!'}
          </Text>
          <Text style={styles.notificationText}>
            {isMatch 
              ? `You and ${notification.matchedUser?.username} have matched!` 
              : `Someone sent you a hint!`}
          </Text>
          <Text style={styles.notificationTime}>
            {formatActivityTime(notification.timestamp)}
          </Text>
        </View>
        
        {!notification.read && (
          <View style={styles.unreadIndicator} />
        )}
      </View>
      
      {!notification.read && (
        <TouchableOpacity 
          style={styles.markReadButton}
          onPress={() => onMarkAsRead(notification.id)}
        >
          <Text style={styles.markReadText}>Mark as read</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const MatchDetailsModal = ({ notification, onClose, onStartChat }) => {
  if (!notification) return null;
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.matchHeader}>
          <Text style={styles.matchTitle}>🎉 It's a Match!</Text>
          <Text style={styles.matchSubtitle}>
            You and {notification.matchedUser?.username} have both shown interest in each other
          </Text>
        </View>
        
        <View style={styles.userProfile}>
          {notification.matchedUser?.photoURL ? (
            <Image 
              source={{ uri: notification.matchedUser.photoURL }} 
              style={styles.matchAvatar} 
            />
          ) : (
            <View style={styles.matchAvatarPlaceholder}>
              <Text style={styles.matchAvatarText}>
                {notification.matchedUser?.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          
          <Text style={styles.matchUsername}>{notification.matchedUser?.username}</Text>
          
          {notification.matchedUser?.bio && (
            <Text style={styles.matchBio}>{notification.matchedUser.bio}</Text>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.viewProfileButton}
            onPress={() => onStartChat(notification)}
          >
            <Text style={styles.viewProfileButtonText}>
              Start Chatting
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { notifications, loading, error, markAsRead } = useMatchNotifications(user?.uid);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  const handleNotificationPress = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.type === 'match') {
      setSelectedNotification(notification);
    }
  };
  
  const handleStartChat = (notification) => {
    setSelectedNotification(null);
    router.push(`/(chat)/${notification.matchedUser.uid}`);
  };
  
  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading notifications: {error}</Text>
        </View>
      ) : (
        <>
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color="#ddd" />
              <Text style={styles.emptyStateText}>No notifications yet</Text>
              <Text style={styles.emptyStateSubtext}>
                When you receive hints or matches, they'll appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={({ item }) => (
                <NotificationItem 
                  notification={item} 
                  onPress={handleNotificationPress}
                  onMarkAsRead={markAsRead}
                />
              )}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#e91e63']}
                />
              }
            />
          )}
        </>
      )}
      
      {selectedNotification && (
        <MatchDetailsModal 
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onStartChat={handleStartChat}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  listContent: {
    padding: 15,
  },
  notificationItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
  },
  readNotification: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 15,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationDetails: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e91e63',
    marginLeft: 10,
  },
  markReadButton: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    alignItems: 'center',
  },
  markReadText: {
    color: '#666',
    fontSize: 12,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: '85%',
    maxHeight: '80%',
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  matchHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 10,
  },
  matchSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  userProfile: {
    alignItems: 'center',
    marginBottom: 20,
  },
  matchAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
  },
  matchAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  matchAvatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  matchUsername: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  matchBio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  viewProfileButton: {
    backgroundColor: '#e91e63',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  viewProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
