'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm, RegisterForm } from '@/components/features/auth';

export default function LoginPage() {
  const [showRegister, setShowRegister] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      {showRegister ? (
        <RegisterForm
          onSuccess={() => setShowRegister(false)}
          onLoginClick={() => setShowRegister(false)}
        />
      ) : (
        <LoginForm
          onSuccess={handleSuccess}
          onRegisterClick={() => setShowRegister(true)}
        />
      )}
    </main>
  );
}
