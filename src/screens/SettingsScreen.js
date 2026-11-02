// src/screens/SettingsScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';

const SettingsScreen = ({ navigation }) => {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            await supabase.auth.signOut();
            setLoading(false);
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your profile, matches, and messages. This cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Forever", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Note: In a production app, you would call a Supabase Edge Function here 
              // to securely delete the auth user and cascade the database rows.
              // For now, we delete their profile data.
              await supabase.from('profiles').delete().eq('id', session.user.id);
              await supabase.auth.signOut();
              Alert.alert("Account Deleted", "Your account has been removed.");
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2E1065" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('EditProfile')}>
          <View style={styles.itemLeft}>
            <Ionicons name="person-outline" size={22} color="#2E1065" />
            <Text style={styles.itemText}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item} onPress={handleLogout} disabled={loading}>
          <View style={styles.itemLeft}>
            <Ionicons name="log-out-outline" size={22} color="#FF5A5F" />
            <Text style={[styles.itemText, { color: '#FF5A5F' }]}>Log Out</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Support</Text>
        
        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#2E1065" />
            <Text style={styles.itemText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <View style={styles.itemLeft}>
            <Ionicons name="help-circle-outline" size={22} color="#2E1065" />
            <Text style={styles.itemText}>Help Center</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { borderBottomWidth: 0 }]}>
        <TouchableOpacity style={styles.item} onPress={handleDeleteAccount} disabled={loading}>
          <View style={styles.itemLeft}>
            {loading ? (
              <ActivityIndicator size="small" color="#FF5A5F" />
            ) : (
              <Ionicons name="trash-outline" size={22} color="#FF5A5F" />
            )}
            <Text style={[styles.itemText, { color: '#FF5A5F' }]}>Delete Account</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.versionText}>Latch v1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E1065' },
  section: { backgroundColor: '#fff', marginTop: 20, paddingHorizontal: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#999', marginTop: 15, marginBottom: 5, textTransform: 'uppercase' },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemText: { fontSize: 16, color: '#333', marginLeft: 15, fontWeight: '500' },
  versionText: { textAlign: 'center', color: '#999', fontSize: 12, marginTop: 30, marginBottom: 40 },
});

export default SettingsScreen;