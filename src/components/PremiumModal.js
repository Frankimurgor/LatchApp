// src/components/PremiumModal.js
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PremiumModal = ({ visible, onClose, onUpgrade, loading, title = "Latch Premium", subtitle = "Unlock your full potential and find real connections faster." }) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="diamond" size={50} color="#FFD700" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="infinite" size={24} color="#2E1065" />
              <Text style={styles.featureText}>Unlimited Swipes</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="eye" size={24} color="#2E1065" />
              <Text style={styles.featureText}>See Who Likes You</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="refresh" size={24} color="#2E1065" />
              <Text style={styles.featureText}>Rewind Last Swipe</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade} disabled={loading}>
            {loading ? <ActivityIndicator color="#2E1065" /> : <Text style={styles.upgradeButtonText}>Upgrade for KES 499/mo</Text>}
          </TouchableOpacity>
          
          <Text style={styles.termsText}>One-time payment. Cancel anytime.</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 25, padding: 25, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  closeButton: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF9E6', justifyContent: 'center', alignItems: 'center', marginBottom: 15, marginTop: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2E1065', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 25, lineHeight: 22 },
  featuresList: { width: '100%', marginBottom: 25 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10 },
  featureText: { fontSize: 16, fontWeight: '500', color: '#333', marginLeft: 15 },
  upgradeButton: { backgroundColor: '#FFD700', width: '100%', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  upgradeButtonText: { color: '#2E1065', fontWeight: 'bold', fontSize: 18 },
  termsText: { fontSize: 12, color: '#999', textAlign: 'center' },
});

export default PremiumModal;