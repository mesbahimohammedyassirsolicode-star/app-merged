import api from '../lib/axios';
import { unwrapData, type ApiResponse } from '../lib/api';
import type { User } from '../types/auth';

export type CreateUserPayload = {
    name: string;
    email: string;
    password: string;
    role: string;
} & Record<string, string | number | boolean | string[] | number[] | undefined | null>;

function unwrapUsersListPayload(data: unknown): User[] | { data: User[] } {
    if (data != null && typeof data === 'object' && 'data' in data) {
        const inner = (data as { data: unknown }).data;
        if (Array.isArray(inner)) return { data: inner as User[] };
        if (inner != null && typeof inner === 'object' && 'data' in inner && Array.isArray((inner as { data: User[] }).data)) {
            return inner as { data: User[] };
        }
    }
    if (Array.isArray(data)) return data as User[];
    return { data: [] };
}

export const userService = {
    getAll: async (role?: string): Promise<{ data: User[] }> => {
        const params = role ? { role } : {};
        const { data } = await api.get<{ data: unknown }>('/users', { params });
        const unwrapped = unwrapUsersListPayload(data);
        return Array.isArray(unwrapped) ? { data: unwrapped } : unwrapped;
    },

    create: async (payload: CreateUserPayload) => {
        const res = await api.post<{ message?: string; data?: User }>('/users', payload);
        const body = res.data as { data?: User } | User;
        if (body != null && typeof body === 'object' && 'data' in body && (body as { data?: User }).data !== undefined) {
            return (body as { data: User }).data;
        }
        return body as User;
    },

    update: async (id: number, payload: Partial<CreateUserPayload>) => {
        const res = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
        return unwrapData(res);
    },

    delete: async (id: number) => {
        await api.delete(`/users/${id}`);
    }
};
