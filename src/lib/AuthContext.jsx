import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  createChildProfile,
  getProfile,
  listFamilies,
  registerLoginAccount,
  saveProfile,
  upsertFamily,
} from '@/lib/onboarding-store';

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
      const currentUser = await base44.auth.me();
      registerLoginAccount({
        accountId: currentUser.id,
        email: currentUser.email || `${currentUser.id}@local.dilihub.app`,
        displayName: currentUser.name,
        provider: currentUser.provider || 'google',
      });
      setUser(currentUser);
      const profile = getProfile(currentUser.id);
      setFamilyProfile(profile);
      setFamilies(listFamilies());
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

    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const completeOnboarding = (payload) => {
    if (!user) return;
    const family = upsertFamily({
      familyName: payload.familyName,
      role: payload.role,
      currentUserName: payload.displayName || user.name,
      spouseName: payload.spouseName,
      childrenNames: payload.childrenNames,
    });

    const profile = saveProfile(user.id, {
      onboardingCompleted: true,
      role: payload.role,
      familyId: family.id,
      familyName: family.name,
      displayName: payload.displayName || user.name,
      completedAt: new Date().toISOString(),
    });

    setFamilyProfile(profile);
    (payload.childrenNames || [])
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((childName) => {
        createChildProfile({ familyId: family.id, name: childName });
      });
    setFamilies(listFamilies());
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
