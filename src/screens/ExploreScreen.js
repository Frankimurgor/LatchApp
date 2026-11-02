// src/screens/ExploreScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FilterContext } from '../services/FilterContext';

const CATEGORIES = [
  { id: '1', name: 'Free Tonight', icon: 'moon', color: '#4A90E2' },
  { id: '2', name: 'Animal Parents', icon: 'paw', color: '#50E3C2' },
  { id: '3', name: 'Dating to get Married', icon: 'diamond', color: '#FF5A5F' },
  { id: '4', name: 'Like Sports', icon: 'football', color: '#F5A623' },
  { id: '5', name: 'Looking for Hookup', icon: 'heart', color: '#D0021B' },
  { id: '6', name: 'Looking to Settle down', icon: 'home', color: '#8B572A' },
  { id: '7', name: 'Foodie', icon: 'restaurant', color: '#9B59B6' },
  { id: '8', name: 'Nature Lovers', icon: 'leaf', color: '#2ECC71' },
];

const ExploreScreen = ({ navigation }) => {
  const { activeFilter, setActiveFilter } = useContext(FilterContext);

  const handleSelectCategory = (categoryName) => {
    if (activeFilter === categoryName) {
      // If tapping the same one, clear the filter
      setActiveFilter(null);
      Alert.alert('Filter Cleared', 'Showing all profiles again.');
    } else {
      setActiveFilter(categoryName);
      Alert.alert('Filter Applied', `Showing people interested in: ${categoryName}`);
    }
    // Jump back to the Home screen to swipe
    navigation.navigate('Home');
  };

  const renderItem = ({ item }) => {
    const isActive = activeFilter === item.name;
    return (
      <TouchableOpacity 
        style={[styles.card, isActive && { borderColor: item.color, borderWidth: 2 }]} 
        onPress={() => handleSelectCategory(item.name)}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={40} color={item.color} />
        </View>
        <Text style={styles.cardText}>{item.name}</Text>
        {isActive && (
          <View style={[styles.activeBadge, { backgroundColor: item.color }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>
          {activeFilter ? `Filtering by: ${activeFilter}` : 'Find someone based on your vibe'}
        </Text>
      </View>
      <FlatList
        data={CATEGORIES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.columnWrapper}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2E1065' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 5 },
  listContainer: { padding: 15 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 15 },
  card: { width: '48%', aspectRatio: 1, backgroundColor: '#fff', borderRadius: 15, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, position: 'relative' },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardText: { fontSize: 14, fontWeight: '600', color: '#2E1065', textAlign: 'center', paddingHorizontal: 10 },
  activeBadge: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});

export default ExploreScreen;