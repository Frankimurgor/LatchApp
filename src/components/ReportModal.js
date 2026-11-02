// src/components/ReportModal.js
import { Ionicons } from '@expo/vector-icons';
import { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';

const ReportModal = ({ visible, onClose, reportedUser, onActionComplete }) => {
  const { session } = useContext(AuthContext);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for reporting.');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: session.user.id,
          reported_id: reportedUser.id,
          reason: reason.trim(),
        });

      if (error) throw error;
      
      Alert.alert('Report Submitted', 'Thank you for keeping Latch safe. Our team will review this user.');
      onActionComplete(); // Skip to next profile
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: session.user.id,
          blocked_id: reportedUser.id,
        });

      if (error && error.code !== '23505') throw error; // Ignore if already blocked
      
      Alert.alert('User Blocked', `You will no longer see ${reportedUser.name} on Latch.`);
      onActionComplete(); // Skip to next profile
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Ionicons name="warning" size={30} color="#FF5A5F" />
            <Text style={styles.title}>Safety Options</Text>
          </View>
          <Text style={styles.subtitle}>
            What would you like to do with {reportedUser?.name}?
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Reason for reporting (e.g., Inappropriate photos, Harassment)"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={[styles.actionButton, styles.reportButton]} onPress={handleReport} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Report User</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.blockButton]} onPress={handleBlock} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Block User</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2E1065', marginLeft: 10 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 20 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 15, height: 100, textAlignVertical: 'top', marginBottom: 20 },
  actionButton: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  reportButton: { backgroundColor: '#FF5A5F' },
  blockButton: { backgroundColor: '#2E1065' },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#666', fontSize: 16 },
});

export default ReportModal;