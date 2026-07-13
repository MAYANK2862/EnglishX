'use client';

import { AuthProvider } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export default function AppShell({ children }) {
  return (
    <AuthProvider>
      <Navbar />
      <main>{children}</main>
    </AuthProvider>
  );
}
