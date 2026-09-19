import config from "../config";
import { redisClient } from "./redis";

const ID_TOKEN_KEY = "bkash:idToken";
const REFRESH_TOKEN_KEY = "bkash:refreshToken";

const ID_TOKEN_TTL = 60 * 60 * 24; // 1 day
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 28; // 28 days

interface IBkashTokenResponse {
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  statusCode?: string;
  statusMessage?: string;
  errorCode?: string;
  errorMessage?: string;
}

const parseBkashResponse = async (
  response: Response,
): Promise<IBkashTokenResponse> => {
  const rawText = await response.text();

  let result: IBkashTokenResponse;

  try {
    result = JSON.parse(rawText);
  } catch {
    throw new Error(
      `Invalid JSON response from bKash: ${JSON.stringify(rawText)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      result.statusMessage ||
        result.errorMessage ||
        `bKash request failed with status ${response.status}`,
    );
  }

  return result;
};

export const getBkashIdToken = async (): Promise<string> => {
  try {
    // ============================================
    // 1. Check ID Token from Redis
    // ============================================

    const cachedIdToken = await redisClient.get(ID_TOKEN_KEY);

    if (cachedIdToken) {
      return cachedIdToken;
    }

    // ============================================
    // 2. Check Refresh Token from Redis
    // ============================================

    const cachedRefreshToken = await redisClient.get(REFRESH_TOKEN_KEY);

    if (cachedRefreshToken) {
      const refreshResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_username,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: cachedRefreshToken,
          }),
        },
      );

      const refreshResult = await parseBkashResponse(refreshResponse);

      // Refresh failed
      if (!refreshResult.id_token) {
        throw new Error(
          refreshResult.statusMessage ||
            refreshResult.errorMessage ||
            "bKash ID token refresh failed",
        );
      }

      // ============================================
      // Save new ID Token - 1 Day
      // ============================================

      await redisClient.set(ID_TOKEN_KEY, refreshResult.id_token, {
        expiration: {
          type: "EX",
          value: ID_TOKEN_TTL,
        },
      });

      // ============================================
      // Save new Refresh Token - 28 Days
      // ============================================

      if (refreshResult.refresh_token) {
        await redisClient.set(REFRESH_TOKEN_KEY, refreshResult.refresh_token, {
          expiration: {
            type: "EX",
            value: REFRESH_TOKEN_TTL,
          },
        });
      }

      return refreshResult.id_token;
    }

    // ============================================
    // 3. No ID Token + No Refresh Token
    //    => Grant New Token
    // ============================================

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    const result = await parseBkashResponse(response);

    if (!result.id_token) {
      throw new Error(
        result.statusMessage ||
          result.errorMessage ||
          "bKash ID token grant failed",
      );
    }

    // ============================================
    // 4. Save ID Token - 1 Day
    // ============================================

    await redisClient.set(ID_TOKEN_KEY, result.id_token, {
      expiration: {
        type: "EX",
        value: ID_TOKEN_TTL,
      },
    });

    // ============================================
    // 5. Save Refresh Token - 28 Days
    // ============================================

    if (result.refresh_token) {
      await redisClient.set(REFRESH_TOKEN_KEY, result.refresh_token, {
        expiration: {
          type: "EX",
          value: REFRESH_TOKEN_TTL,
        },
      });
    }

    return result.id_token;
  } catch (error) {
    console.error("bKash token error:", error);

    throw error;
  }
};
