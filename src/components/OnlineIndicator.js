// src/components/OnlineIndicator.js
import { StyleSheet, View } from 'react-native';

const OnlineIndicator = ({ lastActive }) => {
  if (!lastActive) return null;

  const lastActiveDate = new Date(lastActive);
  const now = new Date();
  const diffInMinutes = (now - lastActiveDate) / 1000 / 60;

  // If active within the last 5 minutes, show green dot
  const isOnline = diffInMinutes < 5;

  return (
    <View style={[styles.dot, { backgroundColor: isOnline ? '#10B981' : '#ccc' }]} />
  );
};

const styles = StyleSheet.create({
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
});

export default OnlineIndicator;