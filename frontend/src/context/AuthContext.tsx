import React, { createContext, useState, useEffect, useCallback } from 'react';
import { UserSummaryDto, LoginRequest } from '../types';
import { authApi } from '../api/authApi';
import { profileApi } from '../api/profileApi';
import { setAccessToken } from '../api/client';
import { isAdminTier } from '../utils/permissions';

export interface AuthContextType {
  user: UserSummaryDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isPresident: boolean;
  isVicePresident: boolean;
  isRH: boolean;
  login: (credentials: LoginRequest) => Promise<UserSummaryDto>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserSummaryDto | null>;
  setUser: (user: UserSummaryDto | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummaryDto | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    try {
      // Attempt silent refresh via the HTTP-only refresh cookie
      const response = await authApi.refresh();
      setTokenState(response.accessToken);
      setAccessToken(response.accessToken);
      const profile = await profileApi.getMyProfile();
      setUser(profile);
    } catch {
      // No active refresh token cookie, start unauthenticated
      setAccessToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const handleSessionExpired = () => {
      setAccessToken(null);
      setTokenState(null);
      setUser(null);
    };

    window.addEventListener('wassal:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('wassal:session-expired', handleSessionExpired);
    };
  }, [initAuth]);

  const login = async (credentials: LoginRequest): Promise<UserSummaryDto> => {
    const res = await authApi.login(credentials);
    setTokenState(res.accessToken);
    setAccessToken(res.accessToken);
    const profile = await profileApi.getMyProfile();
    setUser(profile);
    return profile;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setAccessToken(null);
      setTokenState(null);
      setUser(null);
    }
  };

  const refreshUser = async (): Promise<UserSummaryDto | null> => {
    try {
      const updated = await profileApi.getMyProfile();
      setUser(updated);
      return updated;
    } catch {
      return null;
    }
  };

  const isAdmin = isAdminTier(user?.role);
  const isPresident = user?.role === 'PRESIDENT';
  const isVicePresident = user?.role === 'VICE_PRESIDENT';
  const isRH = user?.role === 'RH';

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isPresident,
        isVicePresident,
        isRH,
        login,
        logout,
        refreshUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
