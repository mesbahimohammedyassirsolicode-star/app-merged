import axios from 'axios';

function resolveApiBaseUrl(): string {
    const envApiUrl = import.meta.env.VITE_API_URL;

    if (import.meta.env.DEV === true) {
        const devBase = (envApiUrl || 'http://localhost:8000/api').replace(/\/$/, '');
        return `${devBase}/v1`;
    }

    if (!envApiUrl || !envApiUrl.startsWith('https://')) {
        throw new Error(
            'Invalid VITE_API_URL: production builds require an HTTPS URL (e.g. https://api.example.com/api).'
        );
    }


    return `${envApiUrl.replace(/\/$/, '')}/v1`;
}

const baseURL = resolveApiBaseUrl();

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// FIXED: Token is stored in memory (module-level variable) instead of localStorage.
// localStorage is accessible by any JavaScript on the page (XSS vulnerability).
// Memory storage means the token is lost on page refresh, but AuthContext re-hydrates
// via the /me endpoint on every page load using the existing checkAuth() flow.
let _accessToken: string | null = null;
let _isUnauthorizedLatch = false;
let _onUnauthorizedCallback: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
    _accessToken = token;
    if (token) {
        _isUnauthorizedLatch = false;
    }
}

export function getAccessToken(): string | null {
    return _accessToken;
}

export function registerUnauthorizedHandler(handler: () => void) {
    _onUnauthorizedCallback = handler;
}

// FIXED: Request interceptor reads Bearer token from memory, not localStorage.
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (!config.headers) {
        config.headers = {} as typeof config.headers;
    }
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    } else {
        delete config.headers['Authorization'];
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            setAccessToken(null); // FIXED: clear in-memory token

            const requestUrl = String(error.config?.url ?? '');
            const isAuthEndpoint = ['/login', '/logout'].some((suffix) => requestUrl.endsWith(suffix));

            if (!window.location.pathname.startsWith('/login') && !isAuthEndpoint) {
                if (!_isUnauthorizedLatch) {
                    _isUnauthorizedLatch = true;
                    if (_onUnauthorizedCallback) {
                        _onUnauthorizedCallback();
                    }
                }
                
                // Suspend the promise to prevent React Query from catching the error
                return new Promise(() => {});
            }
        }
        return Promise.reject(error);
    }
);

export default api;
