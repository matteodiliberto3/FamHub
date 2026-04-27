import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  createChildProfile,
  getProfileAsync,
  listFamiliesAsync,
  registerLoginAccount,
  saveProfileAsync,
  upsertFamily,
} from '@/lib/onboarding-store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [familyProfile, setFamilyProfile] = useState(null);
  const [families, setFamilies] = useState([]);

  useEffect(() => {
    checkAppState();
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUserAuth();
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      // Local-first mode: keep app independent from Base44 remote APIs.
      setAppPublicSettings({ id: 'local', public_settings: {} });
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      if (!isSupabaseConfigured || !supabase) {
        setAuthError({
          type: 'auth_not_configured',
          message: 'Supabase configuration is missing',
        });
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
        return;
      }

      const {
        data: { user: supabaseUser },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!supabaseUser) {
        throw { status: 401, message: 'Authentication required' };
      }

      const currentUser = {
        id: supabaseUser.id,
        name:
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          supabaseUser.email?.split('@')[0] ||
          'Utente',
        email: supabaseUser.email,
        provider: supabaseUser.app_metadata?.provider || 'google',
      };

      await registerLoginAccount({
        accountId: currentUser.id,
        email: currentUser.email || `${currentUser.id}@local.dilihub.app`,
        displayName: currentUser.name,
        provider: currentUser.provider || 'google',
      });
      setUser(currentUser);
      const profile = await getProfileAsync(currentUser.id);
      setFamilyProfile(profile);
      setFamilies(await listFamiliesAsync());
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);

      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setFamilyProfile(null);

    if (!supabase) return;

    supabase.auth.signOut().finally(() => {
      if (shouldRedirect) {
        window.location.href = window.location.origin;
      }
    });
  };

  const navigateToLogin = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthError({
        type: 'auth_not_configured',
        message: 'Supabase configuration is missing',
      });
      return;
    }

    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });
    if (error) {
      setAuthError({
        type: 'oauth_error',
        message: error.message || 'Google login failed',
      });
    }
  };

  const completeOnboarding = async (payload) => {
    if (!user) return;
    const family = await upsertFamily({
      familyName: payload.familyName,
      role: payload.role,
      currentUserName: payload.displayName || user.name,
      spouseName: payload.spouseName,
      childrenNames: payload.childrenNames,
      currentUserId: user.id,
      currentUserEmail: user.email,
      currentUserProvider: user.provider || 'google',
    });

    const profile = await saveProfileAsync(user.id, {
      onboardingCompleted: true,
      role: payload.role,
      familyId: family.id,
      familyName: family.name,
      displayName: payload.displayName || user.name,
      completedAt: new Date().toISOString(),
    });

    setFamilyProfile(profile);
    await Promise.all(
      (payload.childrenNames || [])
        .map((name) => name.trim())
        .filter(Boolean)
        .map((childName) => createChildProfile({ familyId: family.id, name: childName })),
    );
    setFamilies(await listFamiliesAsync());
    setUser((prev) => ({
      ...prev,
      role: payload.role,
      family_id: family.id,
      family_name: family.name,
      name: payload.displayName || prev?.name,
    }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      familyProfile,
      families,
      needsOnboarding: isAuthenticated && !familyProfile?.onboardingCompleted,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
