import * as z from 'zod';

// FIXED: Added all backend-supported roles (directeur, secretariat, formateur, stagiaire)
// Previously those roles could not be created from the admin UI.
const baseSchema = z.object({
    name: z.string().min(2, "Nom trop court"),
    email: z.string().email("Email invalide"),
    password: z.string().optional(), // required only on create, validated in submit
    role: z.enum(['admin', 'directeur', 'secretariat', 'teacher', 'formateur', 'student', 'stagiaire', 'parent']),
});

// Define profile specific validation logic dynamically in submit handler or refine here
// For simplicity, we'll check conditionally in the form logic or create separate schemas.
// Let's create a unified schema with optional fields that become required based on role.

// Helper: preprocess empty strings to undefined so .optional() works with HTML selects
const emptyToUndefined = (val: unknown) => (val === '' || val === null ? undefined : val);
const emptyStringToUndefined = z.preprocess(emptyToUndefined, z.string().optional());
const optionalEnum = <T extends [string, ...string[]]>(values: T) =>
    z.preprocess(emptyToUndefined, z.enum(values).optional());
const optionalNumeric = z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().optional()
);

const userSchema = baseSchema.extend({
    // Formateur
    matricule: z.string().optional(),
    specialty: z.string().optional(),
    type: optionalEnum(['permanent', 'vacataire']),
    hourly_rate: z.preprocess(
        (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
        z.number().optional()
    ),

    // Stagiaire
    cin: z.string().optional(),
    cef_number: z.string().optional(),
    date_naissance: emptyStringToUndefined,
    niveau_scolaire: optionalEnum(['COLLEGE', 'BAC', 'BAC+2', 'BAC+3', 'MASTER']),
    niveau_formation: optionalEnum(['Q', 'T', 'TS', 'BACHELOR', 'MASTER']),
    student_niveau: optionalEnum(['1A', '2A']),
    filiere_id: optionalNumeric,
    groupe_id: optionalNumeric,
    status: optionalEnum(['actif', 'abandon', 'exclu', 'diplome']),

    // Parent
    phone: z.string().optional(),
    address: z.string().optional(),

    // Admin
    poste: z.string().optional(),

    // New assignments
    modules: z.array(z.number()).optional(),
    groups: z.array(z.number()).optional(),
    filiere_id_formateur: optionalNumeric,
    niveau_formateur: optionalEnum(['1A', '2A']),
}).superRefine((data, ctx) => {
    if (data.role === 'teacher' || data.role === 'formateur') {
        if (!data.matricule) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Matricule requis", path: ['matricule'] });
        if (!data.specialty) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Spécialité requise", path: ['specialty'] });
        if (!data.type) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type requis", path: ['type'] });
    }
    if (data.role === 'student') {
        if (!data.cin) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CIN requis (2 lettres + 6 chiffres)", path: ['cin'] });
        else if (!/^[A-Z]{2}\d{6}$/i.test(data.cin)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CIN: 2 lettres + 6 chiffres (ex: AB123456)", path: ['cin'] });
        if (!data.cef_number) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CEF requis", path: ['cef_number'] });
        if (!data.date_naissance) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Date naissance requise", path: ['date_naissance'] });
        if (!data.niveau_scolaire) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Niveau scolaire requis", path: ['niveau_scolaire'] });
        if (!data.niveau_formation) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Type de formation requis", path: ['niveau_formation'] });
        if (!data.filiere_id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Filière requise", path: ['filiere_id'] });
        if (!data.groupe_id) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Groupe requis", path: ['groupe_id'] });
        // Eligibility: Q min COLLEGE, T/TS min BAC, BACHELOR min BAC+2, MASTER min BAC+3
        if (data.niveau_scolaire && data.niveau_formation) {
            const order: Record<string, number> = { COLLEGE: 0, BAC: 1, 'BAC+2': 2, 'BAC+3': 3, MASTER: 4 };
            const minForFormation: Record<string, string> = { Q: 'COLLEGE', T: 'BAC', TS: 'BAC', BACHELOR: 'BAC+2', MASTER: 'BAC+3' };
            const min = minForFormation[data.niveau_formation];
            const scolaireRank = order[data.niveau_scolaire] ?? -1;
            const minRank = order[min] ?? 0;
            if (min && scolaireRank < minRank) {
                const formationLabels: Record<string, string> = { Q: 'Qualification', T: 'Technicien', TS: 'Technicien Spécialisé', BACHELOR: 'Bachelor', MASTER: 'Master' };
                const minLabels: Record<string, string> = { COLLEGE: 'Collège', BAC: 'Baccalauréat', 'BAC+2': 'Bac+2', 'BAC+3': 'Bac+3' };
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Pour la formation ${formationLabels[data.niveau_formation]}, le niveau scolaire minimum requis est ${minLabels[min] || min}.`, path: ['niveau_scolaire'] });
            }
        }
    }
    if (data.role === 'parent') {
        if (!data.cin) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CIN requis", path: ['cin'] });
        if (!data.phone) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Téléphone requis", path: ['phone'] });
    }
});

type UserFormValues = z.infer<typeof userSchema>;


export { userSchema, type UserFormValues, baseSchema };
