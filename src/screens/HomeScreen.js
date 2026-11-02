// src/screens/HomeScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import IcebreakerModal from '../components/IcebreakerModal';
import MatchModal from '../components/MatchModal';
import OnlineIndicator from '../components/OnlineIndicator';
import PremiumModal from '../components/PremiumModal';
import ReportModal from '../components/ReportModal';
import { AuthContext } from '../services/AuthContext';
import { FilterContext } from '../services/FilterContext';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');
const DAILY_SWIPE_LIMIT = 20;
const DAILY_SUPER_LIKE_LIMIT = 1;

const HomeScreen = ({ navigation }) => {
  const { session } = useContext(AuthContext);
  const { activeFilter } = useContext(FilterContext);

  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [myImageUrl, setMyImageUrl] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [swipedHistory, setSwipedHistory] = useState([]);
  const [showIcebreakerModal, setShowIcebreakerModal] = useState(false);
  const [sendingSuperLike, setSendingSuperLike] = useState(false);
  const [superLikesUsed, setSuperLikesUsed] = useState(0);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState(null);
  const [newMatchId, setNewMatchId] = useState(null);

  useEffect(() => { fetchUserProfileAndMatches(); }, [activeFilter]);

  const fetchUserProfileAndMatches = async () => {
    setLoading(true);
    try {
      const { data: myProfile } = await supabase.from('profiles').select('is_premium, daily_swipes, last_swipe_date, image_url').eq('id', session.user.id).single();
      setUserProfile(myProfile);
      setMyImageUrl(myProfile.image_url);

      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase.from('swipes').select('*', { count: 'exact', head: true }).eq('swiper_id', session.user.id).eq('is_super_like', true).gte('created_at', today);
      setSuperLikesUsed(count || 0);

      const { data: blockedData } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', session.user.id);
      const blockedIds = blockedData ? blockedData.map(b => b.blocked_id) : [];

      let query = supabase.from('profiles').select('*').neq('id', session.user.id).not('id', 'in', `(${blockedIds.join(',')})`).limit(20);
      if (activeFilter) query = query.contains('tags', [activeFilter]);

      const { data: allProfiles, error } = await query;
      if (error) throw error;
      setProfiles(allProfiles && allProfiles.length > 0 ? allProfiles : []);
      setCurrentIndex(0);
    } catch (error) {
      Alert.alert('Error loading data', error.message);
    } finally { setLoading(false); }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await supabase.from('profiles').update({ is_premium: true }).eq('id', session.user.id);
      setUserProfile(prev => ({ ...prev, is_premium: true }));
      setShowPremiumModal(false);
      Alert.alert("Premium Activated! 💎", "You now have unlimited swipes and super likes.");
    } catch (error) { Alert.alert('Upgrade Failed', error.message); } finally { setUpgrading(false); }
  };

  const checkSwipeLimit = async () => {
    if (userProfile?.is_premium) return true;
    const today = new Date().toISOString().split('T')[0];
    let currentSwipes = userProfile?.daily_swipes || 0;
    if (userProfile?.last_swipe_date !== today) currentSwipes = 0; 
    if (currentSwipes >= DAILY_SWIPE_LIMIT) { setShowPremiumModal(true); return false; }
    await supabase.from('profiles').update({ daily_swipes: currentSwipes + 1, last_swipe_date: today }).eq('id', session.user.id);
    setUserProfile(prev => ({ ...prev, daily_swipes: currentSwipes + 1, last_swipe_date: today }));
    return true;
  };

  const triggerMatch = async (profile) => {
    const { data: matchData } = await supabase.from('matches').insert({ user1_id: session.user.id, user2_id: profile.id }).select().single();
    if (matchData) { setNewMatchId(matchData.id); setMatchedProfile(profile); setShowMatchModal(true); }
  };

  const recordProfileView = async (viewedId) => {
    // Record that we viewed this user. (Ignore duplicate errors)
    await supabase.from('profile_views').insert({ viewer_id: session.user.id, viewed_id: viewedId }).select().single();
  };

  const handleSwipe = async (direction) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;
    const canSwipe = await checkSwipeLimit();
    if (!canSwipe) return;
    setSwipedHistory(prev => [...prev, currentProfile]);
    
    if (!currentProfile.id.startsWith('dummy')) {
      // Record the profile view
      await recordProfileView(currentProfile.id);

      const { error: swipeError } = await supabase.from('swipes').insert({ swiper_id: session.user.id, swiped_id: currentProfile.id, is_like: direction === 'right' });
      
      if (!swipeError && direction === 'right') {
        const { data: mutualLike } = await supabase.from('swipes').select('*').eq('swiper_id', currentProfile.id).eq('swiped_id', session.user.id).eq('is_like', true).single();
        if (mutualLike) triggerMatch(currentProfile);
      }
    }
    setCurrentIndex((prev) => (prev + 1) % profiles.length);
  };

  const handleSendSuperLike = async (message) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile) return;
    setSendingSuperLike(true);
    try {
      // Record the profile view
      await recordProfileView(currentProfile.id);

      const { error: swipeError } = await supabase.from('swipes').insert({ swiper_id: session.user.id, swiped_id: currentProfile.id, is_like: true, is_super_like: true, icebreaker: message });
      if (swipeError) throw swipeError;
      setSuperLikesUsed(prev => prev + 1);
      const { data: mutualLike } = await supabase.from('swipes').select('*').eq('swiper_id', currentProfile.id).eq('swiped_id', session.user.id).eq('is_like', true).single();
      if (mutualLike) triggerMatch(currentProfile);
      else Alert.alert("Super Like Sent! ⭐", `${currentProfile.name} will see your message instantly.`);
      setCurrentIndex((prev) => (prev + 1) % profiles.length);
      setShowIcebreakerModal(false);
    } catch (error) { Alert.alert('Error sending Super Like', error.message); } finally { setSendingSuperLike(false); }
  };

  const handleOpenSuperLike = () => {
    if (!userProfile?.is_premium && superLikesUsed >= DAILY_SUPER_LIKE_LIMIT) { setShowPremiumModal(true); return; }
    setShowIcebreakerModal(true);
  };

  const handleRewind = async () => {
    if (swipedHistory.length === 0) return;
    if (!userProfile?.is_premium) { setShowPremiumModal(true); return; }
    const lastSwiped = swipedHistory[swipedHistory.length - 1];
    await supabase.from('swipes').delete().eq('swiper_id', session.user.id).eq('swiped_id', lastSwiped.id);
    await supabase.from('profile_views').delete().eq('viewer_id', session.user.id).eq('viewed_id', lastSwiped.id);
    setProfiles(prev => [lastSwiped, ...prev]);
    setSwipedHistory(prev => prev.slice(0, -1));
    setCurrentIndex(0); 
  };

  const handleGoToChat = () => {
    setShowMatchModal(false);
    navigation.navigate('Chat', { screen: 'ChatRoom', params: { matchId: newMatchId, otherUser: matchedProfile } });
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#FF5A5F" /></View>;

  const currentProfile = profiles[currentIndex];
  if (!currentProfile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="funnel-outline" size={60} color="#ccc" />
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2E1065', marginTop: 10 }}>No profiles found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!userProfile?.is_premium && <View style={styles.swipeCounter}><Text style={styles.swipeCounterText}>{Math.max(0, DAILY_SWIPE_LIMIT - (userProfile?.daily_swipes || 0))} swipes left today</Text></View>}
      {activeFilter && <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>Filter: {activeFilter}</Text></View>}

      <View style={styles.cardContainer}>
        <Image source={{ uri: currentProfile.image_url || 'https://via.placeholder.com/400' }} style={styles.image} />
        <View style={styles.gradientOverlay} />

        <View style={styles.topBar}>
           <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
             <OnlineIndicator lastActive={currentProfile.last_active} />
             <Text style={{ color: '#fff', fontSize: 12, marginLeft: 5, fontWeight: 'bold' }}>
                {currentProfile.last_active && (new Date() - new Date(currentProfile.last_active)) / 1000 / 60 < 5 ? 'Online' : 'Recently'}
             </Text>
           </View>
           <TouchableOpacity style={styles.reportButton} onPress={() => setShowReportModal(true)}><Ionicons name="ellipsis-horizontal" size={24} color="#fff" /></TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.nameText}>{currentProfile.name}{currentProfile.age ? `, ${currentProfile.age}` : ''}</Text>
          <Text style={styles.bioText}>{currentProfile.bio || 'No bio yet.'}</Text>
          
          {currentProfile.tags && currentProfile.tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
              {currentProfile.tags.map((tag, index) => (<View key={index} style={styles.tagChip}><Text style={styles.tagChipText}>{tag}</Text></View>))}
            </ScrollView>
          )}

          {/* Prompts */}
          {currentProfile.prompts && currentProfile.prompts.length > 0 && (
            <View style={styles.promptsContainer}>
              {currentProfile.prompts.map((p, idx) => (
                <View key={idx} style={styles.promptCard}>
                  <Text style={styles.promptQuestion}>{p.prompt}</Text>
                  <Text style={styles.promptAnswer}>{p.answer}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={[styles.smallActionButton, { borderColor: '#F5A623' }]} onPress={handleRewind}><Ionicons name="arrow-undo" size={24} color="#F5A623" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleSwipe('left')}><Ionicons name="close" size={32} color="#FF5A5F" /></TouchableOpacity>
        <TouchableOpacity style={[styles.smallActionButton, { borderColor: '#4A90E2', backgroundColor: '#4A90E2' }]} onPress={handleOpenSuperLike}><Ionicons name="star" size={24} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleSwipe('right')}><Ionicons name="heart" size={32} color="#10B981" /></TouchableOpacity>
      </View>

      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} onUpgrade={handleUpgrade} loading={upgrading} />
      <ReportModal visible={showReportModal} onClose={() => setShowReportModal(false)} reportedUser={currentProfile} onActionComplete={() => handleSwipe('left')} />
      <IcebreakerModal visible={showIcebreakerModal} onClose={() => setShowIcebreakerModal(false)} onSend={handleSendSuperLike} targetName={currentProfile.name} loading={sendingSuperLike} />
      <MatchModal visible={showMatchModal} onClose={() => setShowMatchModal(false)} onSendMessage={handleGoToChat} matchedProfile={matchedProfile} myProfileImage={myImageUrl} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center' },
  swipeCounter: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(46, 16, 101, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  swipeCounterText: { color: '#2E1065', fontWeight: 'bold', fontSize: 14 },
  filterBadge: { position: 'absolute', top: 90, alignSelf: 'center', backgroundColor: '#FF5A5F', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
  filterBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cardContainer: { width: width * 0.9, height: height * 0.65, alignSelf: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%', backgroundColor: 'rgba(0,0,0,0.75)' },
  topBar: { position: 'absolute', top: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportButton: { backgroundColor: 'rgba(0,0,0,0.4)', padding: 8, borderRadius: 20 },
  infoContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  nameText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  bioText: { color: '#e0e0e0', fontSize: 14, marginTop: 5 },
  tagsScroll: { marginTop: 10, flexDirection: 'row' },
  tagChip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  tagChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  promptsContainer: { marginTop: 15 },
  promptCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: 10, marginBottom: 8 },
  promptQuestion: { fontSize: 12, fontWeight: 'bold', color: '#FF5A5F', marginBottom: 4 },
  promptAnswer: { fontSize: 14, color: '#333', fontWeight: '500' },
  actionContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, gap: 15 },
  actionButton: { width: 65, height: 65, backgroundColor: '#fff', borderRadius: 32.5, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 5, elevation: 3 },
  smallActionButton: { width: 50, height: 50, backgroundColor: '#fff', borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
});

export default HomeScreen;