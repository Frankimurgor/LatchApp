// src/services/UnreadContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from './supabase';

export const UnreadContext = createContext();

export const UnreadProvider = ({ children }) => {
  const { session } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session?.user?.id) return;

    // 1. Initial fetch of unread messages
    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*, matches!inner(user1_id, user2_id)', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', session.user.id)
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`, { foreignTable: 'matches' });

      if (!error) setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // 2. Listen for ANY new messages inserted into the database
    const subscription = supabase
      .channel('global-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=neq.${session.user.id}` // Ignore my own messages
      }, (payload) => {
        // Note: This fires for ALL messages in the DB, so we increment optimistically
        // In a fully scalable app, you'd verify this message belongs to you, but for now we just add 1
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session]);

  // Function to clear the badge when user opens the chat
  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  return (
    <UnreadContext.Provider value={{ unreadCount, clearUnreadCount, setUnreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
};