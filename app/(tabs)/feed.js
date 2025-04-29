import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl 
} from 'react-native';
import { useActivities } from '../../hooks/useActivities';
import { formatActivityTime, ACTIVITY_TYPES } from '../../utils/activityUtils';
import { Ionicons } from '@expo/vector-icons';

const ActivityItem = ({ activity }) => {
  let icon;
  let color;
  
  switch (activity.type) {
    case ACTIVITY_TYPES.PROFILE_UPDATE:
      icon = 'person-circle-outline';
      color = '#2196f3';
      break;
    case ACTIVITY_TYPES.NEW_USER:
      icon = 'person-add-outline';
      color = '#4caf50';
      break;
    case ACTIVITY_TYPES.SENT_HINT:
      icon = 'heart-outline';
      color = '#e91e63';
      break;
    case ACTIVITY_TYPES.MATCH:
      icon = 'heart';
      color = '#e91e63';
      break;
    default:
      icon = 'ellipsis-horizontal';
      color = '#757575';
  }
  
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={20} color="white" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityText}>
          <Text style={styles.usernameText}>{activity.username}</Text> {activity.detail}
        </Text>
        <Text style={styles.timeText}>{formatActivityTime(activity.timestamp)}</Text>
      </View>
    </View>
  );
};

export default function FeedScreen() {
  const { activities, loading, error } = useActivities(50);
  const [refreshing, setRefreshing] = useState(false);
  
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
          <Text style={styles.errorText}>Error loading feed: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e91e63']} />
          }
        >
          <Text style={styles.feedTitle}>Recent Activity</Text>
          
          {activities.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#ddd" />
              <Text style={styles.emptyStateText}>No activity yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Activity will appear here as users update their profiles and send hints
              </Text>
            </View>
          ) : (
            activities.map(activity => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          )}
        </ScrollView>
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
    marginBottom: 15,
    textAlign: 'center',
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
  scrollContent: {
    padding: 15,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityText: {
    fontSize: 14,
    lineHeight: 20,
  },
  usernameText: {
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  emptyState: {
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
