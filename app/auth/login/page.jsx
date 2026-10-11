'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase } from '@/config/supabase';
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [setLoading, setIsLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState('');


  const handleSignin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    let { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,

    })

    if (error) {
      alert(error.message);
      setIsLoading(false);
      return;
    }

    router.push('/pikolscore');
  }
  /* const handleSubmit = async(e) => {
   e.preventDefault();
   setIsDemoSubmitting(true);
   setDemoNotice('Demo Mode: Authenticating courtside credentials...');
   const {data, error} = await supabase.auth.signInWithPassword({
     email: email,
     password: password,
   }) 
   
   if(error){
     setDemoNotice(error.message);
     setIsDemoSubmitting(false);
     return;
   }
   
   //router.push('/pikolscore');

   // Since there is no backend yet, simulate smooth transition to app
   setTimeout(() => {
     setIsDemoSubmitting(false);
     router.push('/pikolscore');
   }, 900);
 }; */

  return (
    <div className="auth-card">
      {/* Navigation Tabs */}
      <div className="auth-nav-tabs">
        <Link href="/auth/login" className="auth-nav-tab active">
          Sign In
        </Link>
        <Link href="/auth/signup" className="auth-nav-tab">
          Create Account
        </Link>
      </div>

      {/* Card Header */}
      <div className="auth-card-header">
        <h1 className="auth-card-title">Referee Sign In</h1>
        <p className="auth-card-desc">
          Enter your credentials to unlock the courtside scoring console.
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSignin} className="auth-form">
        {/* Email Field */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-email">
            Email Address
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Mail size={18} />
            </span>
            <input
              id="login-email"
              type="email"
              className="auth-input"
              placeholder="referee@pikolscore.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="login-password">
            Password
          </label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">
              <Lock size={18} />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input has-right-icon"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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

        {/* Remember & Forgot Row */}
        <div className="auth-row-options">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              className="auth-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember session</span>
          </label>
          <a
            href="#forgot"
            onClick={(e) => {
              e.preventDefault();
              alert('Password reset will be configured with Supabase Auth.');
            }}
            className="auth-link"
          >
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <button type="submit" className="auth-submit-btn" disabled={setLoading}>
          <span>{setLoading ? 'Entering Courtside...' : 'Sign In to Courtside'}</span>
          <ArrowRight size={18} />
        </button>

        {/* Demo Notice Feedback */}
        {demoNotice && (
          <div className="auth-notice-box">
            <span>{demoNotice}</span>
          </div>
        )}
      </form>

      {/* Switch Prompt */}
      <div className="auth-footer-prompt">
        Don&apos;t have an account yet?{' '}
        <Link href="/auth/signup" className="auth-link">
          Create Account
        </Link>
      </div>
    </div>
  );
}
