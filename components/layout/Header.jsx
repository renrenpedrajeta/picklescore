'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { supabase } from '@/config/supabase';

export function Header({ onOpenLog, profile, userEmail, onLogout }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error logging out:', err);
    }

    if (onLogout) {
      onLogout();
    } else {
      router.replace('/auth/login');
    }
  };

  const displayIdentity =
    profile?.full_name || profile?.username || userEmail || null;

  return (
    <header className="ps-header">
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
        <button type="button" className="ps-pill" onClick={onOpenLog}>
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
