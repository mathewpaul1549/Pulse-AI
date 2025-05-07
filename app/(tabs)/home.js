import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.username || 'there'}!</Text>
        <Text style={styles.subtitle}>Welcome to MentaCrush</Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionCard, styles.hintCard]} 
          onPress={() => router.push('/(tabs)/send-hint')}
        >
          <Ionicons name="heart" size={32} color="white" />
          <Text style={styles.actionTitle}>Send a Hint</Text>
          <Text style={styles.actionSubtitle}>Let someone know you're interested</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionCard, styles.activityCard]} 
          onPress={() => router.push('/(tabs)/feed')}
        >
          <Ionicons name="people" size={32} color="white" />
          <Text style={styles.actionTitle}>Activity Feed</Text>
          <Text style={styles.actionSubtitle}>See what's happening</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionCard, styles.matchesCard]} 
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <Ionicons name="notifications" size={32} color="white" />
          <Text style={styles.actionTitle}>Your Matches</Text>
          <Text style={styles.actionSubtitle}>Check your notifications</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Your Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.hintsSent || 0}</Text>
            <Text style={styles.statLabel}>Hints Sent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user?.hintsReceived || 0}</Text>
            <Text style={styles.statLabel}>Hints Received</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 30,
    backgroundColor: '#f9f9f9',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  actionsContainer: {
    padding: 15,
  },
  actionCard: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hintCard: {
    backgroundColor: '#e91e63',
  },
  activityCard: {
    backgroundColor: '#2196f3',
  },
  matchesCard: {
    backgroundColor: '#4caf50',
  },
  actionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  actionSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  statsContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    marginTop: 10,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});
