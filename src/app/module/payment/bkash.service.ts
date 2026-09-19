import config from "../../config";
import type {
  IBkashCreatePaymentRequest,
  IBkashCreatePaymentResponse,
  IBkashExecutePaymentResponse,
  IBkashGrantTokenResponse,
} from "./payment.interface";

const BASE_URL = config.bkash_base_url;

const APP_KEY = config.bkash_app_key;
const APP_SECRET = config.bkash_app_secret;
const USERNAME = config.bkash_username;
const PASSWORD = config.bkash_password;

if (!BASE_URL) {
  throw new Error("BKASH_BASE_URL is not configured");
}

if (!APP_KEY) {
  throw new Error("BKASH_APP_KEY is not configured");
}

if (!APP_SECRET) {
  throw new Error("BKASH_APP_SECRET is not configured");
}

if (!USERNAME) {
  throw new Error("BKASH_USERNAME is not configured");
}

if (!PASSWORD) {
  throw new Error("BKASH_PASSWORD is not configured");
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

const request = async <T>(url: string, options: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(30_000),
  });

  const text = (await response.text()).replace(/^\uFEFF/, "").trim();
  const contentType = response.headers.get("content-type") || "unknown";

  let data: unknown;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    const message = text.match(/"msg"\s*:\s*"([^"\r\n]+)/)?.[1];

    throw new Error(
      message
        ? `bKash request failed: ${message}`
        : `Invalid response from bKash. HTTP ${response.status}, ` +
            `content-type: ${contentType}, body: ${text.slice(0, 300)}`,
    );
  }

  if (!response.ok) {
    const errorData = data as {
      errorMessage?: string;
      statusMessage?: string;
      message?: string;
      msg?: string;
    };

    throw new Error(
      errorData.errorMessage ||
        errorData.statusMessage ||
        errorData.message ||
        errorData.msg ||
        `bKash request failed with HTTP ${response.status}`,
    );
  }

  return data as T;
};

/**
 * Get bKash Grant Token
 */
const getToken = async (): Promise<string> => {
  const now = Date.now();

  // Reuse cached token
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await request<IBkashGrantTokenResponse>(
    `${BASE_URL}/checkout/token/grant`,
    {
      method: "POST",

      headers: {
        username: USERNAME,
        password: PASSWORD,
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        app_key: APP_KEY,
        app_secret: APP_SECRET,
      }),
    },
  );

  if (!response.id_token) {
    throw new Error(
      response.errorMessage ||
        response.statusMessage ||
        response.msg ||
        "Failed to get bKash token",
    );
  }

  cachedToken = response.id_token;

  /*
   * Keep a small safety margin before expiration.
   */
  const expiresIn =
    typeof response.expires_in === "number" ? response.expires_in : 3600;

  tokenExpiresAt = now + (expiresIn - 60) * 1000;

  return cachedToken;
};

/**
 * Create bKash Payment
 */
const createPayment = async (
  payload: IBkashCreatePaymentRequest,
): Promise<IBkashCreatePaymentResponse> => {
  const token = await getToken();

  return request<IBkashCreatePaymentResponse>(
    `${BASE_URL}/checkout/payment/create`,
    {
      method: "POST",

      headers: {
        Authorization: token,
        "X-APP-Key": APP_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        amount: payload.amount,
        currency: payload.currency,
        intent: payload.intent,
        merchantInvoiceNumber: payload.merchantInvoiceNumber,
        callbackURL: payload.callbackURL,
      }),
    },
  );
};

/**
 * Execute bKash Payment
 */
const executePayment = async (
  paymentID: string,
): Promise<IBkashExecutePaymentResponse> => {
  const token = await getToken();

  return request<IBkashExecutePaymentResponse>(
    `${BASE_URL}/checkout/payment/execute/${paymentID}`,
    {
      method: "POST",

      headers: {
        Authorization: token,
        "X-APP-Key": APP_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({}),
    },
  );
};

export const bkashService = {
  getToken,
  createPayment,
  executePayment,
};
