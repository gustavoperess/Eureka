"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, userAPI, LoginData, SignupData, UserData, CompanyData } from '../services/api';

type AuthUserType = 'company' | 'user';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | CompanyData | null;
  userType: AuthUserType | null;
  token: string | null;
  login: (data: LoginData, type: AuthUserType) => Promise<void>;
  signup: (data: SignupData, type: AuthUserType) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to safely access localStorage
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

// Helper function to safely set localStorage
const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Helper function to safely remove localStorage item
const removeLocalStorageItem = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<UserData | CompanyData | null>(null);
  const [userType, setUserType] = useState<AuthUserType | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const router = useRouter();

  // Check for existing auth on mount
  useEffect(() => {
    const savedToken = getLocalStorageItem('auth_token');
    const savedUserType = getLocalStorageItem('user_type') as AuthUserType | null;
    const savedUser = getLocalStorageItem('user');

    if (savedToken && savedUserType && savedUser) {
      setToken(savedToken);
      setUserType(savedUserType);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, []);

  const login = async (data: LoginData, type: AuthUserType) => {
    setIsLoading(true);
    try {
      let response;
      console.log(`Attempting to login as ${type} with email: ${data.email}`);
      
      if (type === 'company') {
        response = await authAPI.loginCompany(data);
      } else {
        response = await authAPI.loginUser(data);
      }
      
      console.log('Login successful, response:', response);

      // Check if response contains a token (for future backend implementation)
      // For now, use a default token
      let authToken;
      if (response && response.token) {
        console.log('Using token from response');
        authToken = response.token;
      } else {
        console.log('Using default token (backend does not provide token yet)');
        authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      }
      
      // Save auth data
      setLocalStorageItem('auth_token', authToken);
      setLocalStorageItem('authToken', authToken); // Use both names for compatibility
      setLocalStorageItem('user_type', type);
      setLocalStorageItem('user', JSON.stringify(response));
      
      console.log('Auth data saved to localStorage');
      
      // Update state
      setToken(authToken);
      setUser(response);
      setUserType(type);
      setIsAuthenticated(true);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check if this is a development environment with a network error
      if (process.env.NODE_ENV === 'development' && error.isNetworkError) {
        console.warn('Network error during login - backend might not be running');
        throw new Error('Cannot connect to the server. Please make sure the backend is running.');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData, type: AuthUserType) => {
    setIsLoading(true);
    try {
      console.log(`Attempting to register as ${type} with email: ${data.email}`);
      
      if (type === 'company') {
        const companyData = {
          name: data.companyName || data.name,
          email: data.email,
          password: data.password,
          registeredAddress: data.registeredAddress
        };
        
        console.log('Registering company with data:', companyData);
        const response = await authAPI.registerCompany(companyData);
        console.log('Company registration successful:', response);
        
        // After successful registration, login the user
        await login({ email: data.email, password: data.password }, 'company');
      } else {
        // For user signup
        const userData = {
          fullName: data.name,
          email: data.email,
          password: data.password,
          companyId: data.companyId || "00000000-0000-0000-0000-000000000000"
        };
        
        console.log('Registering user with data:', userData);
        const response = await authAPI.registerUser(userData);
        console.log('User registration successful:', response);
        
        // After successful registration, login the user
        await login({ email: data.email, password: data.password }, 'user');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Check if this is a network error
      if (process.env.NODE_ENV === 'development' && error.isNetworkError) {
        console.warn('Network error during registration - backend might not be running');
        throw new Error('Cannot connect to the server. Please make sure the backend is running.');
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user');
    
    // Clear all auth data
    removeLocalStorageItem('auth_token');
    removeLocalStorageItem('authToken'); // Clear both names for compatibility
    removeLocalStorageItem('user_type');
    removeLocalStorageItem('user');
    
    // Reset state
    setToken(null);
    setUser(null);
    setUserType(null);
    setIsAuthenticated(false);
    
    // Redirect to homepage
    router.push('/');
    
    console.log('Logout completed');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        userType,
        token,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 