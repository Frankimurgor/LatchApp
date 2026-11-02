// src/screens/ProfileScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';

const ProfileScreen = ({ navigation }) => {
  const { session } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { fetchProfile(); });
    return unsubscribe;
  }, [navigation]);

  const fetchProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (!error && data) setProfile(data);
    setLoading(false);
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#FF5A5F" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#2E1065" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <View style={styles.avatarContainer}>
          {profile?.image_url ? (
            <Image source={{ uri: profile.image_url }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}><Ionicons name="person" size={50} color="#ccc" /></View>
          )}
          {profile?.is_verified && (
            <View style={styles.verifiedBadge}><Ionicons name="checkmark" size={12} color="#fff" /></View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
          <Text style={styles.name}>{profile?.name || 'Anonymous'}{profile?.age ? `, ${profile.age}` : ''}</Text>
          {profile?.is_verified && <Ionicons name="checkmark-circle" size={22} color="#10B981" style={{ marginLeft: 5 }} />}
        </View>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.settingsList}>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Viewers')}>
          <View style={styles.settingLeft}>
            <Ionicons name="eye" size={22} color="#4A90E2" />
            <Text style={styles.settingText}>Who Viewed Me</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Verification Button */}
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Verification')}>
          <View style={styles.settingLeft}>
            <Ionicons name={profile?.is_verified ? "shield-checkmark" : "shield-outline"} size={22} color={profile?.is_verified ? "#10B981" : "#999"} />
            <Text style={styles.settingText}>
              {profile?.is_verified ? "Verified Account" : "Get Verified"}
            </Text>
          </View>
          {profile?.is_verified ? (
             <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          ) : (
             <Ionicons name="chevron-forward" size={20} color="#ccc" />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="help-circle" size={22} color="#999" />
            <Text style={styles.settingText}>Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2E1065' },
  profileInfo: { alignItems: 'center', marginTop: 20, paddingHorizontal: 20 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#fff' },
  placeholderAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
  verifiedBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: '#10B981', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#2E1065' },
  bio: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 5 },
  editButton: { marginTop: 15, backgroundColor: '#FF5A5F', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 20 },
  editButtonText: { color: '#fff', fontWeight: 'bold' },
  settingsList: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 15, paddingHorizontal: 15, marginBottom: 30, marginTop: 20 },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingText: { fontSize: 16, color: '#333', marginLeft: 15, fontWeight: '500' },
});

export default ProfileScreen;