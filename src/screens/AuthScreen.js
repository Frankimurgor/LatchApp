// src/screens/AuthScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../services/supabase';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(true);

  async function handleAuth() {
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) Alert.alert('Error', error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Error', error.message);
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Ionicons name="lock-closed" size={60} color="#FF5A5F" />
        <Text style={styles.logoText}>Latch</Text>
        <Text style={styles.subtitle}>Real people. Real connections.</Text>
      </View>

      <View style={styles.formContainer}>
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 36, fontWeight: 'bold', color: '#2E1065', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  formContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  input: { backgroundColor: '#F5F5F5', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#FF5A5F', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  toggleContainer: { marginTop: 20, alignItems: 'center' },
  toggleText: { color: '#4A90E2', fontSize: 14, fontWeight: '500' },
});

export default AuthScreen;