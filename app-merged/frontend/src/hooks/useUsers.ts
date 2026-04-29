import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/userService';
import type { CreateUserPayload } from '../api/userService';

export function useUsers(role?: string, scopeUserId?: number, scopeRole?: string) {
    return useQuery({
        queryKey: ['users', scopeUserId, scopeRole, role],
        queryFn: () => userService.getAll(role),
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (user: CreateUserPayload) => userService.create(user),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Parameters<typeof userService.update>[1] }) =>
            userService.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => userService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}
