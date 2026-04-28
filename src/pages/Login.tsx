// @ts-nocheck
import React, { useState } from 'react';
import { Chrome, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Login({ onGoogleLogin }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await onGoogleLogin();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Accedi a DILIHUB</h1>
          <p className="text-muted-foreground mt-2">
            Usa Google per entrare e collegare i membri della tua famiglia.
          </p>
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Configurazione mancante: imposta `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nel file `.env`.
          </div>
        ) : (
          <Button className="w-full h-11 text-base" onClick={handleLogin} disabled={isLoading}>
            <Chrome className="w-4 h-4 mr-2" />
            {isLoading ? 'Reindirizzamento...' : 'Continua con Google'}
          </Button>
        )}
      </Card>
    </div>
  );
}

