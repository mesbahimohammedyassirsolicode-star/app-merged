export interface Administrator {
    id: number;
    poste: string;
    phone?: string;
}

export interface Formateur {
    id: number;
    matricule: string;
    specialty: string;
    type: 'permanent' | 'vacataire';
    hourly_rate?: number;
    filiere_id?: number;
    niveau?: string;
}

export interface Stagiaire {
    id: number;
    filiere_id: number;
    groupe_id?: number;
    cef_number: string;
    date_naissance: string;
    status: 'actif' | 'abandon' | 'exclu' | 'diplome';
    parent_id?: number;
    filiere?: { id: number; code: string; label: string };
    groupe?: { id: number; label: string };
    niveau_formation?: string;
    niveau_scolaire?: string;
}

export interface Parent {
    id: number;
    cin: string;
    phone: string;
    address?: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    // FIXED: Added all backend-supported roles to match EnsureRole::ALLOWED_ROLES
    role: 'admin' | 'directeur' | 'secretariat' | 'teacher' | 'formateur' | 'student' | 'stagiaire' | 'parent';
    avatar_url?: string;
    is_active: boolean;

    // Profiles
    administrator?: Administrator;
    formateur?: Formateur;
    stagiaire?: Stagiaire;
    parent?: Parent; // Note: mapped to studentParent in backend but let's call it parent here

    // Relations that might be loaded
    modules?: { id: number; label: string; code: string }[];
    groups?: { id: number; label: string }[];

    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    role: User['role'];
    user: User;
    roles?: { id: number; name: string; slug: string }[];
    permissions?: string[];
}

export interface LoginCredentials {
    email: string;
    password: string;
}
