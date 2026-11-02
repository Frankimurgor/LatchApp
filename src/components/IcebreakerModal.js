// src/components/IcebreakerModal.js
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const IcebreakerModal = ({ visible, onClose, onSend, targetName, loading }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message.trim());
    setMessage(''); // Clear for next time
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={40} color="#FFD700" />
          </View>
          
          <Text style={styles.title}>Super Like {targetName}!</Text>
          <Text style={styles.subtitle}>
            Stand out from the crowd. Send a message to break the ice. They will see this immediately.
          </Text>

          <TextInput
            style={styles.input}
            placeholder={`Say something nice to ${targetName}...`}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={150}
            autoFocus
          />
          
          <Text style={styles.charCount}>{message.length}/150</Text>

          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && { opacity: 0.5 }]} 
            onPress={handleSend} 
            disabled={loading || !message.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#2E1065" />
            ) : (
              <Text style={styles.sendButtonText}>Send Super Like</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 25, padding: 25, alignItems: 'center' },
  iconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF9E6', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2E1065', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  input: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 15, padding: 15, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 5 },
  charCount: { alignSelf: 'flex-end', fontSize: 12, color: '#999', marginBottom: 20 },
  sendButton: { width: '100%', backgroundColor: '#FFD700', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 10 },
  sendButtonText: { color: '#2E1065', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { padding: 10 },
  cancelText: { color: '#666', fontSize: 14, fontWeight: '500' },
});

export default IcebreakerModal;