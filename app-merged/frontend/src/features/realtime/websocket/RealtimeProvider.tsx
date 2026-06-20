import React, { createContext, useContext, useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimeInvalidator } from '../invalidation/handlers';
import type { AppDomainEvent } from '../contracts/events';

// Make Pusher available globally for Laravel Echo
declare global {
  interface Window {
    Pusher?: typeof Pusher;
    Echo?: typeof Echo;
  }
}

window.Pusher = Pusher;

interface RealtimeContextValue {
  isConnected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echo: any;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  echo: null,
});

interface RealtimeProviderProps {
  children: React.ReactNode;
  userId?: string;
  enabled?: boolean;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ 
  children, 
  userId,
  enabled = true 
}) => {
  const [echo, setEcho] = useState<null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !userId) {
      if (echo) {
        echo.disconnect();
        setEcho(null);
        setIsConnected(false);
      }
      return;
    }

    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;
    const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER;
    
    // In a real app, this would use the real pusher credentials
    // We are simulating the connection logic for the architecture layer
    const echoInstance = new Echo({
      broadcaster: 'pusher',
      key: pusherKey || 'dummy-key',
      cluster: pusherCluster || 'mt1',
      forceTLS: true,
      // authEndpoint: '/api/broadcasting/auth', 
      // Add auth token if needed:
      // auth: { headers: { Authorization: `Bearer ${token}` } }
    });

    setEcho(echoInstance);

    const invalidator = new RealtimeInvalidator(queryClient);

    // Setup connection monitoring
    echoInstance.connector.pusher.connection.bind('connected', () => {
      setIsConnected(true);
      // Offline handling: invalidate all analytics when reconnecting to flush stale data
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    echoInstance.connector.pusher.connection.bind('disconnected', () => {
      setIsConnected(false);
    });

    // Centralized event routing (No component-level subscriptions)
    // We listen to a global or user-specific channel
    const channel = echoInstance.private(`user.${userId}`);

    channel.listen('.AppDomainEvent', (event: AppDomainEvent) => {
      // Pass to our centralized handler
      invalidator.handleEvent(event, userId);
    });

    return () => {
      channel.stopListening('.AppDomainEvent');
      echoInstance.disconnect();
      setEcho(null);
      setIsConnected(false);
    };
  }, [enabled, userId, queryClient]);

  return (
    <RealtimeContext.Provider value={{ isConnected, echo }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtimeConnection = () => useContext(RealtimeContext);
