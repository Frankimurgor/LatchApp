// src/components/PromptEditor.js
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PROMPT_OPTIONS } from '../data/prompts';

const PromptEditor = ({ prompt, answer, onUpdate, onRemove }) => {
  const [isPickerVisible, setPickerVisible] = useState(false);

  const handleSelectPrompt = (selectedPrompt) => {
    onUpdate(selectedPrompt, answer);
    setPickerVisible(false);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.promptSelector} onPress={() => setPickerVisible(true)}>
        <Text style={styles.promptText}>{prompt || 'Select a prompt...'}</Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <TextInput
        style={styles.answerInput}
        placeholder="Type your answer here..."
        value={answer}
        onChangeText={(text) => onUpdate(prompt, text)}
        multiline
        maxLength={150}
      />

      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <Ionicons name="trash-outline" size={20} color="#FF5A5F" />
      </TouchableOpacity>

      {/* Prompt Picker Modal */}
      <Modal visible={isPickerVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a Prompt</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={PROMPT_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.promptOption} onPress={() => handleSelectPrompt(item)}>
                  <Text style={styles.promptOptionText}>{item}</Text>
                  {prompt === item && <Ionicons name="checkmark" size={20} color="#10B981" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee', position: 'relative' },
  promptSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
  promptText: { fontSize: 16, fontWeight: 'bold', color: '#2E1065', flex: 1 },
  answerInput: { fontSize: 15, color: '#333', minHeight: 60, textAlignVertical: 'top' },
  removeButton: { position: 'absolute', top: 10, right: 45, padding: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2E1065' },
  promptOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  promptOptionText: { fontSize: 16, color: '#333', flex: 1 },
});

export default PromptEditor;s