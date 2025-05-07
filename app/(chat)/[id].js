import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { formatActivityTime } from '../../utils/activityUtils';
import { Ionicons } from '@expo/vector-icons';

const MessageBubble = ({ message, isCurrentUser }) => {
  return (
    <View style={[
      styles.messageBubble, 
      isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
    ]}>
      <Text style={[
        styles.messageText,
        isCurrentUser ? styles.currentUserText : styles.otherUserText
      ]}>
        {message.text}
      </Text>
      <Text style={[
        styles.messageTime,
        isCurrentUser ? styles.currentUserTime : styles.otherUserTime
      ]}>
        {formatActivityTime(message.timestamp)}
      </Text>
    </View>
  );
};

const TypingIndicator = () => {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDot} />
        <View style={[styles.typingDot, styles.typingDotMiddle]} />
        <View style={styles.typingDot} />
      </View>
      <Text style={styles.typingText}>typing...</Text>
    </View>
  );
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const flatListRef = useRef(null);
  
  const { 
    messages, 
    otherUser, 
    loading, 
    error, 
    sendMessage, 
    isTyping,
    setTypingStatus
  } = useChat(id, user?.uid);
  
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  
  useEffect(() => {
    if (otherUser?.username) {
      router.setParams({ headerTitle: otherUser.username });
    }
  }, [otherUser]);
  
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);
  
  const handleSend = async () => {
    if (!messageText.trim() || sending) return;
    
    setSending(true);
    try {
      await sendMessage(messageText);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  
  const handleChangeText = (text) => {
    setMessageText(text);
    setTypingStatus(text.length > 0);
  };
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading chat: {error}</Text>
        </View>
      ) : (
        <>
          {otherUser && (
            <View style={styles.chatHeader}>
              {otherUser.photoURL ? (
                <Image 
                  source={{ uri: otherUser.photoURL }} 
                  style={styles.userAvatar} 
                />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Text style={styles.userAvatarText}>
                    {otherUser.username?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
              <Text style={styles.usernameText}>{otherUser.username}</Text>
            </View>
          )}
          
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => (
              <MessageBubble 
                message={item} 
                isCurrentUser={item.senderId === user?.uid} 
              />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No messages yet</Text>
                <Text style={styles.emptyChatSubtext}>Start the conversation!</Text>
              </View>
            }
          />
          
          {isTyping && <TypingIndicator />}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={messageText}
              onChangeText={handleChangeText}
              multiline
            />
            <TouchableOpacity 
              style={[
                styles.sendButton, 
                (!messageText.trim() || sending) ? styles.sendButtonDisabled : {}
              ]}
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  usernameText: {
    fontSize: 16,
    fontWeight: '600',
  },
  messagesList: {
    padding: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  currentUserBubble: {
    backgroundColor: '#e91e63',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  otherUserBubble: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: 'white',
  },
  otherUserText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 5,
  },
  currentUserTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherUserTime: {
    color: '#999',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 15,
    marginBottom: 10,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: '#E5E5E5',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 5,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#777',
    marginRight: 2,
  },
  typingDotMiddle: {
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#777',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#f8a5c2',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});
