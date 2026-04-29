import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import Modal from '../ui/modal';
import { userSchema, type UserFormValues } from '../../schemas/userSchemas';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import { academicStructureApi } from '../../api/api/academicStructure';
import type { User } from '../../types/auth';
import { getApiErrorMessage } from '../../lib/api-error';

interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingUser: User | null;
    currentUser: User | null;
}

export default function UserFormModal({ isOpen, onClose, editingUser, currentUser }: UserFormModalProps) {
    const { register, handleSubmit, reset, setValue, setError, control, getValues, formState: { errors } } = useForm<UserFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(userSchema) as any,
        defaultValues: {
            role: 'student',
            type: 'permanent',
            status: 'actif',
            modules: [],
            groups: [],
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (editingUser) {
                reset({
                    name: editingUser.name,
                    email: editingUser.email,
                    password: '',
                    role: editingUser.role,
                    matricule: editingUser.formateur?.matricule ?? '',
                    specialty: editingUser.formateur?.specialty ?? '',
                    type: editingUser.formateur?.type ?? 'permanent',
                    hourly_rate: editingUser.formateur?.hourly_rate,
                    cin: editingUser.parent?.cin ?? '',
                    cef_number: editingUser.stagiaire?.cef_number ?? '',
                    date_naissance: editingUser.stagiaire?.date_naissance?.slice?.(0, 10) ?? '',
                    niveau_scolaire: editingUser.stagiaire?.niveau_scolaire ?? undefined,
                    niveau_formation: editingUser.stagiaire?.niveau_formation ?? undefined,
                    student_niveau: undefined,
                    filiere_id: editingUser.stagiaire?.filiere_id ?? editingUser.stagiaire?.filiere?.id ?? undefined,
                    groupe_id: editingUser.stagiaire?.groupe_id ?? (editingUser.stagiaire?.groupe as { id?: number } | undefined)?.id ?? undefined,
                    status: editingUser.stagiaire?.status ?? 'actif',
                    phone: editingUser.parent?.phone ?? editingUser.administrator?.phone ?? '',
                    address: editingUser.parent?.address ?? '',
                    poste: editingUser.administrator?.poste ?? '',
                    modules: editingUser.modules?.map((m: { id: number }) => m.id) ?? [],
                    groups: editingUser.groups?.map((g: { id: number }) => g.id) ?? [],
                    filiere_id_formateur: editingUser.formateur?.filiere_id ?? undefined,
                    niveau_formateur: editingUser.formateur?.niveau ?? '',
                });
            } else {
                reset({
                    role: 'student',
                    type: 'permanent',
                    status: 'actif',
                    modules: [],
                    groups: [],
                });
            }
        }
    }, [isOpen, editingUser, reset]);

    const watchedModules = useWatch({ control, name: 'modules', defaultValue: [] });
    const watchedGroups = useWatch({ control, name: 'groups', defaultValue: [] });
    const selectedRole = useWatch({ control, name: 'role', defaultValue: 'student' });
    const isTeacherRole = selectedRole === 'teacher' || selectedRole === 'formateur';
    const filiereId = useWatch({ control, name: 'filiere_id' });
    const studentNiveau = useWatch({ control, name: 'student_niveau' });
    const filiereIdForGroups = filiereId !== undefined && filiereId !== 0 ? Number(filiereId) : undefined;

    const { data: filieres = [] } = useQuery({
        queryKey: ['academic', 'filieres', currentUser?.id, currentUser?.role],
        queryFn: () => academicStructureApi.getFilieres(),
        enabled: isOpen,
    });

    const { data: studentProgramData, isLoading: isLoadingGroupes } = useQuery({
        queryKey: ['academic', 'program', 'student', currentUser?.id, currentUser?.role, filiereIdForGroups, studentNiveau],
        queryFn: () => academicStructureApi.getProgram({ filiere_id: filiereIdForGroups!, niveau: String(studentNiveau) }),
        enabled: isOpen && selectedRole === 'student' && !!filiereIdForGroups && !!studentNiveau,
    });

    const groupeOptions = Array.isArray(studentProgramData?.groups) ? studentProgramData.groups : [];
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();

    useEffect(() => {
        if (selectedRole !== 'student') return;
        if (filiereId === 0 || filiereId === undefined || !studentNiveau) {
            setValue('groupe_id', undefined);
        }
    }, [filiereId, selectedRole, setValue, studentNiveau]);

    const filiereIdFormateur = useWatch({ control, name: 'filiere_id_formateur' });
    const niveauFormateur = useWatch({ control, name: 'niveau_formateur' });

    const { data: programData, isLoading: isLoadingProgram } = useQuery({
        queryKey: ['academic', 'program', filiereIdFormateur, niveauFormateur],
        queryFn: () => academicStructureApi.getProgram({ filiere_id: Number(filiereIdFormateur), niveau: String(niveauFormateur) }),
        enabled: isOpen && isTeacherRole && !!filiereIdFormateur && !!niveauFormateur,
    });

    const filteredModules = programData?.modules ?? [];
    const filteredGroups = programData?.groups ?? [];

    const buildPayload = (data: UserFormValues, forEdit = false) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload = { ...data } as any;
        const stagiairOnlyFields = ['cin', 'cef_number', 'date_naissance', 'niveau_scolaire', 'niveau_formation', 'filiere_id', 'groupe_id', 'status'];
        const formateurOnlyFields = ['matricule', 'specialty', 'type', 'hourly_rate'];
        delete payload.student_niveau;

        if (data.role === 'student') {
            if (data.filiere_id !== undefined && data.filiere_id !== 0) payload.filiere_id = Number(data.filiere_id);
            if (data.groupe_id !== undefined && data.groupe_id !== 0) payload.groupe_id = Number(data.groupe_id);
            formateurOnlyFields.forEach(f => delete payload[f]);
            delete payload.modules;
            delete payload.groups;
        } else if (data.role === 'teacher' || data.role === 'formateur') {
            payload.type = payload.type || 'permanent';
            payload.specialty = payload.specialty || payload.specialite || '';
            payload.specialite = payload.specialty;
            const rate = payload.hourly_rate;
            if (rate === '' || rate === undefined || Number.isNaN(Number(rate))) {
                delete payload.hourly_rate;
            } else {
                payload.hourly_rate = Number(rate);
            }
            if (payload.modules) payload.modules = payload.modules.map(Number);
            if (payload.groups) payload.groups = payload.groups.map(Number);
            stagiairOnlyFields.forEach((f: string) => delete payload[f]);
            delete payload.cin;
            delete payload.phone;
            delete payload.address;
            delete payload.poste;
        } else if (data.role === 'parent') {
            stagiairOnlyFields.filter(f => f !== 'cin').forEach(f => delete payload[f]);
            formateurOnlyFields.forEach(f => delete payload[f]);
            delete payload.poste;
            delete payload.modules;
            delete payload.groups;
        } else if (data.role === 'admin') {
            stagiairOnlyFields.forEach(f => delete payload[f]);
            formateurOnlyFields.forEach(f => delete payload[f]);
            delete payload.cin;
            delete payload.address;
            delete payload.modules;
            delete payload.groups;
        }
        if (forEdit && !payload.password) delete payload.password;
        return payload;
    };

    const handleApiError = (err: unknown, setErrorFn: (field: keyof UserFormValues, opts: { type: string; message: string }) => void) => {
        const status =
            err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { status?: number } }).response?.status
                : undefined;
        const data =
            err && typeof err === 'object' && 'response' in err
                ? (err as { response?: { data?: { errors?: Record<string, string[] | string>; message?: string } } }).response?.data
                : undefined;
        const apiErrors = data?.errors;
        const msg = data?.message;
        if (status === 403) {
            toast.error(getApiErrorMessage(err, msg || 'Acces refuse.'));
            return;
        }
        if (apiErrors && typeof apiErrors === 'object') {
            Object.entries(apiErrors).forEach(([field, messages]) => {
                const m = Array.isArray(messages) ? messages[0] : String(messages);
                if (m) {
                    const formField = (field === 'specialite' ? 'specialty' : field) as keyof UserFormValues;
                    setErrorFn(formField, { type: 'server', message: m });
                }
            });
            toast.error('Veuillez corriger les erreurs dans le formulaire.');
        } else {
            toast.error(getApiErrorMessage(err, msg || 'Une erreur est survenue.'));
        }
    };

    const onSubmit = (data: UserFormValues) => {
        if (!editingUser && (!data.password || String(data.password).length < 8)) {
            setError('password', { type: 'custom', message: 'Mot de passe requis (min 8 caractères)' });
            return;
        }
        const payload = buildPayload(data, !!editingUser);
        if (editingUser) {
            updateUser.mutate(
                { id: editingUser.id, data: payload },
                {
                    onSuccess: () => {
                        toast.success('Utilisateur modifié.');
                        onClose();
                    },
                    onError: (err: unknown) => handleApiError(err, setError)
                }
            );
        } else {
            createUser.mutate(payload, {
                onSuccess: () => {
                    toast.success('Utilisateur créé.');
                    onClose();
                },
                onError: (err: unknown) => handleApiError(err, setError)
            });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}>
            <form onSubmit={handleSubmit((data) => onSubmit(data as UserFormValues))} className="space-y-4">
                {/* Form fields identical to the huge ones before... */}
                <div className="grid gap-2">
                    <Label>Rôle</Label>
                    <select {...register('role')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                        <option value="student">Stagiaire</option>
                        <option value="teacher">Formateur (enseignant)</option>
                        <option value="parent">Parent</option>
                        <option value="admin">Administrateur</option>
                    </select>
                </div>
                <div className="grid gap-2">
                    <Label>Nom complet</Label>
                    <Input {...register('name')} placeholder="Mohammed Alami" />
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input {...register('email')} type="email" placeholder="email@exemple.com" />
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label>Mot de passe {editingUser ? '(laisser vide pour ne pas modifier)' : ''}</Label>
                    <Input {...register('password')} type="password" placeholder="********" />
                    {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                </div>

                {isTeacherRole && (
                    <>
                        <div className="grid gap-2">
                            <Label>Matricule</Label>
                            <Input {...register('matricule')} placeholder="F12345" />
                            {errors.matricule && <p className="text-red-500 text-xs">{errors.matricule.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Spécialité</Label>
                            <Input {...register('specialty')} placeholder="Développement Digital" />
                            {errors.specialty && <p className="text-red-500 text-xs">{errors.specialty.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <select {...register('type')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="permanent">Permanent</option>
                                <option value="vacataire">Vacataire</option>
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Taux Horaire (DH)</Label>
                            <Input {...register('hourly_rate')} type="number" step="0.01" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Filière <span className="text-red-500">*</span></Label>
                            <select {...register('filiere_id_formateur')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Sélectionner une filière...</option>
                                {filieres.map((f: { id: number, code: string, label: string }) => <option key={f.id} value={f.id}>{f.code} — {f.label}</option>)}
                            </select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Niveau <span className="text-red-500">*</span></Label>
                            <select {...register('niveau_formateur')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Sélectionner...</option>
                                <option value="1A">1A</option>
                                <option value="2A">2A</option>
                            </select>
                        </div>
                        {filiereIdFormateur && niveauFormateur && (
                            <>
                                <div className="grid gap-2">
                                    <Label>Modules assignés ({filteredModules.length})</Label>
                                    <div className="grid grid-cols-1 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto">
                                        {isLoadingProgram ? (
                                            <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>
                                        ) : filteredModules.map((m: { id: number, code: string, label: string }) => (
                                            <label key={m.id} className="flex items-center space-x-2 text-xs hover:bg-gray-50 p-1 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    value={m.id}
                                                    checked={(watchedModules ?? []).includes(m.id)}
                                                    onChange={(e) => {
                                                        const current = getValues('modules') ?? [];
                                                        if (e.target.checked) setValue('modules', [...current, m.id]);
                                                        else setValue('modules', current.filter((id) => id !== m.id));
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>[{m.code}] {m.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Groupes assignés ({filteredGroups.length})</Label>
                                    <div className="grid grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto">
                                        {isLoadingProgram ? (
                                            <div className="flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>
                                        ) : filteredGroups.map((g: { id: number, label: string }) => (
                                            <label key={g.id} className="flex items-center space-x-2 text-xs hover:bg-gray-50 p-1 rounded cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    value={g.id}
                                                    checked={(watchedGroups ?? []).includes(g.id)}
                                                    onChange={(e) => {
                                                        const current = getValues('groups') ?? [];
                                                        if (e.target.checked) setValue('groups', [...current, g.id]);
                                                        else setValue('groups', current.filter((id) => id !== g.id));
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>{g.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {selectedRole === 'student' && (
                    <>
                        <div className="grid gap-2">
                            <Label>Type de formation <span className="text-red-500">*</span></Label>
                            <select {...register('niveau_formation')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Sélectionner...</option>
                                <option value="Q">Qualification</option>
                                <option value="T">Technicien</option>
                                <option value="TS">Technicien Spécialisé</option>
                                <option value="BACHELOR">Bachelor</option>
                                <option value="MASTER">Master</option>
                            </select>
                            {errors.niveau_formation && <p className="text-red-500 text-xs">{errors.niveau_formation.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Filière <span className="text-red-500">*</span></Label>
                            <select {...register('filiere_id')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Sélectionner une filière...</option>
                                {filieres.map((f: { id: number, code: string, label: string }) => <option key={f.id} value={f.id}>{f.code} — {f.label}</option>)}
                            </select>
                            {errors.filiere_id && <p className="text-red-500 text-xs">{errors.filiere_id.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Année <span className="text-red-500">*</span></Label>
                            <select {...register('student_niveau')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Sélectionner une année...</option>
                                <option value="1A">1ère année</option>
                                <option value="2A">2ème année</option>
                            </select>
                            {errors.student_niveau && <p className="text-red-500 text-xs">{errors.student_niveau.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Groupe <span className="text-red-500">*</span></Label>
                            <select {...register('groupe_id')} disabled={!filiereIdForGroups || !studentNiveau || isLoadingGroupes} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50">
                                <option value="">{isLoadingGroupes ? 'Chargement...' : 'Sélectionner un groupe...'}</option>
                                {groupeOptions.map((g: { id: number, label: string }) => <option key={g.id} value={g.id}>{g.label}</option>)}
                            </select>
                            {errors.groupe_id && <p className="text-red-500 text-xs">{errors.groupe_id.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>CIN <span className="text-red-500">*</span></Label>
                            <Input {...register('cin')} placeholder="AB123456" className="uppercase" />
                            {errors.cin && <p className="text-red-500 text-xs">{errors.cin.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Numéro CEF (Massar)</Label>
                            <Input {...register('cef_number')} placeholder="M13000..." />
                            {errors.cef_number && <p className="text-red-500 text-xs">{errors.cef_number.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Date de naissance</Label>
                            <Input {...register('date_naissance')} type="date" />
                            {errors.date_naissance && <p className="text-red-500 text-xs">{errors.date_naissance.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Niveau scolaire <span className="text-red-500">*</span></Label>
                            <select {...register('niveau_scolaire')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                <option value="">Sélectionner...</option>
                                <option value="COLLEGE">Collège</option>
                                <option value="BAC">Baccalauréat</option>
                                <option value="BAC+2">Bac+2</option>
                                <option value="BAC+3">Bac+3</option>
                                <option value="MASTER">Master</option>
                            </select>
                            {errors.niveau_scolaire && <p className="text-red-500 text-xs">{errors.niveau_scolaire.message}</p>}
                        </div>
                    </>
                )}

                {selectedRole === 'parent' && (
                    <>
                        <div className="grid gap-2">
                            <Label>CIN</Label>
                            <Input {...register('cin')} placeholder="KB123456" />
                            {errors.cin && <p className="text-red-500 text-xs">{errors.cin.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label>Téléphone</Label>
                            <Input {...register('phone')} placeholder="06..." />
                        </div>
                    </>
                )}

                <div className="pt-4 flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
                    <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                        {(createUser.isPending || updateUser.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingUser ? 'Enregistrer' : 'Créer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
