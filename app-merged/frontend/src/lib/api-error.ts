type LaravelErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const responseData = (error.response as { data?: LaravelErrorPayload }).data;
    const validationErrors = responseData?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const firstKey = Object.keys(validationErrors)[0];
      const firstLine = firstKey ? validationErrors[firstKey]?.[0] : undefined;
      if (firstLine) {
        return firstLine;
      }
    }
    if (responseData?.message) {
      return responseData.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
