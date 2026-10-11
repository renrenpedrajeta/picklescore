'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { supabase } from '@/config/supabase';
import { CONTENT } from '../../config/content';

export function ConsoleHeader({
  onReset,
  center,
  onLogout,
  title = CONTENT.header.brandTitle,
  resetTooltip = CONTENT.header.resetTooltip,
}) {
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

  return (
    <header className="console-header">
      <div className="brand-wrapper">
        <div className="brand-squircle" />
        <h1 className="brand-title">{title}</h1>
      </div>

      <div className="header-center-slot">
        {center}
      </div>

      <div className="header-right-slot">
        {onReset && (
          <button
            onClick={onReset}
            title={resetTooltip}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <div className="status-circle" />
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          title="Sign out of Courtside"
          className="btn-header-logout"
          aria-label="Sign out"
        >
          <LogOut size={16} />
          <span>SIGN OUT</span>
        </button>
      </div>
    </header>
  );
}

export default ConsoleHeader;
