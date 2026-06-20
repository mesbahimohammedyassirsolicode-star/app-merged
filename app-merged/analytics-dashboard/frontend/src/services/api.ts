import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to fetch analytics data based on filters
export const fetchAnalyticsData = async (filters) => {
    try {
        const response = await apiClient.get('/analytics', { params: filters });
        return response.data;
    } catch (error) {
        throw new Error('Error fetching analytics data: ' + error.message);
    }
};

// Function to fetch modules
export const fetchModules = async () => {
    try {
        const response = await apiClient.get('/modules');
        return response.data;
    } catch (error) {
        throw new Error('Error fetching modules: ' + error.message);
    }
};

// Function to fetch groups
export const fetchGroups = async () => {
    try {
        const response = await apiClient.get('/groups');
        return response.data;
    } catch (error) {
        throw new Error('Error fetching groups: ' + error.message);
    }
};

// Function to fetch filières
export const fetchFilieres = async () => {
    try {
        const response = await apiClient.get('/filieres');
        return response.data;
    } catch (error) {
        throw new Error('Error fetching filières: ' + error.message);
    }
};

// Function to fetch semesters
export const fetchSemesters = async () => {
    try {
        const response = await apiClient.get('/semesters');
        return response.data;
    } catch (error) {
        throw new Error('Error fetching semesters: ' + error.message);
    }
};