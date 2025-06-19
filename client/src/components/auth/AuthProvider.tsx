
import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export { useAuth };
