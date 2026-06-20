import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { User, LoginCredentials } from '../types/auth';
import { authService } from '../api/authService';
import { setAccessToken, registerUnauthorizedHandler } from '../lib/axios';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleUnauthorizedRef = useRef(() => {});

    useEffect(() => {
        handleUnauthorizedRef.current = () => {
            setAccessToken(null);
            queryClient.cancelQueries();
            queryClient.clear();
            setUser(null);
            setPermissions([]);
            navigate('/login', { replace: true });
        };
    }, [navigate, queryClient]);

    useEffect(() => {
        registerUnauthorizedHandler(() => {
            handleUnauthorizedRef.current();
        });

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
