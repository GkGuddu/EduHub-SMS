import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  Permission,
  hasPermission as checkPerm,
} from '@eduhub/shared';
import { authApi } from '../api/client';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  permissions: string[];
  schoolId: string;
  schoolName: string;
  mustChangePassword?: boolean;
}

export interface SchoolInfo {
  _id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  academicYear: string;
  website?: string;
  logo?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  school: SchoolInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (perm: Permission) => boolean;
  updateUserPermissions: (permissions: string[]) => void;
  setMustChangePassword: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const data = await authApi.getMe();
        if (isMounted) {
          if (data?.success && data?.user) {
            setUser(data.user);
            setSchool(data.school);
          } else {
            setUser(null);
            setSchool(null);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setSchool(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(credentials);
      if (data.success && data.user) {
        setUser(data.user);
        setSchool(data.school);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setSchool(null);
    }
  };

  const hasPermission = (perm: Permission): boolean => {
    if (!user) return false;
    return checkPerm(user.role, user.permissions, perm);
  };

  const updateUserPermissions = (newPermissions: string[]) => {
    if (user) {
      setUser({ ...user, permissions: newPermissions });
    }
  };

  const setMustChangePassword = (val: boolean) => {
    if (user) {
      setUser({ ...user, mustChangePassword: val });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        school,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPermission,
        updateUserPermissions,
        setMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
