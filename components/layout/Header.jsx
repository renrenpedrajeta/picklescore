'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { supabase } from '@/config/supabase';
import {
  saveAccountForQuickSwitch,
  detachActiveSupabaseSession,
} from '@/lib/auth-session';

export function Header({ onOpenLog, profile, userEmail, onLogout, isGuest = false, ...rest }) {
  const router = useRouter();

  // 1. Cross-Tab Logout Synchronization Listener
  useEffect(() => {
    const handleCrossTabLogout = (event) => {
      const isSupabaseToken =
        event.key?.startsWith('sb-') && event.key?.endsWith('-auth-token');

      if (isSupabaseToken && event.newValue === null) {
        window.location.replace('/auth/login');
      }
    };

    window.addEventListener('storage', handleCrossTabLogout);
    return () => window.removeEventListener('storage', handleCrossTabLogout);
  }, []);

  const isGuestSpectator =
    Boolean(isGuest) ||
    (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('demo') === '1');

  // 2. Soft Logout + In-Memory Purge & Hard Redirect
  const handleLogout = async () => {
    // 1. Early Return for Guest Spectators (?demo=1 or isGuest)
    if (isGuestSpectator) {
      if (typeof onLogout === 'function') {
        try {
          onLogout();
        } catch (e) {
          console.error('onLogout callback error:', e);
        }
      }
      window.location.replace('/auth/login');
      return;
    }

    // 2. Standard Soft Logout for Authenticated Umpires (NOT ?demo=1)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Stamp latest activity on public.profiles before detaching
        await supabase
          .from('profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', session.user.id);

        // Save session credentials to pikol_saved_accounts (max 5 MRU)
        saveAccountForQuickSwitch(session, profile?.full_name);
      }
    } catch (err) {
      console.error('Soft logout preparation warning:', err);
    } finally {
      if (typeof onLogout === 'function') {
        try {
          onLogout();
        } catch (e) {
          console.error('onLogout callback error:', e);
        }
      }
      // Remove active sb-<project>-auth-token from localStorage
      detachActiveSupabaseSession();
      // Hard redirect to wipe in-memory Supabase client state
      window.location.replace('/auth/login');
    }
  };

  const displayIdentity =
    profile?.full_name || profile?.username || userEmail || (isGuestSpectator ? 'Guest Spectator' : null);

  return (
    <header className="ps-header" {...rest}>
      <div className="ps-logo">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="12" fill="#0F5C62" />
          <circle cx="20" cy="20" r="10" fill="#FEECD6" />
          <circle cx="16.5" cy="16.5" r="1.6" fill="#203F39" />
          <circle cx="23.5" cy="19" r="1.6" fill="#203F39" />
          <circle cx="19" cy="24" r="1.6" fill="#203F39" />
        </svg>
        <span>PIKOLSCORE</span>
      </div>

      <div className="ps-header-actions">
        <button
          type="button"
          className={`ps-pill ${isGuestSpectator ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          onClick={isGuestSpectator ? undefined : onOpenLog}
          disabled={isGuestSpectator}
          title={isGuestSpectator ? 'Match log disabled in spectator mode' : undefined}
          aria-disabled={isGuestSpectator}
        >
          Match log
        </button>

        {displayIdentity && (
          <div className="ps-profile-badge" title={displayIdentity}>
            <User size={14} aria-hidden="true" />
            <span>{displayIdentity}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title="Sign out of Courtside"
          className="ps-pill ps-pill-logout"
          aria-label="Sign out"
        >
          <LogOut size={15} aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
