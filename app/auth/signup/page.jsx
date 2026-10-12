import AuthShell from '@/components/auth/AuthShell';

export const metadata = {
  title: 'PikolScore – Sign up',
};

export default function AuthSignupPage() {
  return <AuthShell initialMode="signup" />;
}
