import Link from 'next/link';
import { supabase } from '@/config/supabase';

export const metadata = {
  title: 'Authentication | PikolScore',
  description: 'Sign in or create an account for Courtside Precision scoring',
};



export default function AuthLayout({ children }) {
  return (
    <div className="auth-viewport">
      <div className="auth-container">
        {/* Top Brand Badge */}
        <Link href="/pikolscore" className="auth-brand-badge" style={{ textDecoration: 'none' }}>
          <span className="auth-brand-dot" />
          <span className="auth-brand-title">PIKOLSCORE</span>
          <span className="auth-brand-sub">COURTSIDE CONSOLE</span>
        </Link>

        {/* Auth Page Content */}
        {children}

        {/* Subtle Footer Meta */}
        <div className="auth-footer-copyright">
          POWERED BY WREN LABS · COURTSIDE SYSTEM
        </div>
      </div>
    </div>
  );
}
