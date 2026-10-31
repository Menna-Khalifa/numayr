export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export type ApiValidationErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  errors?: ApiValidationErrors;

  constructor(message: string, status: number, errors?: ApiValidationErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

const fallbackByStatus: Record<number, string> = {
  400: "الطلب غير صالح، يُرجى مراجعة البيانات والمحاولة مرة أخرى",
  401: "انتهت جلسة الدخول، يُرجى تسجيل الدخول مرة أخرى",
  403: "ليس لديك صلاحية لتنفيذ هذا الإجراء",
  404: "العنصر المطلوب غير موجود",
  408: "انتهت مهلة الطلب، يُرجى المحاولة مرة أخرى",
  409: "تعذر إكمال العملية بسبب تعارض في البيانات",
  413: "حجم الملف أكبر من الحد المسموح",
  422: "يُرجى مراجعة البيانات المدخلة",
  429: "تم تجاوز عدد المحاولات المسموح، يُرجى المحاولة لاحقًا",
  500: "حدث خطأ في الخادم، يُرجى المحاولة لاحقًا",
  502: "الخدمة غير متاحة مؤقتًا، يُرجى المحاولة لاحقًا",
  503: "الخدمة غير متاحة مؤقتًا، يُرجى المحاولة لاحقًا",
  504: "انتهت مهلة الاتصال بالخادم، يُرجى المحاولة مرة أخرى",
};

function arabicMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const message = value.trim();
  return /[\u0600-\u06FF]/u.test(message) ? message : undefined;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  // Browsers must set multipart/form-data boundaries automatically.
  if (rest.body instanceof FormData) {
    requestHeaders.delete("Content-Type");
  } else if (rest.body != null && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiError(
      "تعذر الاتصال بالخادم، تأكد من اتصال الإنترنت وحاول مرة أخرى",
      0
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = payload && typeof payload === "object"
      ? payload as Record<string, unknown>
      : {};
    const errors = body.errors && typeof body.errors === "object" && !Array.isArray(body.errors)
      ? body.errors as Record<string, unknown>
      : undefined;
    const safeErrors: ApiValidationErrors = {};
    if (errors) {
      for (const [field, messages] of Object.entries(errors)) {
        if (Array.isArray(messages)) {
          const arabic = messages.map(arabicMessage).filter((message): message is string => Boolean(message));
          if (arabic.length) safeErrors[field] = arabic;
        }
      }
    }

    const firstMessage = Object.values(safeErrors)[0]?.[0];
    throw new ApiError(
      firstMessage ??
        arabicMessage(body.message) ??
        fallbackByStatus[response.status] ??
        "تعذر إكمال الطلب، يُرجى المحاولة مرة أخرى",
      response.status,
      Object.keys(safeErrors).length ? safeErrors : undefined
    );
  }

  // Treat unexpected non-JSON responses as errors instead of passing null to UI.
  if (payload === null && response.status !== 204) {
    throw new ApiError(
      "استجاب الخادم بشكل غير متوقع، يُرجى المحاولة مرة أخرى",
      response.status
    );
  }

  return payload as T;
}
