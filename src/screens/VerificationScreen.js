// src/screens/VerificationScreen.js
import { Camera, CameraType } from 'expo-camera';
import React, { useContext, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';

const VerificationScreen = ({ navigation }) => {
  const { session } = useContext(AuthContext);
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(CameraType.front); // Selfie camera
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true };
      const data = await cameraRef.current.takePictureAsync(options);
      setPhoto(data.base64);
    }
  };

  const submitVerification = async () => {
    if (!photo) return;
    setLoading(true);
    
    try {
      const fileName = `verify-${session.user.id}-${Date.now()}.jpeg`;
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(photo);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // 1. Upload the selfie to a 'verifications' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars') // using the same bucket for simplicity
        .upload(fileName, bytes.buffer, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // 2. Update profile to verified (In production, this would go to an admin for review)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      Alert.alert("Verified! ✅", "Your profile now has a blue checkmark.", [
        { text: "Great!", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera. Please enable it in settings.</Text></View>;
  }

  // Preview Screen
  if (photo) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: `data:image/jpeg;base64,${photo}` }} style={styles.preview} />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={() => setPhoto(null)}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={submitVerification} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Verification</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera Screen
  return (
    <View style={styles.container}>
      <Camera style={styles.camera} type={type} ref={cameraRef}>
        <View style={styles.overlay}>
          <Text style={styles.instructionText}>Pose: Hold up a ✌️ (Peace Sign)</Text>
          <Text style={styles.subtitle}>Make sure your face is clearly visible.</Text>
        </View>
        
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  overlay: { paddingTop: 60, paddingHorizontal: 20, alignItems: 'center' },
  instructionText: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#eee', textAlign: 'center', marginTop: 10 },
  cameraControls: { paddingBottom: 50, alignItems: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
  preview: { flex: 1, resizeMode: 'cover' },
  previewActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 30, backgroundColor: '#fff' },
  retakeButton: { backgroundColor: '#ccc', padding: 15, borderRadius: 10, width: '40%', alignItems: 'center' },
  submitButton: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, width: '50%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default VerificationScreen;