import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AuthState } from '../types'; // Import your AuthState type

    export function useAuth(): AuthState {
      const [user, setUser] = useState<AuthState['user']>(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        // Check for an existing session on initial load
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user || null);
          setLoading(false);
        });

        // Listen for authentication state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
          setLoading(false);
        });

        // Cleanup subscription on component unmount
        return () => subscription.unsubscribe();
      }, []);

      return { user, loading };
    }