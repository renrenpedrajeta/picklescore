export const AUTH_CONTENT = {
  brand: 'PikolScore',

  tabs: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
  },

  signIn: {
    heading: 'Sign In',
    subtitle: 'Welcome back! Please enter your details to continue',
    forgotPassword: 'Forgot password?',
    submit: 'Sign in',
    submitting: 'Signing in...',
    googleButton: 'Sign in with Google',
    appleButton: 'Sign in with Apple',
    footerPrompt: "Don't have an account? ",
    footerLink: 'Sign Up',
  },

  signUp: {
    heading: 'Sign Up',
    subtitle: 'Register to score and manage matches',
    submit: 'Sign up',
    submitting: 'Creating account...',
    googleButton: 'Sign up with Google',
    appleButton: 'Sign up with Apple',
    footerPrompt: 'Already have an account? ',
    footerLink: 'Sign In',
  },

  fields: {
    fullName: {
      label: 'Official / Player Name',
      placeholder: 'e.g. Alex Morgan',
    },
    email: {
      label: 'Email',
      placeholder: 'you@email.com',
    },
    password: {
      label: 'Password',
      signInPlaceholder: 'Enter password',
      signUpPlaceholder: 'At least 6 characters',
    },
    confirmPassword: {
      label: 'Confirm Password',
      placeholder: 'Re-enter your password',
    },
  },

  divider: 'or continue with',

  courtPanel: {
    quote:
      'Every point called right. Scores update the moment the rally ends, and the whole court can see it.',
    attribution: 'League night umpire, Quezon City',
  },
};

export default AUTH_CONTENT;
