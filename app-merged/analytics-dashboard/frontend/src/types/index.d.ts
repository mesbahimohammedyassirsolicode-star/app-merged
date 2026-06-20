// This file defines TypeScript types used throughout the frontend application.

export interface Module {
    id: number;
    name: string;
}

export interface Group {
    id: number;
    name: string;
}

export interface Filiere {
    id: number;
    name: string;
}

export interface Semester {
    id: number;
    name: string;
}

export interface AnalyticsFilters {
    moduleId?: number;
    groupId?: number;
    filiereId?: number;
    semesterId?: number;
    dateStart?: Date;
    dateEnd?: Date;
}

export interface AnalyticsData {
    totalNotes: number;
    moyenneGenerale: number;
    tauxDeReussite: number;
    nombreAbsences: number;
}

export interface ChartData {
    labels: string[];
    data: number[];
}