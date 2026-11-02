// src/screens/ChatScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import OnlineIndicator from '../components/OnlineIndicator';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';

const ChatScreen = ({ navigation }) => {
  const { session } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMatches();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          user1:profiles!matches_user1_id_fkey(id, name, image_url, last_active),
          user2:profiles!matches_user2_id_fkey(id, name, image_url, last_active)
        `)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);

      if (error) throw error;
      
      const formattedMatches = data.map(match => {
        const otherUser = match.user1_id === session.user.id ? match.user2 : match.user1;
        return { matchId: match.id, otherUser: otherUser };
      });

      setMatches(formattedMatches);
    } catch (error) {
      console.log('Error fetching matches:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnmatch = (matchId, name) => {
    Alert.alert(
      "Unmatch?",
      `Are you sure you want to unmatch with ${name}? This will permanently delete your conversation.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unmatch", 
          style: "destructive",
          onPress: async () => {
            try {
              // Delete the match (messages will cascade delete automatically)
              const { error } = await supabase
                .from('matches')
                .delete()
                .eq('id', matchId);

              if (error) throw error;
              
              // Remove from local list
              setMatches(prev => prev.filter(m => m.matchId !== matchId));
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.matchItem}
      onPress={() => navigation.navigate('ChatRoom', { matchId: item.matchId, otherUser: item.otherUser })}
      onLongPress={() => handleUnmatch(item.matchId, item.otherUser.name)}
      delayLongPress={500}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.otherUser.image_url || 'https://via.placeholder.com/150' }} style={styles.avatar} />
        <View style={styles.onlineIndicatorPosition}>
          <OnlineIndicator lastActive={item.otherUser.last_active} />
        </View>
      </View>
      
      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{item.otherUser.name}</Text>
        <Text style={styles.matchSubtitle}>Tap to chat. Long press to unmatch.</Text>
      </View>
      <Ionicons name="chatbubble-outline" size={24} color="#FF5A5F" />
    </TouchableOpacity>
  );

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#FF5A5F" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}><Ionicons name="chatbubbles-outline" size={50} color="#FF5A5F" /></View>
          <Text style={styles.title}>No messages yet</Text>
          <Text style={styles.subtitle}>Start swiping to get matches and begin chatting.</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={(item) => item.matchId}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2E1065' },
  listContainer: { padding: 15 },
  matchItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  onlineIndicatorPosition: { position: 'absolute', bottom: 0, right: 0 },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 18, fontWeight: 'bold', color: '#2E1065' },
  matchSubtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFE5E5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E1065', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22 },
});

export default ChatScreen;