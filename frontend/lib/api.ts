export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";

export type ApiValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  errors?: ApiValidationErrors;

  constructor(
    message: string,
    status: number,
    errors?: ApiValidationErrors
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const validationErrors = payload?.errors as
      | ApiValidationErrors
      | undefined;

    const firstValidationMessage = validationErrors
      ? Object.values(validationErrors)[0]?.[0]
      : undefined;

    throw new ApiError(
      firstValidationMessage ||
        payload?.message ||
        "حدث خطأ أثناء الاتصال بالخادم",
      response.status,
      validationErrors
    );
  }

  return payload as T;
}