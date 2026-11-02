// src/screens/ChatRoomScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';
import { UnreadContext } from '../services/UnreadContext';

const ChatRoomScreen = ({ route, navigation }) => {
  const { matchId, otherUser } = route.params;
  const { session } = useContext(AuthContext);
  const { clearUnreadCount } = useContext(UnreadContext);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUserToken, setOtherUserToken] = useState(null);
  const flatListRef = useRef();

  useEffect(() => {
    fetchMessages();
    fetchOtherUserToken();
    markMessagesAsRead(); // Mark as read immediately upon opening

    const subscription = supabase
      .channel(`room-${matchId}`)
      .on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}`
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
        // Mark the incoming message as read immediately since the user is in the chat
        if (payload.new.sender_id !== session.user.id) {
          supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id).then();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [matchId]);

  const fetchMessages = async () => {
    const { data, error } = await supabase.from('messages').select('*').eq('match_id', matchId).order('created_at', { ascending: true });
    if (!error && data) setMessages(data);
  };

  const markMessagesAsRead = async () => {
    // Update all unread messages in this chat sent by the other user
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .neq('sender_id', session.user.id)
      .eq('is_read', false);

    // Clear the global badge (Note: This clears all badges, which is a simplification.
    // In a production app, you'd subtract just this room's unread count).
    clearUnreadCount();
  };

  const fetchOtherUserToken = async () => {
    const { data } = await supabase.from('profiles').select('push_token').eq('id', otherUser.id).single();
    if (data?.push_token) setOtherUserToken(data.push_token);
  };

  const sendPushNotification = async (messageText) => {
    if (!otherUserToken) return;
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Accept-encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: otherUserToken,
          sound: 'default',
          title: `New message from ${session.user.user_metadata?.name || 'Someone'}`,
          body: messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
          data: { matchId: matchId },
        }),
      });
    } catch (error) { console.log('Push error:', error); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const messageText = newMessage.trim();
    const messageData = { match_id: matchId, sender_id: session.user.id, content: messageText, is_read: false };

    const tempMessage = { ...messageData, id: Date.now().toString(), created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert(messageData);
    if (!error) sendPushNotification(messageText);
  };

  const handleUnmatch = () => {
    Alert.alert(
      "Unmatch?", `Are you sure you want to unmatch with ${otherUser.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unmatch", style: "destructive",
          onPress: async () => {
            await supabase.from('matches').delete().eq('id', matchId);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === session.user.id;
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2E1065" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUser.name}</Text>
        <TouchableOpacity onPress={handleUnmatch} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#FF5A5F" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput style={styles.input} placeholder="Type a message..." value={newMessage} onChangeText={setNewMessage} multiline />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2E1065' },
  menuButton: { padding: 5 },
  keyboardView: { flex: 1 },
  messagesList: { padding: 15 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 15, marginBottom: 10 },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#FF5A5F', borderBottomRightRadius: 2 },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#eee' },
  messageText: { fontSize: 16 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#333' },
  inputContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, fontSize: 16 },
  sendButton: { width: 45, height: 45, backgroundColor: '#FF5A5F', borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});

export default ChatRoomScreen;