'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/config/supabase';
export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('referee'); // 'referee' | 'player'
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      setIsSubmitting(false)
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      }
    });
    if (error) {
      alert(error.message)
      setIsSubmitting(false);
      return;
    }
    router.push('/auth/login');
  }


  /*const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsDemoSubmitting(true);
    setDemoNotice('Demo Mode: Creating official courtside profile...');

    // Since there is no backend yet, simulate smooth transition to login/app
    setTimeout(() => {
      setIsDemoSubmitting(false);
      router.push('/pikolscore');
    }, 900);
  }; */

  return (
    <div className="auth-card">
      {/* Navigation Tabs */}
      <div className="auth-nav-tabs">
        <Link href="/auth/login" className="auth-nav-tab">
          Sign In
        </Link>
        <Link href="/auth/signup" className="auth-nav-tab active">
          Create Account
        </Link>
      </div>

      {/* Card Header */}
      <div className="auth-card-header">
        <h1 className="auth-card-title">Join PikolScore</h1>
        <p className="auth-card-desc">
          Register your official profile to score and manage pickleball matches.
        </p>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSignup} className="auth-form">
        {/* Full Name */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-name">
            Official / Player Name
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <User size={18} />
            </span>
            <input
              id="signup-name"
              type="text"
              className="auth-input"
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-email">
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Mail size={18} />
            </span>
            <input
              id="signup-email"
              type="email"
              className="auth-input"
              placeholder="official@pikolscore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Role Toggle Selector */}
        <div className="auth-field">
          <label className="auth-label">Primary Role</label>
          <div className="auth-nav-tabs" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className={`auth-nav-tab ${role === 'referee' ? 'active' : ''}`}
              onClick={() => setRole('referee')}
            >
              🏸 Match Referee / Scorer
            </button>
            <button
              type="button"
              className={`auth-nav-tab ${role === 'player' ? 'active' : ''}`}
              onClick={() => setRole('player')}
            >
              👥 Club / Player
            </button>
          </div>
        </div>

        {/* Password Field */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-password">
            Password
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Lock size={18} />
            </span>
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input has-right-icon"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-confirm-password">
            Confirm Password
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Lock size={18} />
            </span>
            <input
              id="signup-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Agree Terms Checkbox */}
        <div className="auth-field" style={{ marginTop: 2 }}>
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
            />
            <span style={{ fontSize: 13 }}>
              I agree to fair play rules and{' '}
              <a
                href="#terms"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Courtside scoring policies and fair play rules.');
                }}
                className="auth-link"
              >
                Courtside Guidelines
              </a>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button type="submit" className="auth-submit-btn" disabled={isSubmitting}>
          <span>{isSubmitting ? 'Creating Profile...' : 'Complete Registration'}</span>
          <ArrowRight size={18} />
        </button>

        {/* Demo Notice Feedback */}
        {notice && (
          <div className="auth-notice-box">
            <span>{notice}</span>
          </div>
        )}
      </form>

      {/* Switch Prompt */}
      <div className="auth-footer-prompt">
        Already registered?{' '}
        <Link href="/auth/login" className="auth-link">
          Sign In
        </Link>
      </div>
    </div>
  );
}
