// OAuth Types
export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
}

// Personal Info Types
export interface PersonalInfo {
  age: number;
  weight: number;
  height: number;
  biological_sex: 'male' | 'female';
  email: string;
}

// Sleep Types
export interface SleepData {
  date: string;
  score: number;
  total_sleep_duration: number;
  efficiency: number;
  latency: number;
  deep_sleep_duration: number;
  light_sleep_duration: number;
  rem_sleep_duration: number;
  awake_time: number;
  restfulness: number;
  timing: number;
  hrv_balance?: number;
}

export interface SleepSummary {
  data: SleepData[];
  summary: {
    average_score: number;
    average_duration: number;
    average_efficiency: number;
    total_days: number;
  };
}

// Readiness Types
export interface ReadinessData {
  date: string;
  score: number;
  temperature_deviation: number;
  temperature_trend_deviation: number;
  activity_balance: number;
  body_temperature: number;
  hrv_balance: number;
  previous_day_activity: number;
  previous_night: number;
  recovery_index: number;
  resting_heart_rate: number;
  sleep_balance: number;
}

export interface ReadinessSummary {
  data: ReadinessData[];
  summary: {
    average_score: number;
    trend: 'improving' | 'declining' | 'stable';
    total_days: number;
  };
}

// Activity Types
export interface ActivityData {
  date: string;
  score: number;
  active_calories: number;
  total_calories: number;
  steps: number;
  equivalent_walking_distance: number;
  high_activity_time: number;
  medium_activity_time: number;
  low_activity_time: number;
  sedentary_time: number;
  resting_time: number;
  average_met: number;
  inactivity_alerts: number;
  target_calories: number;
  target_meters: number;
  meet_daily_targets: number;
}

export interface ActivitySummary {
  data: ActivityData[];
  summary: {
    average_score: number;
    total_steps: number;
    total_calories: number;
    average_steps_per_day: number;
    total_days: number;
  };
}

// Heart Rate Types
export interface HeartRateReading {
  timestamp: string;
  bpm: number;
  source: 'rest' | 'activity' | 'workout';
}

export interface HeartRateSummary {
  data: HeartRateReading[];
  summary: {
    average_bpm: number;
    min_bpm: number;
    max_bpm: number;
    resting_hr: number;
    total_readings: number;
  };
}

// Workout Types
export interface WorkoutData {
  date: string;
  activity: string;
  intensity: 'easy' | 'moderate' | 'hard';
  start_datetime: string;
  end_datetime: string;
  calories: number;
  distance?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
}

export interface WorkoutSummary {
  data: WorkoutData[];
  summary: {
    total_workouts: number;
    total_calories: number;
    total_duration: number;
    activities: string[];
  };
}

// Detailed Sleep Types
export interface DetailedSleepData {
  date: string;
  type: 'long_sleep' | 'short_sleep' | 'nap';
  bedtime_start: string;
  bedtime_end: string;
  breath_average: number;
  heart_rate: {
    interval: number;
    samples: number[];
    average: number;
  };
  hrv: {
    samples: number[];
    average: number;
  };
  movement_30_sec: string;
  sleep_phase_5_min: string;
}

// Tag Types
export interface TagData {
  date: string;
  day: string;
  text: string;
  timestamp: string;
  tags: string[];
}

// Ring Status Types
export interface RingStatus {
  ring_id: string;
  hardware_type: string;
  firmware_version: string;
  battery_level?: number;
  last_sync: string;
}

// Health Insights Types
export interface HealthInsight {
  category: 'sleep' | 'activity' | 'readiness' | 'recovery';
  finding: string;
  recommendation?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface HealthInsights {
  period: {
    start_date: string;
    end_date: string;
  };
  insights: HealthInsight[];
  trends: {
    sleep: 'improving' | 'declining' | 'stable';
    activity: 'improving' | 'declining' | 'stable';
    readiness: 'improving' | 'declining' | 'stable';
  };
}

// MCP Types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface MCPError {
  code: number;
  message: string;
  data?: {
    details: string;
  };
}

// Oura API Raw Response Types
export interface OuraApiResponse<T> {
  data: T[];
  next_token?: string;
}

export interface OuraPersonalInfoResponse {
  id: string;
  age: number;
  weight: number;
  height: number;
  biological_sex: string;
  email: string;
}

export interface OuraDailySleepResponse {
  id: string;
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
  day: string;
  score: number;
  timestamp: string;
}

export interface OuraDailyActivityResponse {
  id: string;
  class_5_min: string;
  score: number;
  active_calories: number;
  average_met_minutes: number;
  contributors: {
    meet_daily_targets: number;
    move_every_hour: number;
    recovery_time: number;
    stay_active: number;
    training_frequency: number;
    training_volume: number;
  };
  equivalent_walking_distance: number;
  high_activity_met_minutes: number;
  high_activity_time: number;
  inactivity_alerts: number;
  low_activity_met_minutes: number;
  low_activity_time: number;
  medium_activity_met_minutes: number;
  medium_activity_time: number;
  met: {
    interval: number;
    items: number[];
    timestamp: string;
  };
  meters_to_target: number;
  non_wear_time: number;
  resting_time: number;
  sedentary_met_minutes: number;
  sedentary_time: number;
  steps: number;
  target_calories: number;
  target_meters: number;
  total_calories: number;
  day: string;
  timestamp: string;
}

export interface OuraDailyReadinessResponse {
  id: string;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
  day: string;
  score: number;
  temperature_deviation: number;
  temperature_trend_deviation: number;
  timestamp: string;
}

export interface OuraHeartRateResponse {
  bpm: number;
  source: string;
  timestamp: string;
}

export interface OuraWorkoutResponse {
  id: string;
  activity: string;
  calories: number;
  day: string;
  distance: number;
  end_datetime: string;
  intensity: string;
  label: string;
  source: string;
  start_datetime: string;
}

export interface OuraSleepResponse {
  id: string;
  average_breath: number;
  average_heart_rate: number;
  average_hrv: number;
  awake_time: number;
  bedtime_end: string;
  bedtime_start: string;
  day: string;
  deep_sleep_duration: number;
  efficiency: number;
  heart_rate: {
    interval: number;
    items: number[];
    timestamp: string;
  };
  hrv: {
    interval: number;
    items: number[];
    timestamp: string;
  };
  latency: number;
  light_sleep_duration: number;
  low_battery_alert: boolean;
  lowest_heart_rate: number;
  movement_30_sec: string;
  period: number;
  rem_sleep_duration: number;
  restless_periods: number;
  sleep_phase_5_min: string;
  sleep_score_delta: number;
  time_in_bed: number;
  total_sleep_duration: number;
  type: string;
}

export interface OuraTagResponse {
  id: string;
  day: string;
  text: string;
  timestamp: string;
  tags: string[];
}

export interface OuraRingConfigurationResponse {
  id: string;
  color: string;
  design: string;
  firmware_version: string;
  hardware_type: string;
  set_up_at: string;
  size: number;
}

// Daily SpO2
export interface OuraDailySpo2Response {
  id: string;
  day: string;
  breathing_disturbance_index: number | null;
  spo2_percentage: { average: number } | null;
}

// Daily Stress
export interface OuraDailyStressResponse {
  id: string;
  day: string;
  day_summary: 'restored' | 'normal' | 'stressful' | null;
  recovery_high: number | null;
  stress_high: number | null;
}

// Daily Resilience
export interface OuraDailyResilienceResponse {
  id: string;
  day: string;
  contributors: {
    sleep_recovery: number;
    daytime_recovery: number;
    stress: number;
  };
  level: 'limited' | 'adequate' | 'solid' | 'strong' | 'exceptional';
}

// Daily Cardiovascular Age
export interface OuraDailyCardioAgeResponse {
  id: string;
  day: string;
  vascular_age: number | null;
}

// VO2 Max
export interface OuraVO2MaxResponse {
  id: string;
  day: string;
  timestamp: string;
  vo2_max: number;
}

// Session (mindfulness/meditation/breathing)
export interface OuraSampleData {
  interval: number;
  items: Array<number | null>;
  timestamp: string;
}

export interface OuraSessionResponse {
  id: string;
  day: string;
  start_datetime: string;
  end_datetime: string;
  type: 'breathing' | 'meditation' | 'nap' | 'relaxation' | 'rest' | 'body_status';
  mood?: 'bad' | 'worse' | 'same' | 'good' | 'great' | null;
  heart_rate?: OuraSampleData | null;
  heart_rate_variability?: OuraSampleData | null;
  motion_count?: OuraSampleData | null;
}

// Rest Mode Period
export interface OuraRestModeEpisode {
  tags: string[];
  timestamp: string;
}

export interface OuraRestModePeriodResponse {
  id: string;
  start_day: string;
  end_day: string | null;
  start_time: string | null;
  end_time: string | null;
  episodes: OuraRestModeEpisode[];
}

// Sleep Time (recommended bedtime)
export interface OuraSleepTimeWindow {
  day_tz: number;
  start_offset: number;
  end_offset: number;
}

export interface OuraSleepTimeResponse {
  id: string;
  day: string;
  optimal_bedtime: OuraSleepTimeWindow | null;
  recommendation:
    | 'improve_efficiency'
    | 'earlier_bedtime'
    | 'later_bedtime'
    | 'earlier_wake_up_time'
    | 'later_wake_up_time'
    | 'follow_optimal_bedtime'
    | null;
  status:
    | 'not_enough_nights'
    | 'not_enough_recent_nights'
    | 'bad_sleep_quality'
    | 'only_recommended_found'
    | 'optimal_found'
    | null;
}

// Enhanced Tag
export interface OuraEnhancedTagResponse {
  id: string;
  tag_type_code: string | null;
  start_time: string;
  end_time: string | null;
  start_day: string;
  end_day: string | null;
  comment: string | null;
  custom_name: string | null;
}

// Interbeat Interval
export interface OuraInterbeatIntervalResponse {
  timestamp: string;
  timestamp_unix: number;
  ibi: number;
  validity: number;
}

// Ring Battery Level
export interface OuraRingBatteryLevelResponse {
  timestamp: string;
  timestamp_unix: number;
  charging: boolean | null;
  in_charger: boolean | null;
  level: number;
}
