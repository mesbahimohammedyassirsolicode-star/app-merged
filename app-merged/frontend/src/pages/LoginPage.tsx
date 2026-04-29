import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { resolveDashboardPath } from '../lib/rbac';

const loginSchema = z.object({
    email: z.string().email({ message: "Email invalide" }),
    password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        setError(null);
        try {
            const authenticatedUser = await login(data);
            navigate(resolveDashboardPath(authenticatedUser.role), { replace: true });
        } catch (err: unknown) {
            let msg: string | null = null;
            if (axios.isAxiosError(err)) {
                const body = err.response?.data;
                if (body && typeof body === 'object') {
                    const b = body as { message?: string; errors?: Record<string, string[] | undefined> };
                    msg = typeof b.message === 'string' ? b.message : null;
                    if (!msg && b.errors) {
                        const emailFirst = b.errors.email?.[0];
                        const nested = Object.values(b.errors).find((v) => Array.isArray(v) && v.length > 0) as
                            | string[]
                            | undefined;
                        msg = emailFirst ?? nested?.[0] ?? null;
                    }
                }
                if (!msg && err.code === 'ERR_NETWORK') {
                    msg = 'Impossible de joindre le serveur. Vérifiez que l\'API tourne et CORS.';
                }
            }
            const finalMsg =
                msg || (err instanceof Error ? err.message : null) || 'Une erreur est survenue lors de la connexion.';
            setError(finalMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-primary-600">GIMS Connect</CardTitle>
                    <CardDescription className="text-center">
                        Système de Gestion IKI
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nom@exemple.com"
                                {...register('email')}
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register('password')}
                                className={errors.password ? 'border-red-500' : ''}
                            />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                        </div>
                        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
                        <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Se connecter
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center text-sm text-gray-500">
                    Problème de connexion? Contactez l'administration.
                </CardFooter>
            </Card>
        </div>
    );
}
