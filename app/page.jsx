'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/config/supabase';
import AuthLoadingSplash from '@/components/auth/AuthLoadingSplash';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuthAndRedirect() {
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const params = new URLSearchParams(search);

      // Preserve guest demo mode access
      if (params.get('demo') === '1') {
        router.replace(`/pikolscore${search}`);
        return;
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          router.replace(`/pikolscore${search}`);
        } else {
          router.replace(`/auth/login${search}`);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error resolving root session:', err);
        router.replace(`/auth/login${search}`);
      }
    }

    checkAuthAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return <AuthLoadingSplash label="Connecting to courtside..." />;
}
