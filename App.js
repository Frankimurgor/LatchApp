// App.js
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useOnlineStatus } from './src/hooks/useOnlineStatus';
import { AuthContext } from './src/services/AuthContext';
import { FilterProvider } from './src/services/FilterContext';
import { UnreadContext, UnreadProvider } from './src/services/UnreadContext';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { supabase } from './src/services/supabase';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import ChatScreen from './src/screens/ChatScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import HomeScreen from './src/screens/HomeScreen';
import LikesScreen from './src/screens/LikesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import VerificationScreen from './src/screens/VerificationScreen';
import ViewersScreen from './src/screens/ViewersScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ChatStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Viewers" component={ViewersScreen} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
    </Stack.Navigator>
  );
}

function MainApp() {
  useOnlineStatus();
  const { unreadCount } = useContext(UnreadContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF5A5F',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 10, paddingTop: 10, height: 70 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'flame' : 'flame-outline';
          else if (route.name === 'Likes') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Explore') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          
          if (route.name === 'Chat' && unreadCount > 0) {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              </View>
            );
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen name="Chat" component={ChatStack} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

const styles = {
  badge: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: '#FF5A5F',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) registerForPushNotificationsAsync(session.user.id);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) registerForPushNotificationsAsync(session.user.id);
    });
  }, []);

  if (loading) return null;
  if (!session) return <AuthScreen />;

  return (
    <AuthContext.Provider value={{ session }}>
      <UnreadProvider>
        <FilterProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <MainApp />
          </NavigationContainer>
        </FilterProvider>
      </UnreadProvider>
    </AuthContext.Provider>
  );
}