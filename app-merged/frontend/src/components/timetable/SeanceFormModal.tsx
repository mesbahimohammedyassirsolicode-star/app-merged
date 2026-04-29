import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import Modal from '../ui/modal';
import { timetableApi, type TimetableSeance } from '../../api/api/timetable';
import { groupsApi } from '../../api/api/groups';
import { modulesApi } from '../../api/api/modules';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../lib/api-error';

// ── Schema ────────────────────────────────────────────────────────────────────

const seanceSchema = z
    .object({
        module_id: z.coerce.number().min(1, 'Module requis'),
        groupe_id: z.coerce.number().min(1, 'Groupe requis'),
        date: z.string().min(1, 'Date requise'),
        start_time: z.string().min(1, 'Heure de début requise'),
        end_time: z.string().min(1, 'Heure de fin requise'),
        salle: z.string().max(20).optional().or(z.literal('')),
        type: z.enum(['presentiel', 'distance']).default('presentiel'),
        status: z.enum(['planifie', 'realise', 'annule']).default('planifie'),
    })
    .refine((d) => d.end_time > d.start_time, {
        message: "L'heure de fin doit être après l'heure de début",
        path: ['end_time'],
    });

type SeanceFormValues = z.infer<typeof seanceSchema>;

// ── Types ────────────────────────────────────────────────────────────────────

interface Props {
    isOpen: boolean;
    onClose: () => void;
    editing?: TimetableSeance | null;
    /** Pre-fill date when opening from a calendar cell click */
    defaultDate?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SeanceFormModal({ isOpen, onClose, editing, defaultDate }: Props) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const isAdmin = ['admin', 'directeur', 'secretariat'].includes(user?.role ?? '');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SeanceFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(seanceSchema) as any,
        defaultValues: {
            type: 'presentiel',
            status: 'planifie',
        },
    });

    // ── Load dropdown data ────────────────────────────────────────────────────
    const { data: groupsData } = useQuery({
        queryKey: ['groups-dropdown'],
        queryFn: () => groupsApi.list({ per_page: 100 }),
        enabled: isOpen,
    });
    const groups = Array.isArray(groupsData?.items) ? groupsData.items : [];

    const { data: modulesData } = useQuery({
        queryKey: ['modules-dropdown'],
        queryFn: () => modulesApi.list(),
        enabled: isOpen,
    });
    const modules = Array.isArray(modulesData) ? modulesData : [];

    // ── Populate form when editing ────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        if (editing) {
            reset({
                module_id: editing.module_id ?? editing.module?.id ?? 0,
                groupe_id: editing.groupe_id ?? editing.groupe?.id ?? 0,
                date: editing.date,
                start_time: editing.start_time?.slice(0, 5) ?? '',
                end_time: editing.end_time?.slice(0, 5) ?? '',
                salle: editing.salle ?? '',
                type: (editing.type as 'presentiel' | 'distance') ?? 'presentiel',
                status: (editing.status as 'planifie' | 'realise' | 'annule') ?? 'planifie',
            });
        } else {
            reset({
                date: defaultDate ?? new Date().toISOString().slice(0, 10),
                type: 'presentiel',
                status: 'planifie',
                salle: '',
            });
        }
    }, [isOpen, editing, defaultDate, reset]);

    // ── Mutations ─────────────────────────────────────────────────────────────
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['timetable'] });
        onClose();
    };

    const createMut = useMutation({
        mutationFn: timetableApi.create,
        onSuccess: () => {
            toast.success('Séance créée avec succès.');
            invalidate();
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Erreur lors de la creation.'));
        },
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<SeanceFormValues> }) =>
            timetableApi.update(id, data),
        onSuccess: () => {
            toast.success('Séance mise à jour.');
            invalidate();
        },
        onError: (err: unknown) => {
            toast.error(getApiErrorMessage(err, 'Erreur lors de la mise a jour.'));
        },
    });

    const isPending = createMut.isPending || updateMut.isPending;

    // ── Submit ────────────────────────────────────────────────────────────────
    const onSubmit = (data: SeanceFormValues) => {
        const payload = {
            ...data,
            salle: data.salle || undefined,
        };
        if (editing) {
            updateMut.mutate({ id: editing.id, data: payload });
        } else {
            createMut.mutate(payload);
        }
    };

    // ── Select class helper ───────────────────────────────────────────────────
    const selectCls =
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? 'Modifier la séance' : 'Ajouter une séance'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Module */}
                <div className="grid gap-2">
                    <Label>
                        Module <span className="text-red-500">*</span>
                    </Label>
                    <select {...register('module_id')} className={selectCls}>
                        <option value="">Sélectionner un module…</option>
                        {modules.map((m: { id: number; code?: string; label: string }) => (
                            <option key={m.id} value={m.id}>
                                {m.code ? `[${m.code}] ` : ''}{m.label}
                            </option>
                        ))}
                    </select>
                    {errors.module_id && (
                        <p className="text-xs text-red-500">{errors.module_id.message}</p>
                    )}
                </div>

                {/* Groupe */}
                <div className="grid gap-2">
                    <Label>
                        Groupe <span className="text-red-500">*</span>
                    </Label>
                    <select {...register('groupe_id')} className={selectCls}>
                        <option value="">Sélectionner un groupe…</option>
                        {groups.map((g: { id: number; label: string }) => (
                            <option key={g.id} value={g.id}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                    {errors.groupe_id && (
                        <p className="text-xs text-red-500">{errors.groupe_id.message}</p>
                    )}
                </div>

                {/* Date + Times */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-2">
                        <Label>
                            Date <span className="text-red-500">*</span>
                        </Label>
                        <Input type="date" {...register('date')} />
                        {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label>
                            Début <span className="text-red-500">*</span>
                        </Label>
                        <Input type="time" step={1800} {...register('start_time')} />
                        {errors.start_time && (
                            <p className="text-xs text-red-500">{errors.start_time.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>
                            Fin <span className="text-red-500">*</span>
                        </Label>
                        <Input type="time" step={1800} {...register('end_time')} />
                        {errors.end_time && (
                            <p className="text-xs text-red-500">{errors.end_time.message}</p>
                        )}
                    </div>
                </div>

                {/* Salle + Type */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                        <Label>Salle</Label>
                        <Input {...register('salle')} placeholder="A101" maxLength={20} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Type</Label>
                        <select {...register('type')} className={selectCls}>
                            <option value="presentiel">Présentiel</option>
                            <option value="distance">À distance</option>
                        </select>
                    </div>
                </div>

                {/* Status — only shown for admins or when editing */}
                {(isAdmin || editing) && (
                    <div className="grid gap-2">
                        <Label>Statut</Label>
                        <select {...register('status')} className={selectCls}>
                            <option value="planifie">Planifié</option>
                            <option value="realise">Réalisé</option>
                            <option value="annule">Annulé</option>
                        </select>
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                        Annuler
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editing ? 'Enregistrer' : 'Créer la séance'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
