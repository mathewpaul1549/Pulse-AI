import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { formatActivityTime } from '../../utils/activityUtils';
import { Ionicons } from '@expo/vector-icons';
import { useChats } from '../../hooks/useChats';

const ChatListItem = ({ chat, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.chatItem} 
      onPress={() => onPress(chat)}
    >
      <View style={styles.chatInfo}>
        {chat.otherUser.photoURL ? (
          <Image 
            source={{ uri: chat.otherUser.photoURL }} 
            style={styles.avatar} 
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {chat.otherUser.username?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        
        <View style={styles.chatDetails}>
          <Text style={styles.username}>{chat.otherUser.username}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessage?.text || 'No messages yet'}
          </Text>
        </View>
      </View>
      
      <View style={styles.chatMeta}>
        <Text style={styles.timestamp}>
          {chat.lastMessage ? formatActivityTime(chat.lastMessage.timestamp) : ''}
        </Text>
        {chat.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{chat.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function ChatListScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { chats, loading, error } = useChats(user?.uid);
  
  const handleChatPress = (chat) => {
    router.push(`/(chat)/${chat.id}`);
  };
  
  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading chats: {error}</Text>
        </View>
      ) : (
        <>
          {chats.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={64} color="#ddd" />
              <Text style={styles.emptyStateText}>No chats yet</Text>
              <Text style={styles.emptyStateSubtext}>
                When you match with someone, you can chat with them here
              </Text>
            </View>
          ) : (
            <FlatList
              data={chats}
              renderItem={({ item }) => (
                <ChatListItem 
                  chat={item} 
                  onPress={handleChatPress} 
                />
              )}
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
  chatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chatInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  unreadBadge: {
    backgroundColor: '#e91e63',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
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
