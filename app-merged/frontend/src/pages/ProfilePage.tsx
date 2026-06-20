import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { profileApi } from '../api/api/profile';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);

  const mutation = useMutation({
    mutationFn: () => profileApi.update({ name, email, password: password || undefined, password_confirmation: passwordConfirmation || undefined, avatar }),
    onSuccess: () => toast.success('Profile updated successfully'),
    onError: () => toast.error('Unable to update profile'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-theme-text-primary">Edit Profile</h1>
      <div className="rounded-xl border border-theme-border glass-panel p-5 space-y-4">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" type="password" />
        <Input value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} placeholder="Confirm password" type="password" />
        <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
        <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending}>Save profile</Button>
      </div>
    </div>
  );
}
