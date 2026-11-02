// src/screens/ViewersScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { supabase } from '../services/supabase';
import { AuthContext } from '../services/AuthContext';
import PremiumModal from '../components/PremiumModal';

const { width } = Dimensions.get('window');
const numColumns = 3;
const itemWidth = (width - 60) / numColumns;

const ViewersScreen = ({ navigation }) => {
  const { session } = useContext(AuthContext);
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchViewersAndStatus();
  }, []);

  const fetchViewersAndStatus = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', session.user.id).single();
      if (profile) setIsPremium(profile.is_premium);

      const { data, error } = await supabase
        .from('profile_views')
        .select(`id, viewer_id, profiles!profile_views_viewer_id_fkey (id, name, age, image_url)`)
        .eq('viewed_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViewers(data || []);
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
      Alert.alert("Welcome to Premium! 💎", "You can now see everyone who viewed your profile.");
    } catch (error) {
      Alert.alert('Upgrade Failed', error.message);
    } finally {
      setUpgrading(false);
    }
  };

  const renderItem = ({ item }) => {
    const viewer = item.profiles;
    return (
      <TouchableOpacity 
        style={styles.gridItem} 
        activeOpacity={0.9} 
        onPress={() => !isPremium && setShowPremiumModal(true)}
      >
        <Image source={{ uri: viewer.image_url || 'https://via.placeholder.com/150' }} style={styles.image} />
        
        {!isPremium && (
          <BlurView intensity={80} style={StyleSheet.absoluteFill}>
            <View style={styles.lockContainer}>
              <Ionicons name="lock-closed" size={20} color="#fff" />
            </View>
          </BlurView>
        )}

        <View style={styles.overlay}>
          <Text style={styles.nameText} numberOfLines={1}>{viewer.name}{viewer.age ? `, ${viewer.age}` : ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#FF5A5F" /></View></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2E1065" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Who Viewed Me</Text>
        <View style={{ width: 24 }} />
      </View>

      {viewers.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}><Ionicons name="eye-outline" size={50} color="#FF5A5F" /></View>
          <Text style={styles.title}>No views yet</Text>
          <Text style={styles.subtitle}>Make sure your profile is complete to get noticed!</Text>
        </View>
      ) : (
        <FlatList 
          data={viewers} 
          renderItem={renderItem} 
          keyExtractor={(item) => item.id} 
          numColumns={numColumns} 
          contentContainerStyle={styles.listContainer} 
          columnWrapperStyle={styles.columnWrapper} 
        />
      )}

      <PremiumModal 
        visible={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)} 
        onUpgrade={handleUpgrade} 
        loading={upgrading} 
        title="See Who Viewed You" 
        subtitle="Upgrade to Latch Premium to unlock your profile viewers and increase your chances." 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E1065' },
  listContainer: { padding: 15 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 15 },
  gridItem: { width: itemWidth, height: itemWidth * 1.4, borderRadius: 15, overflow: 'hidden', backgroundColor: '#ccc' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  lockContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8 },
  nameText: { color: '#fff', fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFE5E5', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E1065', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22 },
});

export default ViewersScreen;