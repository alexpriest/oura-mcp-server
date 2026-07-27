import {
  getPersonalInfo,
  getDailySleep,
  getDailyActivity,
  getDailyReadiness,
  getHeartRate,
  getWorkouts,
  getSleepPeriods,
  getTags,
  getDailySpo2,
  getDailyStress,
  getDailyResilience,
  getDailyCardiovascularAge,
  getVO2Max,
  getSessions,
  getRestModePeriods,
  getSleepTime,
  getEnhancedTags,
  getInterbeatInterval,
  getRingBatteryLevel,
  getRingConfiguration,
  getDocumentById,
  SINGLE_DOCUMENT_COLLECTIONS,
  type SingleDocumentCollection,
} from '../oura/client.js';
import {
  validateParams,
  dateRangeSchema,
  sleepSummarySchema,
  datetimeRangeSchema,
  healthInsightsSchema,
  getTodayDate,
  getDaysAgo,
} from '../utils/validation.js';
import cache from '../utils/cache.js';
import { MCPTool, MCPToolCall, MCPResponse, OuraSleepResponse } from '../oura/types.js';
import { logger } from '../utils/logger.js';

/**
 * List of all available MCP tools
 */
export const tools: MCPTool[] = [
  {
    name: 'get_personal_info',
    description: "Get user's personal information and ring details",
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_sleep_summary',
    description:
      'Get sleep data for a date range. Durations are in seconds and come from measured sleep periods; ' +
      'null means no sleep period was recorded that day. `contributor_scores` are Oura sub-scores (0-100), not measurements.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional, defaults to today)',
        },
        include_hrv: {
          type: 'boolean',
          description: 'Include average HRV and heart-rate values from the main sleep period (default: false)',
        },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_readiness_score',
    description: 'Get daily readiness scores',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_activity_summary',
    description: 'Get activity data for a date range',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_heart_rate',
    description: 'Get heart rate data (5-minute intervals)',
    inputSchema: {
      type: 'object',
      properties: {
        start_datetime: {
          type: 'string',
          description: 'Start datetime in ISO 8601 format',
        },
        end_datetime: {
          type: 'string',
          description: 'End datetime in ISO 8601 format (optional, defaults to now)',
        },
      },
      required: ['start_datetime'],
    },
  },
  {
    name: 'get_workouts',
    description: 'Get workout sessions',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_sleep_detailed',
    description: 'Get detailed sleep period data (multiple sleep sessions per day)',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_tags',
    description: 'Get user-created tags (notes/comments on specific days)',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_health_insights',
    description: 'Get AI-powered insights based on recent data',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to analyze (default: 7)',
        },
      },
    },
  },
  {
    name: 'get_daily_spo2',
    description:
      'Get daily SpO2 (blood oxygen saturation) summaries — average percentage and Breathing Disturbance Index (BDI) per day. Requires a Gen3+ ring with SpO2 sensing and overnight wear. Date params in YYYY-MM-DD.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_daily_stress',
    description:
      'Get daily stress data — time spent in high stress vs. high recovery zones (in seconds) and a categorical day summary (restored/normal/stressful). Date params in YYYY-MM-DD.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_daily_resilience',
    description:
      'Get daily resilience data — long-term recovery capacity rated limited/adequate/solid/strong/exceptional, plus contributors (sleep_recovery, daytime_recovery, stress). Requires several weeks of ring history; expect empty arrays for new users.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_daily_cardiovascular_age',
    description:
      'Get predicted vascular age (integer 18–100) per day. Oura derives this from long-term cardiovascular signals; requires significant ring history and may be null for recent days.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_vo2_max',
    description:
      'Get VO2 max estimates — cardiorespiratory fitness in ml/kg/min, with per-estimate timestamp. Estimates are produced occasionally; expect sparse data, not one per day.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_sessions',
    description:
      'Get Moments / sessions — user-logged or detected breathing, meditation, nap, relaxation, rest, or body_status sessions with timestamps, optional mood, and HR/HRV/motion samples.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_rest_mode_periods',
    description:
      'Get Rest Mode periods — user-activated rest/illness mode windows with start/end days, optional end if still active, and tagged episodes during the period.',
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_sleep_time',
    description:
      "Get Oura's recommended bedtime window per day, plus a recommendation enum (earlier_bedtime, later_bedtime, follow_optimal_bedtime, etc.) and status (optimal_found, not_enough_nights, etc.). Bedtime windows are seconds-from-midnight with timezone offset.",
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_enhanced_tags',
    description:
      "Get Enhanced Tags — the newer tag schema with tag_type_code (e.g. an Oura-defined code or 'custom'), optional duration (start_time/end_time, start_day/end_day), comment, and custom_name. Use this in addition to or instead of the legacy get_tags.",
    inputSchema: {
      type: 'object',
      properties: {
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format (optional, defaults to today)' },
      },
      required: ['start_date'],
    },
  },
  {
    name: 'get_interbeat_interval',
    description:
      'Get interbeat interval (IBI) timeseries — discrete beat-to-beat intervals in milliseconds with validity classification (1=Good, 2=Bad, 3=Corrected, -1/-2=Gap, 0=Raw). Datetime params in ISO 8601. Volume is high; keep ranges short.',
    inputSchema: {
      type: 'object',
      properties: {
        start_datetime: { type: 'string', description: 'Start datetime in ISO 8601 format' },
        end_datetime: { type: 'string', description: 'End datetime in ISO 8601 format (optional, defaults to now)' },
      },
      required: ['start_datetime'],
    },
  },
  {
    name: 'get_ring_battery_level',
    description:
      'Get ring battery level timeseries — discrete samples with battery percentage (0–100), charging flag, and in_charger flag. Datetime params in ISO 8601.',
    inputSchema: {
      type: 'object',
      properties: {
        start_datetime: { type: 'string', description: 'Start datetime in ISO 8601 format' },
        end_datetime: { type: 'string', description: 'End datetime in ISO 8601 format (optional, defaults to now)' },
      },
      required: ['start_datetime'],
    },
  },
  {
    name: 'get_ring_configuration',
    description:
      'Get ring configuration — color, design, hardware_type (gen1–gen4), firmware_version, size, and set_up_at timestamp. No date params; returns all rings the user has registered.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_document',
    description:
      `Fetch a single document by ID from any Oura usercollection. Useful when another tool returned a document ID and you want the full record. Supported collections: ${SINGLE_DOCUMENT_COLLECTIONS.join(', ')}.`,
    inputSchema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'Collection name (e.g. daily_sleep, sleep, workout, session, vO2_max)',
          enum: [...SINGLE_DOCUMENT_COLLECTIONS],
        },
        document_id: {
          type: 'string',
          description: 'Document ID returned by a previous list call',
        },
      },
      required: ['collection', 'document_id'],
    },
  },
];

/**
 * Executes a tool call and returns the result
 */
export async function executeToolCall(toolCall: MCPToolCall): Promise<MCPResponse> {
  const { name, arguments: args } = toolCall;

  logger.info(`Tool: ${name}`);
  logger.debug(`Tool args:`, args);

  try {
    let result: string;

    switch (name) {
      case 'get_personal_info':
        result = await handleGetPersonalInfo();
        break;
      case 'get_sleep_summary':
        result = await handleGetSleepSummary(args);
        break;
      case 'get_readiness_score':
        result = await handleGetReadinessScore(args);
        break;
      case 'get_activity_summary':
        result = await handleGetActivitySummary(args);
        break;
      case 'get_heart_rate':
        result = await handleGetHeartRate(args);
        break;
      case 'get_workouts':
        result = await handleGetWorkouts(args);
        break;
      case 'get_sleep_detailed':
        result = await handleGetSleepDetailed(args);
        break;
      case 'get_tags':
        result = await handleGetTags(args);
        break;
      case 'get_health_insights':
        result = await handleGetHealthInsights(args);
        break;
      case 'get_daily_spo2':
        result = await handleGetDailySpo2(args);
        break;
      case 'get_daily_stress':
        result = await handleGetDailyStress(args);
        break;
      case 'get_daily_resilience':
        result = await handleGetDailyResilience(args);
        break;
      case 'get_daily_cardiovascular_age':
        result = await handleGetDailyCardiovascularAge(args);
        break;
      case 'get_vo2_max':
        result = await handleGetVO2Max(args);
        break;
      case 'get_sessions':
        result = await handleGetSessions(args);
        break;
      case 'get_rest_mode_periods':
        result = await handleGetRestModePeriods(args);
        break;
      case 'get_sleep_time':
        result = await handleGetSleepTime(args);
        break;
      case 'get_enhanced_tags':
        result = await handleGetEnhancedTags(args);
        break;
      case 'get_interbeat_interval':
        result = await handleGetInterbeatInterval(args);
        break;
      case 'get_ring_battery_level':
        result = await handleGetRingBatteryLevel(args);
        break;
      case 'get_ring_configuration':
        result = await handleGetRingConfiguration();
        break;
      case 'get_document':
        result = await handleGetDocument(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    logger.error(`Error executing tool ${name}:`, error);
    throw error;
  }
}

/**
 * Handler for get_personal_info tool
 */
async function handleGetPersonalInfo(): Promise<string> {
  const cacheKey = 'personal_info';
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getPersonalInfo();

  const result = JSON.stringify(
    {
      age: data.age,
      weight: data.weight,
      height: data.height,
      biological_sex: data.biological_sex,
      email: data.email,
    },
    null,
    2
  );

  cache.set(cacheKey, result, 3600000); // Cache for 1 hour
  return result;
}

interface MeasuredSleepDay {
  totalSleep: number;
  timeInBed: number;
  deep: number;
  light: number;
  rem: number;
  awake: number;
  efficiency: number | null;
  latency: number | null;
  bedtimeStart: string | null;
  bedtimeEnd: string | null;
  averageHrv: number | null;
  averageHeartRate: number | null;
  lowestHeartRate: number | null;
  periods: number;
}

/**
 * Collapses Oura sleep periods into one measured record per day.
 *
 * A day can hold several periods (a split night, a nap). Durations sum across
 * them; latency, bedtimes and the heart metrics are taken from the main sleep
 * period, since summing those would be meaningless. `rest` and `deleted`
 * periods carry no sleep and are dropped.
 */
function groupSleepPeriodsByDay(periods: OuraSleepResponse[]): Map<string, MeasuredSleepDay> {
  const byDay = new Map<string, OuraSleepResponse[]>();

  for (const period of periods) {
    if (period.type === 'deleted' || period.type === 'rest') continue;
    if (!period.total_sleep_duration) continue;
    const existing = byDay.get(period.day);
    if (existing) {
      existing.push(period);
    } else {
      byDay.set(period.day, [period]);
    }
  }

  const measured = new Map<string, MeasuredSleepDay>();

  for (const [day, dayPeriods] of byDay) {
    const sum = (pick: (period: OuraSleepResponse) => number | undefined | null): number =>
      dayPeriods.reduce((acc, period) => acc + (pick(period) ?? 0), 0);

    const main = dayPeriods.reduce((longest, period) =>
      period.total_sleep_duration > longest.total_sleep_duration ? period : longest
    );

    const totalSleep = sum((period) => period.total_sleep_duration);
    const timeInBed = sum((period) => period.time_in_bed);

    measured.set(day, {
      totalSleep,
      timeInBed,
      deep: sum((period) => period.deep_sleep_duration),
      light: sum((period) => period.light_sleep_duration),
      rem: sum((period) => period.rem_sleep_duration),
      awake: sum((period) => period.awake_time),
      efficiency: timeInBed > 0 ? Math.round((totalSleep / timeInBed) * 1000) / 10 : null,
      latency: main.latency ?? null,
      bedtimeStart: main.bedtime_start ?? null,
      bedtimeEnd: main.bedtime_end ?? null,
      averageHrv: main.average_hrv ?? null,
      averageHeartRate: main.average_heart_rate ?? null,
      lowestHeartRate: main.lowest_heart_rate ?? null,
      periods: dayPeriods.length,
    });
  }

  return measured;
}

/**
 * Handler for get_sleep_summary tool
 */
async function handleGetSleepSummary(args: any): Promise<string> {
  const params = validateParams<{ start_date: string; end_date?: string; include_hrv?: boolean }>(sleepSummarySchema, args);
  const { start_date, end_date, include_hrv } = params;

  const cacheKey = `sleep_summary:${start_date}:${end_date || 'today'}:${include_hrv || false}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const resolvedEnd = end_date || getTodayDate();

  // Durations, efficiency and latency are only available on the sleep-period
  // endpoint. The daily_sleep endpoint carries the score and its contributors,
  // which are 0-100 sub-scores — NOT measurements. Join the two.
  const [data, periods] = await Promise.all([
    getDailySleep(start_date, resolvedEnd),
    getSleepPeriods(start_date, resolvedEnd),
  ]);

  const periodsByDay = groupSleepPeriodsByDay(periods);

  const mapped = data.map((item) => {
    const measured = periodsByDay.get(item.day) ?? null;

    return {
      date: item.day,
      score: item.score,
      // Measured values (seconds). Null when no sleep period was recorded for
      // the day — never synthesised from the contributor scores.
      total_sleep_duration: measured ? measured.totalSleep : null,
      time_in_bed: measured ? measured.timeInBed : null,
      efficiency: measured ? measured.efficiency : null,
      latency: measured ? measured.latency : null,
      deep_sleep_duration: measured ? measured.deep : null,
      light_sleep_duration: measured ? measured.light : null,
      rem_sleep_duration: measured ? measured.rem : null,
      awake_time: measured ? measured.awake : null,
      bedtime_start: measured ? measured.bedtimeStart : null,
      bedtime_end: measured ? measured.bedtimeEnd : null,
      // Oura sub-scores, 0-100. Kept under their own key so they can never be
      // mistaken for measurements again.
      contributor_scores: {
        total_sleep: item.contributors.total_sleep,
        efficiency: item.contributors.efficiency,
        latency: item.contributors.latency,
        deep_sleep: item.contributors.deep_sleep,
        rem_sleep: item.contributors.rem_sleep,
        restfulness: item.contributors.restfulness,
        timing: item.contributors.timing,
      },
      restfulness: item.contributors.restfulness,
      timing: item.contributors.timing,
      ...(include_hrv && {
        average_hrv: measured ? measured.averageHrv : null,
        average_heart_rate: measured ? measured.averageHeartRate : null,
        lowest_heart_rate: measured ? measured.lowestHeartRate : null,
      }),
    };
  });

  const average = (values: (number | null)[]): number | null => {
    const present = values.filter((value): value is number => value !== null);
    return present.length ? present.reduce((acc, value) => acc + value, 0) / present.length : null;
  };

  const summary = {
    average_score: average(mapped.map((item) => item.score)),
    average_duration: average(mapped.map((item) => item.total_sleep_duration)),
    average_efficiency: average(mapped.map((item) => item.efficiency)),
    average_latency: average(mapped.map((item) => item.latency)),
    total_days: mapped.length,
    days_missing_sleep_periods: mapped.filter((item) => item.total_sleep_duration === null).length,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_readiness_score tool
 */
async function handleGetReadinessScore(args: any): Promise<string> {
  const params = validateParams<{ start_date: string; end_date?: string }>(dateRangeSchema, args);
  const { start_date, end_date } = params;

  const cacheKey = `readiness:${start_date}:${end_date || 'today'}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getDailyReadiness(start_date, end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.day,
    score: item.score,
    temperature_deviation: item.temperature_deviation,
    temperature_trend_deviation: item.temperature_trend_deviation,
    activity_balance: item.contributors.activity_balance,
    body_temperature: item.contributors.body_temperature,
    hrv_balance: item.contributors.hrv_balance,
    previous_day_activity: item.contributors.previous_day_activity,
    previous_night: item.contributors.previous_night,
    recovery_index: item.contributors.recovery_index,
    resting_heart_rate: item.contributors.resting_heart_rate,
    sleep_balance: item.contributors.sleep_balance,
  }));

  const avgScore = mapped.reduce((acc, item) => acc + item.score, 0) / mapped.length;
  const firstScore = mapped[0]?.score || 0;
  const lastScore = mapped[mapped.length - 1]?.score || 0;
  const trend = lastScore > firstScore + 5 ? 'improving' : lastScore < firstScore - 5 ? 'declining' : 'stable';

  const summary = {
    average_score: avgScore,
    trend,
    total_days: mapped.length,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_activity_summary tool
 */
async function handleGetActivitySummary(args: any): Promise<string> {
  const params = validateParams<{ start_date: string; end_date?: string }>(dateRangeSchema, args);
  const { start_date, end_date } = params;

  const cacheKey = `activity:${start_date}:${end_date || 'today'}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getDailyActivity(start_date, end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.day,
    score: item.score,
    active_calories: item.active_calories,
    total_calories: item.total_calories,
    steps: item.steps,
    equivalent_walking_distance: item.equivalent_walking_distance,
    high_activity_time: item.high_activity_time,
    medium_activity_time: item.medium_activity_time,
    low_activity_time: item.low_activity_time,
    sedentary_time: item.sedentary_time,
    resting_time: item.resting_time,
    average_met: item.average_met_minutes,
    inactivity_alerts: item.inactivity_alerts,
    target_calories: item.target_calories,
    target_meters: item.target_meters,
    meet_daily_targets: item.contributors.meet_daily_targets,
  }));

  const summary = {
    average_score: mapped.reduce((acc, item) => acc + item.score, 0) / mapped.length,
    total_steps: mapped.reduce((acc, item) => acc + item.steps, 0),
    total_calories: mapped.reduce((acc, item) => acc + item.total_calories, 0),
    average_steps_per_day: mapped.reduce((acc, item) => acc + item.steps, 0) / mapped.length,
    total_days: mapped.length,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_heart_rate tool
 */
async function handleGetHeartRate(args: any): Promise<string> {
  const params = validateParams<{ start_datetime: string; end_datetime?: string }>(datetimeRangeSchema, args);
  const { start_datetime, end_datetime } = params;

  const cacheKey = `heart_rate:${start_datetime}:${end_datetime || 'now'}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getHeartRate(start_datetime, end_datetime);

  const mapped = data.map((item) => ({
    timestamp: item.timestamp,
    bpm: item.bpm,
    source: item.source,
  }));

  const bpms = mapped.map((item) => item.bpm);
  const summary = {
    average_bpm: bpms.reduce((acc, bpm) => acc + bpm, 0) / bpms.length,
    min_bpm: Math.min(...bpms),
    max_bpm: Math.max(...bpms),
    resting_hr: Math.min(...bpms.slice(0, 10)), // Approximate
    total_readings: mapped.length,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_workouts tool
 */
async function handleGetWorkouts(args: any): Promise<string> {
  const params = validateParams<{ start_date: string; end_date?: string }>(dateRangeSchema, args);
  const { start_date, end_date } = params;

  const cacheKey = `workouts:${start_date}:${end_date || 'today'}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getWorkouts(start_date, end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.day,
    activity: item.activity,
    intensity: item.intensity,
    start_datetime: item.start_datetime,
    end_datetime: item.end_datetime,
    calories: item.calories,
    distance: item.distance,
    average_heart_rate: 0, // Not directly available
    max_heart_rate: 0, // Not directly available
  }));

  const activities = [...new Set(mapped.map((item) => item.activity))];
  const summary = {
    total_workouts: mapped.length,
    total_calories: mapped.reduce((acc, item) => acc + item.calories, 0),
    total_duration: mapped.reduce((acc, item) => {
      const start = new Date(item.start_datetime);
      const end = new Date(item.end_datetime);
      return acc + (end.getTime() - start.getTime()) / 1000;
    }, 0),
    activities,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_sleep_detailed tool
 */
async function handleGetSleepDetailed(args: any): Promise<string> {
  const params = validateParams<{ start_date: string; end_date?: string }>(dateRangeSchema, args);
  const { start_date, end_date } = params;

  const cacheKey = `sleep_detailed:${start_date}:${end_date || 'today'}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getSleepPeriods(start_date, end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.day,
    type: item.type,
    bedtime_start: item.bedtime_start,
    bedtime_end: item.bedtime_end,
    // Durations in seconds, straight from the API.
    total_sleep_duration: item.total_sleep_duration,
    time_in_bed: item.time_in_bed,
    deep_sleep_duration: item.deep_sleep_duration,
    light_sleep_duration: item.light_sleep_duration,
    rem_sleep_duration: item.rem_sleep_duration,
    awake_time: item.awake_time,
    latency: item.latency,
    efficiency: item.efficiency,
    restless_periods: item.restless_periods,
    breath_average: item.average_breath,
    heart_rate: {
      interval: item.heart_rate.interval,
      samples: item.heart_rate.items,
      average: item.average_heart_rate,
      lowest: item.lowest_heart_rate,
    },
    hrv: {
      samples: item.hrv.items,
      average: item.average_hrv,
    },
    movement_30_sec: item.movement_30_sec,
    sleep_phase_5_min: item.sleep_phase_5_min,
  }));

  const result = JSON.stringify({ data: mapped }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_tags tool
 */
async function handleGetTags(args: any): Promise<string> {
  const params = validateParams<{ start_date: string; end_date?: string }>(dateRangeSchema, args);
  const { start_date, end_date } = params;

  const cacheKey = `tags:${start_date}:${end_date || 'today'}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getTags(start_date, end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.timestamp,
    day: item.day,
    text: item.text,
    timestamp: item.timestamp,
    tags: item.tags,
  }));

  const result = JSON.stringify({ data: mapped }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_health_insights tool
 */
async function handleGetHealthInsights(args: any): Promise<string> {
  const params = validateParams<{ days?: number }>(healthInsightsSchema, args);
  const days = params.days || 7;

  const endDate = getTodayDate();
  const startDate = getDaysAgo(days);

  // Fetch recent data
  const [sleepData, activityData, readinessData] = await Promise.all([
    getDailySleep(startDate, endDate),
    getDailyActivity(startDate, endDate),
    getDailyReadiness(startDate, endDate),
  ]);

  // Generate insights
  const insights = [];

  // Sleep insights
  const avgSleepScore = sleepData.reduce((acc, item) => acc + item.score, 0) / sleepData.length;
  if (avgSleepScore < 70) {
    insights.push({
      category: 'sleep',
      finding: `Your average sleep score is ${avgSleepScore.toFixed(0)}, which is below optimal levels.`,
      recommendation: 'Try to maintain a consistent sleep schedule and aim for 7-9 hours of sleep per night.',
      priority: 'high',
    });
  }

  // Activity insights
  const avgSteps = activityData.reduce((acc, item) => acc + item.steps, 0) / activityData.length;
  if (avgSteps < 7000) {
    insights.push({
      category: 'activity',
      finding: `Your average daily steps (${avgSteps.toFixed(0)}) are below the recommended 7,000-10,000 steps.`,
      recommendation: 'Consider taking short walks throughout the day to increase your activity level.',
      priority: 'medium',
    });
  }

  // Readiness insights
  const avgReadiness = readinessData.reduce((acc, item) => acc + item.score, 0) / readinessData.length;
  if (avgReadiness < 70) {
    insights.push({
      category: 'readiness',
      finding: `Your average readiness score is ${avgReadiness.toFixed(0)}, indicating suboptimal recovery.`,
      recommendation: 'Focus on recovery strategies like adequate sleep, stress management, and proper nutrition.',
      priority: 'high',
    });
  }

  // Determine trends
  const sleepTrend = sleepData[0]?.score > sleepData[sleepData.length - 1]?.score ? 'declining' : 'improving';
  const activityTrend = activityData[0]?.score > activityData[activityData.length - 1]?.score ? 'declining' : 'improving';
  const readinessTrend = readinessData[0]?.score > readinessData[readinessData.length - 1]?.score ? 'declining' : 'improving';

  const result = JSON.stringify(
    {
      period: {
        start_date: startDate,
        end_date: endDate,
      },
      insights,
      trends: {
        sleep: sleepTrend,
        activity: activityTrend,
        readiness: readinessTrend,
      },
    },
    null,
    2
  );

  return result;
}

// -- New tool handlers --------------------------------------------------------

type DateRangeArgs = { start_date: string; end_date?: string };
type DatetimeRangeArgs = { start_datetime: string; end_datetime?: string };

function summarizeDateRangeCache(prefix: string, p: DateRangeArgs): string {
  return `${prefix}:${p.start_date}:${p.end_date || 'today'}`;
}

function summarizeDatetimeRangeCache(prefix: string, p: DatetimeRangeArgs): string {
  return `${prefix}:${p.start_datetime}:${p.end_datetime || 'now'}`;
}

/**
 * Handler for get_daily_spo2
 */
async function handleGetDailySpo2(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('daily_spo2', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getDailySpo2(params.start_date, params.end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.day,
    average_spo2_percent: item.spo2_percentage?.average ?? null,
    breathing_disturbance_index: item.breathing_disturbance_index ?? null,
  }));

  const withValues = mapped.filter((d) => d.average_spo2_percent !== null);
  const summary = {
    total_days: mapped.length,
    days_with_data: withValues.length,
    average_spo2_percent:
      withValues.length > 0
        ? withValues.reduce((acc, d) => acc + (d.average_spo2_percent as number), 0) / withValues.length
        : null,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_daily_stress
 */
async function handleGetDailyStress(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('daily_stress', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getDailyStress(params.start_date, params.end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.day,
    day_summary: item.day_summary,
    stress_high_seconds: item.stress_high,
    recovery_high_seconds: item.recovery_high,
  }));

  const summary = {
    total_days: mapped.length,
    avg_stress_high_seconds:
      mapped.length > 0
        ? mapped.reduce((a, d) => a + (d.stress_high_seconds || 0), 0) / mapped.length
        : 0,
    avg_recovery_high_seconds:
      mapped.length > 0
        ? mapped.reduce((a, d) => a + (d.recovery_high_seconds || 0), 0) / mapped.length
        : 0,
    summary_counts: mapped.reduce<Record<string, number>>((acc, d) => {
      const key = d.day_summary || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_daily_resilience
 */
async function handleGetDailyResilience(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('daily_resilience', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getDailyResilience(params.start_date, params.end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.day,
    level: item.level,
    sleep_recovery: item.contributors.sleep_recovery,
    daytime_recovery: item.contributors.daytime_recovery,
    stress: item.contributors.stress,
  }));

  const levelCounts = mapped.reduce<Record<string, number>>((acc, d) => {
    acc[d.level] = (acc[d.level] || 0) + 1;
    return acc;
  }, {});

  const summary = {
    total_days: mapped.length,
    level_counts: levelCounts,
    note:
      mapped.length === 0
        ? 'No resilience data — Oura needs several weeks of ring history before producing resilience scores.'
        : undefined,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_daily_cardiovascular_age
 */
async function handleGetDailyCardiovascularAge(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('daily_cardio_age', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getDailyCardiovascularAge(
    params.start_date,
    params.end_date || getTodayDate()
  );

  const mapped = data.map((item) => ({
    date: item.day,
    vascular_age: item.vascular_age,
  }));

  const withValues = mapped.filter((d) => d.vascular_age !== null);
  const summary = {
    total_days: mapped.length,
    days_with_prediction: withValues.length,
    average_vascular_age:
      withValues.length > 0
        ? withValues.reduce((a, d) => a + (d.vascular_age as number), 0) / withValues.length
        : null,
    note:
      withValues.length === 0
        ? 'No cardiovascular age predictions available — Oura needs significant ring history to produce these.'
        : undefined,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_vo2_max
 */
async function handleGetVO2Max(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('vo2_max', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getVO2Max(params.start_date, params.end_date || getTodayDate());

  const mapped = data.map((item) => ({
    date: item.day,
    timestamp: item.timestamp,
    vo2_max: item.vo2_max,
  }));

  const summary = {
    total_estimates: mapped.length,
    average_vo2_max:
      mapped.length > 0 ? mapped.reduce((a, d) => a + d.vo2_max, 0) / mapped.length : null,
    latest: mapped[mapped.length - 1] || null,
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_sessions
 */
async function handleGetSessions(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('sessions', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getSessions(params.start_date, params.end_date || getTodayDate());

  const mapped = data.map((item) => {
    const start = new Date(item.start_datetime);
    const end = new Date(item.end_datetime);
    const duration_seconds = Math.round((end.getTime() - start.getTime()) / 1000);

    const summarizeSamples = (s: typeof item.heart_rate) => {
      if (!s || !s.items || s.items.length === 0) return null;
      const numeric = s.items.filter((v): v is number => typeof v === 'number');
      if (numeric.length === 0) return { sample_count: s.items.length, average: null };
      return {
        interval_seconds: s.interval,
        sample_count: s.items.length,
        average: numeric.reduce((a, b) => a + b, 0) / numeric.length,
        min: Math.min(...numeric),
        max: Math.max(...numeric),
      };
    };

    return {
      id: item.id,
      date: item.day,
      type: item.type,
      mood: item.mood ?? null,
      start_datetime: item.start_datetime,
      end_datetime: item.end_datetime,
      duration_seconds,
      heart_rate: summarizeSamples(item.heart_rate ?? null),
      heart_rate_variability: summarizeSamples(item.heart_rate_variability ?? null),
      motion_count: summarizeSamples(item.motion_count ?? null),
    };
  });

  const typeCounts = mapped.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {});

  const summary = {
    total_sessions: mapped.length,
    type_counts: typeCounts,
    total_duration_seconds: mapped.reduce((a, d) => a + d.duration_seconds, 0),
  };

  const result = JSON.stringify({ data: mapped, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_rest_mode_periods
 */
async function handleGetRestModePeriods(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('rest_mode', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getRestModePeriods(params.start_date, params.end_date || getTodayDate());

  const mapped = data.map((item) => ({
    id: item.id,
    start_day: item.start_day,
    end_day: item.end_day,
    start_time: item.start_time,
    end_time: item.end_time,
    is_active: item.end_day === null,
    episode_count: item.episodes.length,
    episodes: item.episodes,
  }));

  const result = JSON.stringify(
    {
      data: mapped,
      summary: {
        total_periods: mapped.length,
        active_periods: mapped.filter((p) => p.is_active).length,
      },
    },
    null,
    2
  );
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_sleep_time
 */
async function handleGetSleepTime(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('sleep_time', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getSleepTime(params.start_date, params.end_date || getTodayDate());

  const formatOffset = (seconds: number): string => {
    const total = ((seconds % 86400) + 86400) % 86400;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const mapped = data.map((item) => ({
    date: item.day,
    recommendation: item.recommendation,
    status: item.status,
    optimal_bedtime: item.optimal_bedtime
      ? {
          start_local: formatOffset(item.optimal_bedtime.start_offset),
          end_local: formatOffset(item.optimal_bedtime.end_offset),
          timezone_offset_seconds: item.optimal_bedtime.day_tz,
        }
      : null,
  }));

  const result = JSON.stringify({ data: mapped, summary: { total_days: mapped.length } }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_enhanced_tags
 */
async function handleGetEnhancedTags(args: any): Promise<string> {
  const params = validateParams<DateRangeArgs>(dateRangeSchema, args);
  const cacheKey = summarizeDateRangeCache('enhanced_tag', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getEnhancedTags(params.start_date, params.end_date || getTodayDate());

  const mapped = data.map((item) => ({
    id: item.id,
    tag_type_code: item.tag_type_code,
    custom_name: item.custom_name,
    comment: item.comment,
    start_day: item.start_day,
    end_day: item.end_day,
    start_time: item.start_time,
    end_time: item.end_time,
    has_duration: !!item.end_time,
  }));

  const result = JSON.stringify({ data: mapped, summary: { total_tags: mapped.length } }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_interbeat_interval
 *
 * IBI is high-volume timeseries; we summarize aggressively and only include
 * a sampled subset of raw points to keep response size reasonable.
 */
async function handleGetInterbeatInterval(args: any): Promise<string> {
  const params = validateParams<DatetimeRangeArgs>(datetimeRangeSchema, args);
  const cacheKey = summarizeDatetimeRangeCache('ibi', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getInterbeatInterval(params.start_datetime, params.end_datetime);

  const goodIBIs = data.filter((d) => d.validity === 1 || d.validity === 3).map((d) => d.ibi);
  const validityCounts = data.reduce<Record<string, number>>((acc, d) => {
    const key = String(d.validity);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Down-sample to at most 200 points so responses stay manageable.
  const stride = Math.max(1, Math.ceil(data.length / 200));
  const sampled = data
    .filter((_, idx) => idx % stride === 0)
    .map((d) => ({ timestamp: d.timestamp, ibi: d.ibi, validity: d.validity }));

  const summary: Record<string, unknown> = {
    total_samples: data.length,
    sampled_returned: sampled.length,
    validity_counts: validityCounts,
  };
  if (goodIBIs.length > 0) {
    const mean = goodIBIs.reduce((a, b) => a + b, 0) / goodIBIs.length;
    summary.good_samples = goodIBIs.length;
    summary.average_ibi_ms = mean;
    summary.min_ibi_ms = Math.min(...goodIBIs);
    summary.max_ibi_ms = Math.max(...goodIBIs);
    // RMSSD computed from successive differences in good IBIs (rough proxy).
    const diffs: number[] = [];
    for (let i = 1; i < goodIBIs.length; i++) {
      diffs.push(goodIBIs[i] - goodIBIs[i - 1]);
    }
    if (diffs.length > 0) {
      summary.rmssd_ms = Math.sqrt(diffs.reduce((a, b) => a + b * b, 0) / diffs.length);
    }
  }

  const result = JSON.stringify({ samples: sampled, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_ring_battery_level
 */
async function handleGetRingBatteryLevel(args: any): Promise<string> {
  const params = validateParams<DatetimeRangeArgs>(datetimeRangeSchema, args);
  const cacheKey = summarizeDatetimeRangeCache('battery', params);
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getRingBatteryLevel(params.start_datetime, params.end_datetime);

  const stride = Math.max(1, Math.ceil(data.length / 200));
  const sampled = data
    .filter((_, idx) => idx % stride === 0)
    .map((d) => ({
      timestamp: d.timestamp,
      level: d.level,
      charging: d.charging,
      in_charger: d.in_charger,
    }));

  const levels = data.map((d) => d.level);
  const summary: Record<string, unknown> = {
    total_samples: data.length,
    sampled_returned: sampled.length,
  };
  if (levels.length > 0) {
    summary.min_level = Math.min(...levels);
    summary.max_level = Math.max(...levels);
    summary.latest = data[data.length - 1];
  }

  const result = JSON.stringify({ samples: sampled, summary }, null, 2);
  cache.set(cacheKey, result);
  return result;
}

/**
 * Handler for get_ring_configuration
 */
async function handleGetRingConfiguration(): Promise<string> {
  const cacheKey = 'ring_configuration';
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getRingConfiguration();

  const result = JSON.stringify({ data }, null, 2);
  cache.set(cacheKey, result, 3600000); // ring config rarely changes — 1h TTL
  return result;
}

/**
 * Handler for get_document
 */
async function handleGetDocument(args: any): Promise<string> {
  const collection = args?.collection as SingleDocumentCollection | undefined;
  const documentId = args?.document_id as string | undefined;

  if (!collection || !SINGLE_DOCUMENT_COLLECTIONS.includes(collection)) {
    throw new Error(
      `Invalid collection. Must be one of: ${SINGLE_DOCUMENT_COLLECTIONS.join(', ')}`
    );
  }
  if (!documentId || typeof documentId !== 'string') {
    throw new Error('document_id is required and must be a string');
  }

  const cacheKey = `doc:${collection}:${documentId}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;

  const data = await getDocumentById(collection, documentId);
  const result = JSON.stringify(data, null, 2);
  cache.set(cacheKey, result, 600000); // 10 minutes
  return result;
}
