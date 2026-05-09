import { createContext } from 'react';
import type { User, LoginCredentials } from '../types/auth';

export interface AuthContextValue {
    user: User | null;
    /** Effective permission slugs (DB + config fallback), same as API /me. */
    permissions: string[];
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<User>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
