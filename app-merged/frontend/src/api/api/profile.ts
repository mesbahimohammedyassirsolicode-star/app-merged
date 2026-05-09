import api from '../../lib/axios';
import { unwrapData, type ApiResponse } from '../../lib/api';
import type { User } from '../../types/auth';

export const profileApi = {
  update: (payload: {
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    avatar?: File | null;
  }) => {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('email', payload.email);
    if (payload.password) form.append('password', payload.password);
    if (payload.password_confirmation) form.append('password_confirmation', payload.password_confirmation);
    if (payload.avatar) form.append('avatar', payload.avatar);

    return api
      .put<ApiResponse<User>>('/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(unwrapData);
  },
};
