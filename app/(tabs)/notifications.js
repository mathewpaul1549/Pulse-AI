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
import { useAuth } from '../../hooks/useAuth';
import { useMatchNotifications } from '../../hooks/useMatchNotifications';
import { formatActivityTime } from '../../utils/activityUtils';
import { Ionicons } from '@expo/vector-icons';

const NotificationItem = ({ notification, onPress }) => {
  const isRead = notification.read;
  
  return (
    <TouchableOpacity 
      style={[styles.notificationItem, isRead ? styles.readNotification : styles.unreadNotification]} 
      onPress={() => onPress(notification)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.matchIconContainer}>
          <Ionicons name="heart" size={24} color="#e91e63" />
        </View>
        
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>
            Match with {notification.matchedUser.username}!
          </Text>
          <Text style={styles.notificationTime}>
            {formatActivityTime(notification.timestamp)}
          </Text>
        </View>
        
        {!isRead && (
          <View style={styles.unreadIndicator} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const { user } = useAuth();
  const { notifications, loading, error, markAsRead } = useMatchNotifications(user?.uid);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const handleNotificationPress = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    setSelectedNotification(notification);
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.screenTitle}>Your Matches</Text>
          
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-outline" size={64} color="#ddd" />
              <Text style={styles.emptyStateText}>No matches yet</Text>
              <Text style={styles.emptyStateSubtext}>
                When you match with someone, you'll see it here
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={({ item }) => (
                <NotificationItem 
                  notification={item} 
                  onPress={handleNotificationPress} 
                />
              )}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh} 
                  colors={['#e91e63']} 
                />
              }
            />
          )}
          
          {selectedNotification && (
            <View style={styles.matchDetailContainer}>
              <View style={styles.matchDetailHeader}>
                <Text style={styles.matchDetailTitle}>
                  You matched with {selectedNotification.matchedUser.username}!
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSelectedNotification(null)}
                >
                  <Ionicons name="close" size={20} color="#888" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.matchDetailContent}>
                {selectedNotification.matchedUser.photoURL ? (
                  <Image 
                    source={{ uri: selectedNotification.matchedUser.photoURL }} 
                    style={styles.matchUserAvatar} 
                  />
                ) : (
                  <View style={styles.matchUserAvatarPlaceholder}>
                    <Text style={styles.matchUserAvatarText}>
                      {selectedNotification.matchedUser.username?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                
                <Text style={styles.matchDetailText}>
                  You can now send messages to each other.
                </Text>
                
                <TouchableOpacity style={styles.viewProfileButton}>
                  <Text style={styles.viewProfileButtonText}>
                    View Profile
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 15,
  },
  listContent: {
    padding: 15,
    paddingTop: 0,
  },
  notificationItem: {
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
  },
  unreadNotification: {
    backgroundColor: '#fff9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#e91e63',
  },
  readNotification: {
    backgroundColor: '#f9f9f9',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e91e63',
    marginLeft: 10,
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
  matchDetailContainer: {
    backgroundColor: '#f9f9f9',
    margin: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  matchDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  matchDetailContent: {
    padding: 20,
    alignItems: 'center',
  },
  matchUserAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  matchUserAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  matchUserAvatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  matchDetailText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  viewProfileButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  viewProfileButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
