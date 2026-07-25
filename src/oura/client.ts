import axios, { AxiosInstance, AxiosError } from 'axios';
import { getValidAccessToken } from '../oauth/handler.js';
import { logger } from '../utils/logger.js';
import {
  OuraApiResponse,
  OuraPersonalInfoResponse,
  OuraDailySleepResponse,
  OuraDailyActivityResponse,
  OuraDailyReadinessResponse,
  OuraHeartRateResponse,
  OuraWorkoutResponse,
  OuraSleepResponse,
  OuraTagResponse,
  OuraRingConfigurationResponse,
  OuraDailySpo2Response,
  OuraDailyStressResponse,
  OuraDailyResilienceResponse,
  OuraDailyCardioAgeResponse,
  OuraVO2MaxResponse,
  OuraSessionResponse,
  OuraRestModePeriodResponse,
  OuraSleepTimeResponse,
  OuraEnhancedTagResponse,
  OuraInterbeatIntervalResponse,
  OuraRingBatteryLevelResponse,
} from './types.js';

const OURA_API_BASE_URL = 'https://api.ouraring.com/v2';

// Rate limit tracking
interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

let rateLimitInfo: RateLimitInfo | null = null;

/**
 * Creates an authenticated Oura API client
 */
async function createClient(): Promise<AxiosInstance> {
  const accessToken = await getValidAccessToken();

  const client = axios.create({
    baseURL: OURA_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Add response interceptor to track rate limits
  client.interceptors.response.use(
    (response) => {
      const limit = response.headers['x-ratelimit-limit'];
      const remaining = response.headers['x-ratelimit-remaining'];
      const reset = response.headers['x-ratelimit-reset'];

      if (limit && remaining && reset) {
        rateLimitInfo = {
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          reset: parseInt(reset, 10),
        };

        if (rateLimitInfo.remaining < 100) {
          console.warn(`[OuraClient] Rate limit warning: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} remaining`);
        }
      }

      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 429) {
        logger.error('Rate limit exceeded');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw error;
    }
  );

  return client;
}

/**
 * Gets the current rate limit information
 */
export function getRateLimitInfo(): RateLimitInfo | null {
  return rateLimitInfo;
}

/**
 * Fetches personal information
 */
export async function getPersonalInfo(): Promise<OuraPersonalInfoResponse> {
  const client = await createClient();

  try {
    const response = await client.get<OuraPersonalInfoResponse>('/usercollection/personal_info');
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch personal info:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches daily sleep data
 */
export async function getDailySleep(
  startDate: string,
  endDate?: string
): Promise<OuraDailySleepResponse[]> {
  const client = await createClient();

  try {
    const params: Record<string, string> = { start_date: startDate };
    if (endDate) {
      params.end_date = endDate;
    }

    const response = await client.get<OuraApiResponse<OuraDailySleepResponse>>('/usercollection/daily_sleep', {
      params,
    });

    return response.data.data;
  } catch (error) {
    logger.error('Failed to fetch daily sleep:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches daily activity data
 */
export async function getDailyActivity(
  startDate: string,
  endDate?: string
): Promise<OuraDailyActivityResponse[]> {
  const client = await createClient();

  try {
    const params: Record<string, string> = { start_date: startDate };
    if (endDate) {
      params.end_date = endDate;
    }

    const response = await client.get<OuraApiResponse<OuraDailyActivityResponse>>('/usercollection/daily_activity', {
      params,
    });

    return response.data.data;
  } catch (error) {
    logger.error('Failed to fetch daily activity:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches daily readiness data
 */
export async function getDailyReadiness(
  startDate: string,
  endDate?: string
): Promise<OuraDailyReadinessResponse[]> {
  const client = await createClient();

  try {
    const params: Record<string, string> = { start_date: startDate };
    if (endDate) {
      params.end_date = endDate;
    }

    const response = await client.get<OuraApiResponse<OuraDailyReadinessResponse>>('/usercollection/daily_readiness', {
      params,
    });

    return response.data.data;
  } catch (error) {
    logger.error('Failed to fetch daily readiness:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches heart rate data
 */
export async function getHeartRate(
  startDatetime: string,
  endDatetime?: string
): Promise<OuraHeartRateResponse[]> {
  const client = await createClient();

  try {
    const params: Record<string, string> = { start_datetime: startDatetime };
    if (endDatetime) {
      params.end_datetime = endDatetime;
    }

    const response = await client.get<OuraApiResponse<OuraHeartRateResponse>>('/usercollection/heartrate', {
      params,
    });

    return response.data.data;
  } catch (error) {
    logger.error('Failed to fetch heart rate:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches workout data
 */
export async function getWorkouts(
  startDate: string,
  endDate?: string
): Promise<OuraWorkoutResponse[]> {
  const client = await createClient();

  try {
    const params: Record<string, string> = { start_date: startDate };
    if (endDate) {
      params.end_date = endDate;
    }

    const response = await client.get<OuraApiResponse<OuraWorkoutResponse>>('/usercollection/workout', {
      params,
    });

    return response.data.data;
  } catch (error) {
    logger.error('Failed to fetch workouts:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches sleep period data (detailed)
 */
export async function getSleepPeriods(
  startDate: string,
  endDate?: string
): Promise<OuraSleepResponse[]> {
  const client = await createClient();

  try {
    const params: Record<string, string> = { start_date: startDate };
    if (endDate) {
      params.end_date = endDate;
    }

    const response = await client.get<OuraApiResponse<OuraSleepResponse>>('/usercollection/sleep', {
      params,
    });

    return response.data.data;
  } catch (error) {
    logger.error('Failed to fetch sleep periods:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches tags data
 */
export async function getTags(
  startDate: string,
  endDate?: string
): Promise<OuraTagResponse[]> {
  const client = await createClient();

  try {
    const params: Record<string, string> = { start_date: startDate };
    if (endDate) {
      params.end_date = endDate;
    }

    const response = await client.get<OuraApiResponse<OuraTagResponse>>('/usercollection/tag', {
      params,
    });

    return response.data.data;
  } catch (error) {
    logger.error('Failed to fetch tags:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches ring configuration
 */
export async function getRingConfiguration(): Promise<OuraRingConfigurationResponse[]> {
  const client = await createClient();

  try {
    const response = await client.get<OuraApiResponse<OuraRingConfigurationResponse>>('/usercollection/ring_configuration');
    return response.data.data;
  } catch (error) {
    logger.error('Failed to fetch ring configuration:', error);
    throw handleApiError(error);
  }
}

/**
 * Generic helper to fetch a date-range usercollection endpoint and return all
 * pages flattened. Most v2 collections share the same `start_date`/`end_date`
 * shape and a `next_token`-paginated response.
 */
async function fetchDateRangeCollection<T>(
  endpoint: string,
  startDate: string,
  endDate?: string
): Promise<T[]> {
  const client = await createClient();
  const params: Record<string, string> = { start_date: startDate };
  if (endDate) params.end_date = endDate;

  const out: T[] = [];
  let nextToken: string | undefined;
  // Cap pagination to avoid unbounded loops on broad ranges.
  for (let i = 0; i < 20; i++) {
    if (nextToken) params.next_token = nextToken;
    const response = await client.get<OuraApiResponse<T>>(`/usercollection/${endpoint}`, { params });
    out.push(...response.data.data);
    if (!response.data.next_token) break;
    nextToken = response.data.next_token;
  }
  return out;
}

/**
 * Generic helper for datetime-range collections (heart rate, IBI, battery).
 */
async function fetchDatetimeRangeCollection<T>(
  endpoint: string,
  startDatetime: string,
  endDatetime?: string
): Promise<T[]> {
  const client = await createClient();
  const params: Record<string, string> = { start_datetime: startDatetime };
  if (endDatetime) params.end_datetime = endDatetime;

  const out: T[] = [];
  let nextToken: string | undefined;
  for (let i = 0; i < 20; i++) {
    if (nextToken) params.next_token = nextToken;
    const response = await client.get<OuraApiResponse<T>>(`/usercollection/${endpoint}`, { params });
    out.push(...response.data.data);
    if (!response.data.next_token) break;
    nextToken = response.data.next_token;
  }
  return out;
}

/**
 * Fetches daily SpO2 data
 */
export async function getDailySpo2(
  startDate: string,
  endDate?: string
): Promise<OuraDailySpo2Response[]> {
  try {
    return await fetchDateRangeCollection<OuraDailySpo2Response>('daily_spo2', startDate, endDate);
  } catch (error) {
    logger.error('Failed to fetch daily SpO2:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches daily stress data
 */
export async function getDailyStress(
  startDate: string,
  endDate?: string
): Promise<OuraDailyStressResponse[]> {
  try {
    return await fetchDateRangeCollection<OuraDailyStressResponse>('daily_stress', startDate, endDate);
  } catch (error) {
    logger.error('Failed to fetch daily stress:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches daily resilience data
 */
export async function getDailyResilience(
  startDate: string,
  endDate?: string
): Promise<OuraDailyResilienceResponse[]> {
  try {
    return await fetchDateRangeCollection<OuraDailyResilienceResponse>(
      'daily_resilience',
      startDate,
      endDate
    );
  } catch (error) {
    logger.error('Failed to fetch daily resilience:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches daily cardiovascular age data
 */
export async function getDailyCardiovascularAge(
  startDate: string,
  endDate?: string
): Promise<OuraDailyCardioAgeResponse[]> {
  try {
    return await fetchDateRangeCollection<OuraDailyCardioAgeResponse>(
      'daily_cardiovascular_age',
      startDate,
      endDate
    );
  } catch (error) {
    logger.error('Failed to fetch daily cardiovascular age:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches VO2 max estimates
 */
export async function getVO2Max(
  startDate: string,
  endDate?: string
): Promise<OuraVO2MaxResponse[]> {
  try {
    return await fetchDateRangeCollection<OuraVO2MaxResponse>('vO2_max', startDate, endDate);
  } catch (error) {
    logger.error('Failed to fetch VO2 max:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches sessions (Moments — meditation, breathing, relaxation, etc.)
 */
export async function getSessions(
  startDate: string,
  endDate?: string
): Promise<OuraSessionResponse[]> {
  try {
    return await fetchDateRangeCollection<OuraSessionResponse>('session', startDate, endDate);
  } catch (error) {
    logger.error('Failed to fetch sessions:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches rest mode periods (illness/recovery mode)
 */
export async function getRestModePeriods(
  startDate: string,
  endDate?: string
): Promise<OuraRestModePeriodResponse[]> {
  try {
    return await fetchDateRangeCollection<OuraRestModePeriodResponse>(
      'rest_mode_period',
      startDate,
      endDate
    );
  } catch (error) {
    logger.error('Failed to fetch rest mode periods:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches recommended sleep timing
 */
export async function getSleepTime(
  startDate: string,
  endDate?: string
): Promise<OuraSleepTimeResponse[]> {
  try {
    return await fetchDateRangeCollection<OuraSleepTimeResponse>('sleep_time', startDate, endDate);
  } catch (error) {
    logger.error('Failed to fetch sleep time:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches enhanced tags (newer tag schema with type codes and durations)
 */
export async function getEnhancedTags(
  startDate: string,
  endDate?: string
): Promise<OuraEnhancedTagResponse[]> {
  try {
    return await fetchDateRangeCollection<OuraEnhancedTagResponse>(
      'enhanced_tag',
      startDate,
      endDate
    );
  } catch (error) {
    logger.error('Failed to fetch enhanced tags:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches interbeat interval (IBI) timeseries
 */
export async function getInterbeatInterval(
  startDatetime: string,
  endDatetime?: string
): Promise<OuraInterbeatIntervalResponse[]> {
  try {
    return await fetchDatetimeRangeCollection<OuraInterbeatIntervalResponse>(
      'interbeat_interval',
      startDatetime,
      endDatetime
    );
  } catch (error) {
    logger.error('Failed to fetch interbeat intervals:', error);
    throw handleApiError(error);
  }
}

/**
 * Fetches ring battery level timeseries
 */
export async function getRingBatteryLevel(
  startDatetime: string,
  endDatetime?: string
): Promise<OuraRingBatteryLevelResponse[]> {
  try {
    return await fetchDatetimeRangeCollection<OuraRingBatteryLevelResponse>(
      'ring_battery_level',
      startDatetime,
      endDatetime
    );
  } catch (error) {
    logger.error('Failed to fetch ring battery level:', error);
    throw handleApiError(error);
  }
}

/**
 * Set of usercollection types that support /{document_id} fetches.
 */
export const SINGLE_DOCUMENT_COLLECTIONS = [
  'daily_activity',
  'daily_cardiovascular_age',
  'daily_readiness',
  'daily_resilience',
  'daily_sleep',
  'daily_spo2',
  'daily_stress',
  'enhanced_tag',
  'rest_mode_period',
  'ring_configuration',
  'session',
  'sleep',
  'sleep_time',
  'tag',
  'vO2_max',
  'workout',
] as const;

export type SingleDocumentCollection = (typeof SINGLE_DOCUMENT_COLLECTIONS)[number];

/**
 * Fetches a single document by ID from any supported usercollection.
 */
export async function getDocumentById(
  collection: SingleDocumentCollection,
  documentId: string
): Promise<unknown> {
  const client = await createClient();

  try {
    const response = await client.get(`/usercollection/${collection}/${encodeURIComponent(documentId)}`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch ${collection}/${documentId}:`, error);
    throw handleApiError(error);
  }
}

/**
 * Handles API errors and converts them to user-friendly messages
 */
function handleApiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error?: string; message?: string }>;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const errorMessage = axiosError.response.data?.error || axiosError.response.data?.message;

      switch (status) {
        case 401:
          return new Error('Authentication failed. Please re-authenticate with Oura.');
        case 403:
          return new Error('Access forbidden. Check your OAuth scopes.');
        case 404:
          return new Error('Requested data not found.');
        case 429:
          return new Error('Rate limit exceeded. Please try again later.');
        case 500:
        case 502:
        case 503:
          return new Error('Oura API is temporarily unavailable. Please try again later.');
        default:
          return new Error(errorMessage || `Oura API error: ${status}`);
      }
    }

    if (axiosError.code === 'ECONNABORTED') {
      return new Error('Request timeout. Please try again.');
    }

    if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
      return new Error('Unable to connect to Oura API. Check your internet connection.');
    }

    return new Error(`Network error: ${axiosError.message}`);
  }

  return error instanceof Error ? error : new Error('Unknown error occurred');
}
