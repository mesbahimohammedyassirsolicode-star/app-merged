import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { User, LoginCredentials } from '../types/auth';
import { authService } from '../api/authService';
import { setAccessToken } from '../lib/axios';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { user: userData, permissions: perm } = await authService.getMe();
                setUser(userData);
                setPermissions(perm ?? []);
            } catch {
                setUser(null);
                setPermissions([]);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    useEffect(() => {
        const handleUnauthorized = async () => {
            setAccessToken(null);
            queryClient.clear();
            setUser(null);
            setPermissions([]);
            navigate('/login', { replace: true });
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, [navigate, queryClient]);

    const login = async (credentials: LoginCredentials) => {
        const response = await authService.login(credentials);
        setAccessToken(response.access_token);
        queryClient.clear();
        setUser(response.user);
        setPermissions(response.permissions ?? []);
        return response.user;
    };

    const logout = async () => {
        try {
            await authService.logout();
        } finally {
            setAccessToken(null);
            queryClient.clear();
            setUser(null);
            setPermissions([]);
        }
    };

    return (
        <AuthContext.Provider value={{ user, permissions, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
