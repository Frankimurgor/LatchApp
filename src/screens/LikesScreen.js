// src/screens/LikesScreen.js
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PremiumModal from '../components/PremiumModal';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
const numColumns = 2;
const itemWidth = (width - 60) / numColumns;

const LikesScreen = () => {
  const { session } = useContext(AuthContext);
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchLikesAndStatus();
  }, []);

  const fetchLikesAndStatus = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', session.user.id).single();
      if (profile) setIsPremium(profile.is_premium);

      const { data, error } = await supabase
        .from('swipes')
        .select(`id, swiper_id, icebreaker, is_super_like, profiles!swipes_swiper_id_fkey (id, name, age, image_url)`)
        .eq('swiped_id', session.user.id)
        .eq('is_like', true);

      if (error) throw error;
      setLikes(data || []);
    } catch (error) {
      console.log('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await supabase.from('profiles').update({ is_premium: true }).eq('id', session.user.id);
      setIsPremium(true);
      setShowPremiumModal(false);
      Alert.alert("Welcome to Premium! 💎", "You can now see everyone who likes you.");
    } catch (error) {
      Alert.alert('Upgrade Failed', error.message);
    } finally {
      setUpgrading(false);
    }
  };

  const handleLikeBack = async (swiperId, swiperName) => {
    try {
      await supabase.from('swipes').insert({ swiper_id: session.user.id, swiped_id: swiperId, is_like: true });
      await supabase.from('matches').insert({ user1_id: session.user.id, user2_id: swiperId });
      Alert.alert("It's a Match! 🎉", `You and ${swiperName} are now connected.`);
      setLikes((prev) => prev.filter((like) => like.swiper_id !== swiperId));
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderItem = ({ item }) => {
    const profile = item.profiles;
    return (
      <TouchableOpacity style={styles.gridItem} activeOpacity={0.9} onPress={() => !isPremium && setShowPremiumModal(true)}>
        <Image source={{ uri: profile.image_url || 'https://via.placeholder.com/400' }} style={styles.image} />
        
        {/* Show Super Like badge */}
        {item.is_super_like && (
          <View style={styles.superLikeBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.superLikeText}>Super Like</Text>
          </View>
        )}

        {!isPremium && (
          <BlurView intensity={60} style={StyleSheet.absoluteFill}>
            <View style={styles.lockContainer}><Ionicons name="lock-closed" size={30} color="#fff" /></View>
          </BlurView>
        )}

        <View style={styles.overlay}>
          <Text style={styles.nameText}>{profile.name}{profile.age ? `, ${profile.age}` : ''}</Text>
          
          {/* Show Icebreaker if premium */}
          {isPremium && item.icebreaker && (
             <Text style={styles.icebreakerText} numberOfLines={2}>"{item.icebreaker}"</Text>
          )}

          {isPremium ? (
            <TouchableOpacity style={styles.likeBackButton} onPress={() => handleLikeBack(profile.id, profile.name)}>
              <Ionicons name="heart" size={20} color="#fff" />
              <Text style={styles.likeBackText}>Like Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.unlockButton} onPress={() => setShowPremiumModal(true)}>
              <Ionicons name="lock-open" size={16} color="#2E1065" />
              <Text style={styles.unlockText}>Unlock</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#FF5A5F" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Likes</Text>
        <Text style={styles.headerSubtitle}>{likes.length} {likes.length === 1 ? 'person likes' : 'people like'} you</Text>
      </View>

      {likes.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}><Ionicons name="heart-outline" size={50} color="#FF5A5F" /></View>
          <Text style={styles.title}>No likes yet</Text>
          <Text style={styles.subtitle}>Keep swiping to get noticed!</Text>
        </View>
      ) : (
        <FlatList data={likes} renderItem={renderItem} keyExtractor={(item) => item.id} numColumns={numColumns} contentContainerStyle={styles.listContainer} columnWrapperStyle={styles.columnWrapper} />
      )}

      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} onUpgrade={handleUpgrade} loading={upgrading} title="See Who Likes You" subtitle="Upgrade to Latch Premium to unlock your matches instantly." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2E1065' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  listContainer: { padding: 15 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 15 },
  gridItem: { width: itemWidth, height: itemWidth * 1.5, borderRadius: 15, overflow: 'hidden', backgroundColor: '#ccc' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  lockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  superLikeBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, zIndex: 10 },
  superLikeText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.7)', padding: 10 },
  nameText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  icebreakerText: { color: '#FFD700', fontSize: 12, fontStyle: 'italic', marginBottom: 10 },
  likeBackButton: { flexDirection: 'row', backgroundColor: '#FF5A5F', paddingVertical: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  likeBackText: { color: '#fff', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
  unlockButton: { flexDirection: 'row', backgroundColor: '#FFD700', paddingVertical: 8, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  unlockText: { color: '#2E1065', fontWeight: 'bold', marginLeft: 5, fontSize: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFE5E5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E1065', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22 },
});

export default LikesScreen;