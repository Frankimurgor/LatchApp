// src/hooks/useOnlineStatus.js
import { useContext, useEffect } from 'react';
import { AppState } from 'react-native';
import { AuthContext } from '../services/AuthContext';
import { supabase } from '../services/supabase';

export const useOnlineStatus = () => {
  const { session } = useContext(AuthContext);

  useEffect(() => {
    if (!session?.user?.id) return;

    const updateStatus = async () => {
      await supabase
        .from('profiles')
        .update({ last_active: new Date().toISOString() })
        .eq('id', session.user.id);
    };

    // Update immediately on mount
    updateStatus();

    // Update when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        updateStatus();
      }
    });

    // Heartbeat: Update every 2 minutes while app is open
    const interval = setInterval(updateStatus, 120000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [session]);
};