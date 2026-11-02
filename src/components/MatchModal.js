// src/components/MatchModal.js
import { Ionicons } from '@expo/vector-icons';
import { useContext, useEffect, useRef } from 'react';
import { Dimensions, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AuthContext } from '../services/AuthContext';

const { width } = Dimensions.get('window');

const MatchModal = ({ visible, onClose, onSendMessage, matchedProfile, myProfileImage }) => {
  const { session } = useContext(AuthContext);
  const confettiRef = useRef(null);

  useEffect(() => {
    if (visible && confettiRef.current) {
      confettiRef.current.start();
    }
  }, [visible]);

  if (!matchedProfile) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        {/* Confetti Cannon */}
        <ConfettiCannon
          ref={confettiRef}
          count={150}
          origin={{ x: width / 2, y: -20 }}
          autoStart={false}
          fadeOut={true}
          colors={['#FF5A5F', '#FFD700', '#2E1065', '#10B981']}
        />

        <View style={styles.content}>
          <Text style={styles.title}>It's a Match!</Text>
          <Text style={styles.subtitle}>
            You and {matchedProfile.name} have liked each other.
          </Text>

          <View style={styles.imagesContainer}>
            {/* My Image */}
            <View style={[styles.imageWrapper, { transform: [{ rotate: '-10deg' }] }]}>
              {myProfileImage ? (
                <Image source={{ uri: myProfileImage }} style={styles.image} />
              ) : (
                <View style={styles.placeholderImage}><Ionicons name="person" size={40} color="#fff" /></View>
              )}
            </View>

            {/* Heart Icon */}
            <View style={styles.heartIconContainer}>
              <Ionicons name="heart" size={40} color="#FF5A5F" />
            </View>

            {/* Their Image */}
            <View style={[styles.imageWrapper, { transform: [{ rotate: '10deg' }] }]}>
              <Image source={{ uri: matchedProfile.image_url }} style={styles.image} />
            </View>
          </View>

          <TouchableOpacity style={styles.messageButton} onPress={onSendMessage}>
            <Ionicons name="chatbubble" size={20} color="#fff" />
            <Text style={styles.messageButtonText}>Send a Message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.keepSwipingButton} onPress={onClose}>
            <Text style={styles.keepSwipingText}>Keep Swiping</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(46, 16, 101, 0.95)', justifyContent: 'center', alignItems: 'center' },
  content: { width: '90%', alignItems: 'center' },
  title: { fontSize: 48, fontWeight: 'bold', color: '#FFD700', fontStyle: 'italic', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5, marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#fff', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  imagesContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 50, width: '100%' },
  imageWrapper: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, borderColor: '#fff', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, backgroundColor: '#ccc' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholderImage: { width: '100%', height: '100%', backgroundColor: '#2E1065', justifyContent: 'center', alignItems: 'center' },
  heartIconContainer: { position: 'absolute', zIndex: 10, backgroundColor: '#fff', padding: 10, borderRadius: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
  messageButton: { flexDirection: 'row', backgroundColor: '#FF5A5F', width: '100%', padding: 18, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  messageButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginLeft: 10 },
  keepSwipingButton: { padding: 10 },
  keepSwipingText: { color: '#fff', fontSize: 16, fontWeight: '500', opacity: 0.8 },
});

export default MatchModal;