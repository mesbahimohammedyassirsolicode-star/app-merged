/**
 * API v1 response shape: { data?: T, meta?: object, errors?: object }
 * Use this to unwrap list/meta responses.
 */
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  errors?: Record<string, string[]>;
}

export function unwrapData<T>(res: { data?: ApiResponse<T> | T }): T {
  const raw = res.data;
  if (raw == null) throw new Error('Réponse API invalide');
  if (typeof raw === 'object' && 'success' in raw && (raw as ApiResponse<T>).success === false) {
    throw new Error((raw as ApiResponse<T>).message || 'La requete a echoue.');
  }
  if (typeof raw === 'object' && 'data' in raw) {
    const data = (raw as ApiResponse<T>).data;
    if (typeof data === 'undefined') {
      throw new Error((raw as ApiResponse<T>).message || 'Reponse API sans donnees.');
    }
    return data as T;
  }
  return raw as T;
}

export function unwrapMeta<T>(res: { data?: ApiResponse<T> }) {
  return (res.data as ApiResponse<T>)?.meta ?? {};
}
