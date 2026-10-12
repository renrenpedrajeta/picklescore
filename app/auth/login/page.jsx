import AuthShell from '@/components/auth/AuthShell';

export const metadata = {
  title: 'PikolScore – Sign in',
};

export default function AuthLoginPage() {
  return <AuthShell initialMode="signin" />;
}
