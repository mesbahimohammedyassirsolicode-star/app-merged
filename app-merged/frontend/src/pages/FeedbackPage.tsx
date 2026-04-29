import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { feedbackApi } from '../api/api/feedback';
import { toast } from 'sonner';
import { Label } from '../components/ui/label';
import { getApiErrorMessage } from '../lib/api-error';

const schema = z.object({
  category: z.enum(['pedagogie', 'infrastructure', 'administration', 'autre']),
  content: z.string().min(10, 'Minimum 10 caractères'),
});

type FormValues = z.infer<typeof schema>;

export default function FeedbackPage() {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'pedagogie', content: '' },
  });

  const submit = useMutation({
    mutationFn: (body: FormValues) => feedbackApi.submit(body),
    onSuccess: () => {
      toast.success('Avis enregistré de manière anonyme.');
      reset();
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, 'Erreur lors de l\'envoi.')),
  });

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.feedback')}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Formulaire anonyme</CardTitle>
          <p className="text-sm text-gray-500">Aucune donnée personnelle n’est enregistrée.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => submit.mutate(d))} className="space-y-4">
            <div>
              <Label>Catégorie</Label>
              <select {...register('category')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                <option value="pedagogie">Pédagogie</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="administration">Administration</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <Label>Message</Label>
              <textarea {...register('content')} rows={4} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}
            </div>
            <Button type="submit" disabled={submit.isPending}>Envoyer</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
