import { Outfit } from 'next/font/google';
import LoginForm from '@/components/auth/LoginForm';
import CourtPanel from '@/components/auth/CourtPanel';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

export function AuthShell({ initialMode = 'signin' }) {
  return (
    <div className={`${outfit.className} min-h-screen grid place-items-center bg-deep-green p-4 min-[900px]:p-10 font-outfit text-dark-teal`}>
      <main className="grid w-[min(1360px,100%)] grid-cols-1 min-[900px]:grid-cols-2 h-auto min-h-[min(820px,calc(100vh_-_80px))] overflow-hidden rounded-[24px] min-[900px]:rounded-[48px] bg-ivory">
        <LoginForm initialMode={initialMode} />
        <CourtPanel />
      </main>
    </div>
  );
}

export default AuthShell;
