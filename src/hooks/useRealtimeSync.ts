import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useRealtimeSync = (callback: () => void, channelName: string = 'global-sync') => {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        if (savedCallback.current) {
          savedCallback.current();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName]);
};