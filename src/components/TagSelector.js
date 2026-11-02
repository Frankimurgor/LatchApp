// src/components/TagSelector.js
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AVAILABLE_TAGS = [
  { name: 'Free Tonight', icon: 'moon', color: '#4A90E2' },
  { name: 'Animal Parents', icon: 'paw', color: '#50E3C2' },
  { name: 'Dating to get Married', icon: 'diamond', color: '#FF5A5F' },
  { name: 'Like Sports', icon: 'football', color: '#F5A623' },
  { name: 'Looking for Hookup', icon: 'heart', color: '#D0021B' },
  { name: 'Looking to Settle down', icon: 'home', color: '#8B572A' },
  { name: 'Foodie', icon: 'restaurant', color: '#9B59B6' },
  { name: 'Nature Lovers', icon: 'leaf', color: '#2ECC71' },
];

const TagSelector = ({ selectedTags, onTagToggle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Vibe (Select up to 4)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag.name);
          return (
            <TouchableOpacity
              key={tag.name}
              style={[
                styles.tagChip,
                isSelected && { backgroundColor: tag.color, borderColor: tag.color }
              ]}
              onPress={() => onTagToggle(tag.name)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={tag.icon} 
                size={16} 
                color={isSelected ? '#fff' : tag.color} 
              />
              <Text style={[
                styles.tagText,
                isSelected && { color: '#fff' }
              ]}>
                {tag.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#2E1065', marginBottom: 10, marginLeft: 5 },
  scrollContainer: { paddingHorizontal: 5, paddingBottom: 5 },
  tagChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 10, 
    borderWidth: 1, 
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  tagText: { fontSize: 13, fontWeight: '600', color: '#666', marginLeft: 6 },
});

export default TagSelector;