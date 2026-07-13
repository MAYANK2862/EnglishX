'use client';

import { Suspense } from 'react';
import JoinContent from './JoinContent';

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
