'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/config/supabase';
import { AUTH_CONTENT } from '@/config/content/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatAuthError(error, fallbackAction = 'Check your details and try again.') {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return "Email or password didn't match an account. Check both fields and try again, or select Forgot password? to reset it.";
  }
  if (msg.includes('email not confirmed')) {
    return "Your email address isn't verified yet. Open the confirmation link in your inbox, then sign in again.";
  }
  if (msg.includes('user already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Switch to Sign In or reset your password.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts in a short time. Wait a minute and try again.';
  }
  if (error?.message) {
    return `${error.message}. ${fallbackAction}`;
  }
  return `Authentication couldn't be completed. ${fallbackAction}`;
}

export function LoginForm({ initialMode = 'signin' }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const isSignUp = mode === 'signup';
  const copy = isSignUp ? AUTH_CONTENT.signUp : AUTH_CONTENT.signIn;
  const { fields } = AUTH_CONTENT;

  const clearFeedback = () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setStatusMessage('');
  };

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    clearFeedback();
    setMode(nextMode);
  };

  const handleOAuth = async (provider) => {
    clearFeedback();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/pikolscore`,
        },
      });
      if (error) {
        setPasswordError(
          formatAuthError(error, 'Try another sign-in method or use your email and password.')
        );
        setIsLoading(false);
      }
    } catch (err) {
      setPasswordError(
        formatAuthError(err, 'Check your internet connection and try again.')
      );
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearFeedback();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Enter your email address first, then select Forgot password? to receive a reset link.');
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError('That email address is incomplete. Enter a valid address like you@email.com.');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        setEmailError(
          formatAuthError(error, 'Verify the email address on your account and try again.')
        );
        return;
      }
      setStatusMessage(`Password reset link sent to ${trimmedEmail}. Check your inbox to set a new password.`);
    } catch (err) {
      setEmailError(
        formatAuthError(err, 'Check your internet connection and try again.')
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    let hasError = false;

    if (isSignUp && !trimmedName) {
      setNameError('Name is required. Enter your official or player name.');
      hasError = true;
    }

    if (!trimmedEmail) {
      setEmailError('Email is required. Enter the email address for your account.');
      hasError = true;
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      setEmailError('That email address is incomplete. Enter a valid address like you@email.com.');
      hasError = true;
    }

    if (!password) {
      setPasswordError(
        isSignUp
          ? 'Password is required. Enter at least 6 characters.'
          : 'Password is required. Enter your password or select Forgot password? to reset it.'
      );
      hasError = true;
    } else if (isSignUp && password.length < 6) {
      setPasswordError('Password is too short. Use at least 6 characters.');
      hasError = true;
    }

    if (isSignUp) {
      if (!confirmPassword) {
        setConfirmPasswordError('Confirm your password by re-entering it above.');
        hasError = true;
      } else if (password && confirmPassword !== password) {
        setConfirmPasswordError("Passwords don't match. Make sure both password fields are identical.");
        hasError = true;
      }
    }

    if (hasError) return;

    setIsLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: trimmedName,
            },
          },
        });

        if (error) {
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('already') || msg.includes('email')) {
            setEmailError(formatAuthError(error));
          } else {
            setPasswordError(formatAuthError(error));
          }
          setIsLoading(false);
          return;
        }

        if (data?.session) {
          router.push('/pikolscore');
          return;
        }

        setIsLoading(false);
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
        setStatusMessage('Account created! Check your email if confirmation is required, then sign in.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setPasswordError(formatAuthError(error));
        setIsLoading(false);
        return;
      }

      router.push('/pikolscore');
    } catch (err) {
      setPasswordError(
        formatAuthError(err, 'Check your internet connection and try again.')
      );
      setIsLoading(false);
    }
  };

  return (
    <section className="relative flex flex-col items-center bg-pale-sage px-8 pt-10 pb-10">
      <Link
        href="/"
        aria-label="PikolScore home"
        className="mb-6 ml-6 flex items-center gap-3 self-start text-[26px] font-bold tracking-[-0.01em] text-dark-teal no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="12" fill="#0F5C62" />
          <circle cx="20" cy="20" r="10" fill="#FEECD6" />
          <circle cx="16.5" cy="16.5" r="1.6" fill="#084B46" />
          <circle cx="23.5" cy="19" r="1.6" fill="#084B46" />
          <circle cx="19" cy="24" r="1.6" fill="#084B46" />
        </svg>
        {AUTH_CONTENT.brand}
      </Link>

      <form
        action="#"
        noValidate
        onSubmit={handleSubmit}
        className="my-auto flex w-full max-w-[400px] flex-col py-4"
      >
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="mb-6 grid h-11 grid-cols-2 gap-1 rounded-full bg-off-white border-[1.5px] border-line p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            onClick={() => switchMode('signin')}
            disabled={isLoading}
            className={`flex items-center justify-center rounded-full border-0 text-[15px] font-semibold transition-colors cursor-pointer disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-teal ${
              !isSignUp ? 'bg-teal text-off-white' : 'bg-transparent text-deep-green hover:bg-pale-sage'
            }`}
          >
            {AUTH_CONTENT.tabs.signIn}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            onClick={() => switchMode('signup')}
            disabled={isLoading}
            className={`flex items-center justify-center rounded-full border-0 text-[15px] font-semibold transition-colors cursor-pointer disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-teal ${
              isSignUp ? 'bg-teal text-off-white' : 'bg-transparent text-deep-green hover:bg-pale-sage'
            }`}
          >
            {AUTH_CONTENT.tabs.signUp}
          </button>
        </div>

        <h1 className="m-0 text-center text-[40px] leading-[48px] font-bold tracking-[-0.02em] text-dark-teal">
          {copy.heading}
        </h1>
        <p className="mt-2 mb-6 text-center text-[16px] leading-[24px] text-deep-green">
          {copy.subtitle}
        </p>

        <div className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <label htmlFor="full-name" className="text-[14px] font-semibold text-dark-teal">
                {fields.fullName.label} <span className="text-teal" aria-hidden="true">*</span>
              </label>
              <div className="flex h-[52px] items-center gap-3 rounded-full bg-off-white border-[1.5px] border-line px-5 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal">
                <svg
                  className="shrink-0"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#084B46"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c1.8-3.6 5-5.5 8-5.5s6.2 1.9 8 5.5" />
                </svg>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder={fields.fullName.placeholder}
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? 'name-error' : undefined}
                  className="min-w-0 flex-1 border-0 bg-transparent text-[16px] font-medium text-dark-teal placeholder:text-muted outline-none"
                />
              </div>
              {nameError && (
                <p id="name-error" role="alert" className="m-0 text-sm text-error">
                  {nameError}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[14px] font-semibold text-dark-teal">
              {fields.email.label} <span className="text-teal" aria-hidden="true">*</span>
            </label>
            <div className="flex h-[52px] items-center gap-3 rounded-full bg-off-white border-[1.5px] border-line px-5 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal">
              <svg
                className="shrink-0"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#084B46"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={fields.email.placeholder}
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                  if (statusMessage) setStatusMessage('');
                }}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent text-[16px] font-medium text-dark-teal placeholder:text-muted outline-none"
              />
            </div>
            {emailError && (
              <p id="email-error" role="alert" className="m-0 text-sm text-error">
                {emailError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className="text-[14px] font-semibold text-dark-teal">
                {fields.password.label} <span className="text-teal" aria-hidden="true">*</span>
              </label>
              {!isSignUp && (
                <a
                  href="#forgot"
                  onClick={handleForgotPassword}
                  className="text-[14px] font-semibold text-teal no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                >
                  {AUTH_CONTENT.signIn.forgotPassword}
                </a>
              )}
            </div>
            <div className="flex h-[52px] items-center gap-3 rounded-full bg-off-white border-[1.5px] border-line px-5 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal">
              <svg
                className="shrink-0"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#084B46"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="9" rx="2.5" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder={
                  isSignUp ? fields.password.signUpPlaceholder : fields.password.signInPlaceholder
                }
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent text-[16px] font-medium text-dark-teal placeholder:text-muted outline-none"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
                className="flex border-0 bg-transparent p-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
              >
                <svg
                  className="shrink-0"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#084B46"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            {passwordError && (
              <p id="password-error" role="alert" className="m-0 text-sm text-error">
                {passwordError}
              </p>
            )}
          </div>

          {isSignUp && (
            <div className="flex flex-col gap-2">
              <label htmlFor="confirm-password" className="text-[14px] font-semibold text-dark-teal">
                {fields.confirmPassword.label} <span className="text-teal" aria-hidden="true">*</span>
              </label>
              <div className="flex h-[52px] items-center gap-3 rounded-full bg-off-white border-[1.5px] border-line px-5 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal">
                <svg
                  className="shrink-0"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#084B46"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="5" y="11" width="14" height="9" rx="2.5" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={fields.confirmPassword.placeholder}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                  className="min-w-0 flex-1 border-0 bg-transparent text-[16px] font-medium text-dark-teal placeholder:text-muted outline-none"
                />
              </div>
              {confirmPasswordError && (
                <p id="confirm-password-error" role="alert" className="m-0 text-sm text-error">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          )}
        </div>

        {statusMessage && (
          <p role="status" className="mt-4 text-center text-[15px] text-deep-green">
            {statusMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex h-[56px] items-center justify-center gap-3 rounded-full border-0 bg-teal text-[17px] font-semibold text-cream shadow-[0_10px_24px_-10px_rgba(15,92,98,0.5)] transition-colors hover:bg-forest-teal active:translate-y-[2px] cursor-pointer disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
        >
          {isLoading ? copy.submitting : copy.submit}
        </button>

        <div className="my-5 flex items-center gap-4 text-xs font-semibold tracking-wider text-muted">
          <span className="h-px flex-1 bg-line" />
          {AUTH_CONTENT.divider}
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={isLoading}
            className="flex h-[52px] items-center justify-center gap-3 rounded-full border-[1.5px] border-line bg-off-white text-[16px] font-semibold text-deep-green transition-colors hover:bg-pale-sage cursor-pointer disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.33A9 9 0 0 0 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.96 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3-2.33z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
              />
            </svg>
            {copy.googleButton}
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={isLoading}
            className="flex h-[52px] items-center justify-center gap-3 rounded-full border-[1.5px] border-line bg-off-white text-[16px] font-semibold text-deep-green transition-colors hover:bg-pale-sage cursor-pointer disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#084B46" aria-hidden="true">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
            </svg>
            {copy.appleButton}
          </button>
        </div>

        <p className="mt-6 text-center text-[15px] text-deep-green">
          {copy.footerPrompt}
          <Link
            href={isSignUp ? '/auth/login' : '/auth/signup'}
            onClick={(e) => {
              e.preventDefault();
              switchMode(isSignUp ? 'signin' : 'signup');
            }}
            className="font-semibold text-teal no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
          >
            {copy.footerLink}
          </Link>
        </p>
      </form>
    </section>
  );
}

export default LoginForm;
