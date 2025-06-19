
import React from 'react';
import { InvitationDebug } from '@/components/debug/InvitationDebug';

export default function DebugInvitation() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Invitation Debug</h1>
        <InvitationDebug />
      </div>
    </div>
  );
}
