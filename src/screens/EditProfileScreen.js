// src/screens/EditProfileScreen.js
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PromptEditor from '../components/PromptEditor';
import TagSelector from '../components/TagSelector';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';

const EditProfileScreen = ({ navigation }) => {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  
  // Prompts state: array of { prompt: string, answer: string }
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) throw error;

      setName(data.name || '');
      setAge(data.age ? data.age.toString() : '');
      setBio(data.bio || '');
      setImageUrl(data.image_url);
      setSelectedTags(data.tags || []);
      setPrompts(data.prompts || []);
    } catch (error) {
      Alert.alert('Error fetching profile', error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload a photo!');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (!result.canceled) uploadImage(result.assets[0].base64);
  };

  const uploadImage = async (base64File) => {
    setUploading(true);
    try {
      const fileName = `${session.user.id}-${Date.now()}.jpeg`;
      const arrayBuffer = decode(base64File);
      const { error } = await supabase.storage.from('avatars').upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setImageUrl(publicUrl);
      await supabase.from('profiles').update({ image_url: publicUrl }).eq('id', session.user.id);
    } catch (error) {
      Alert.alert('Error uploading image', error.message);
    } finally {
      setUploading(false);
    }
  };

  const decode = (base64) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes.buffer;
  };

  const handleTagToggle = (tagName) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(prev => prev.filter(t => t !== tagName));
    } else {
      if (selectedTags.length >= 4) { Alert.alert('Limit Reached', 'You can only select up to 4 tags.'); return; }
      setSelectedTags(prev => [...prev, tagName]);
    }
  };

  const handleAddPrompt = () => {
    if (prompts.length >= 3) { Alert.alert('Limit Reached', 'You can only have up to 3 prompts.'); return; }
    setPrompts(prev => [...prev, { prompt: '', answer: '' }]);
  };

  const handleUpdatePrompt = (index, updatedPrompt, updatedAnswer) => {
    setPrompts(prev => prev.map((p, i) => i === index ? { prompt: updatedPrompt, answer: updatedAnswer } : p));
  };

  const handleRemovePrompt = (index) => {
    setPrompts(prev => prev.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Name cannot be empty.'); return; }

    // Validate prompts
    const validPrompts = prompts.filter(p => p.prompt && p.answer.trim());

    setLoading(true);
    try {
      const updates = {
        id: session.user.id,
        name: name.trim(),
        age: parseInt(age) || null,
        bio: bio.trim(),
        image_url: imageUrl,
        tags: selectedTags,
        prompts: validPrompts,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error saving profile', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !uploading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color="#FF5A5F" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#2E1065" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.imageContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} disabled={uploading}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.avatar} /> : <View style={styles.placeholderAvatar}><Ionicons name="person" size={50} color="#ccc" /></View>}
          <View style={styles.cameraIcon}>{uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={20} color="#fff" />}</View>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />

        <Text style={styles.label}>Age</Text>
        <TextInput style={styles.input} value={age} onChangeText={setAge} placeholder="Enter your age" keyboardType="numeric" />

        <Text style={styles.label}>Short Bio</Text>
        <TextInput style={[styles.input, styles.textArea]} value={bio} onChangeText={setBio} placeholder="A quick intro..." multiline numberOfLines={3} />

        <TagSelector selectedTags={selectedTags} onTagToggle={handleTagToggle} />

        {/* Prompts Section */}
        <View style={styles.promptsSection}>
          <View style={styles.promptsHeader}>
            <Text style={styles.label}>Profile Prompts (Max 3)</Text>
            <TouchableOpacity onPress={handleAddPrompt} style={styles.addPromptButton}>
              <Ionicons name="add-circle" size={24} color="#FF5A5F" />
            </TouchableOpacity>
          </View>
          
          {prompts.map((p, index) => (
            <PromptEditor 
              key={index}
              prompt={p.prompt}
              answer={p.answer}
              onUpdate={(newPrompt, newAnswer) => handleUpdatePrompt(index, newPrompt, newAnswer)}
              onRemove={() => handleRemovePrompt(index)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={loading}>
          <Text style={styles.saveButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, paddingTop: 50, backgroundColor: '#fff' },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2E1065' },
  imageContainer: { alignItems: 'center', marginTop: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#fff' },
  placeholderAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF5A5F', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#2E1065', marginBottom: 5, marginLeft: 5 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: '#eee' },
  textArea: { height: 80, textAlignVertical: 'top' },
  promptsSection: { marginTop: 10, marginBottom: 15 },
  promptsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addPromptButton: { padding: 5 },
  saveButton: { backgroundColor: '#FF5A5F', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

export default EditProfileScreen;s