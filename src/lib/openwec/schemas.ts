import { z } from "zod";

/**
 * Zod schemas mirroring the OpenWEC OpenAPI 3.1 spec
 * (https://api.openwec.com/openapi.json, version 0.1.0).
 * Field names intentionally match the API exactly; see docs/openwec-api.md.
 */

export const SeriesOutSchema = z.object({
  id: z.number(),
  key: z.string(),
  name: z.string(),
});

export const SeasonOutSchema = z.object({
  id: z.number(),
  raw_id: z.string(),
  year: z.number(),
  label: z.string(),
});

export const EventOutSchema = z.object({
  id: z.number(),
  raw_id: z.string(),
  name: z.string(),
  round: z.number().nullable(),
});

export const SessionOutSchema = z.object({
  id: z.number(),
  raw_id: z.string(),
  name: z.string(),
  session_type: z.string(),
  session_at: z.string().nullable(),
  imsa_series: z.string().nullable(),
  snapshot_hour: z.number().nullable(),
});

export const DriverSlotSchema = z.object({
  slot: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  country: z.string().nullable(),
  imsa_rating: z.string().nullable(),
});

export const ResultOutSchema = z.object({
  position: z.number().nullable(),
  car_number: z.string(),
  car_class: z.string().nullable(),
  vehicle: z.string().nullable(),
  team: z.string().nullable(),
  tyre_supplier: z.string().nullable(),
  status: z.string(),
  laps_completed: z.number().nullable(),
  total_time_s: z.number().nullable(),
  gap_to_first_s: z.number().nullable(),
  fl_lap_number: z.number().nullable(),
  fl_time_s: z.number().nullable(),
  fl_kph: z.number().nullable(),
  drivers: z.array(DriverSlotSchema).default([]),
});

export const LapOutSchema = z.object({
  car_number: z.string(),
  driver_name: z.string().nullable(),
  lap_number: z.number(),
  lap_time_s: z.number().nullable(),
  s1_s: z.number().nullable(),
  s2_s: z.number().nullable(),
  s3_s: z.number().nullable(),
  kph: z.number().nullable(),
  top_speed_kph: z.number().nullable(),
  lap_improvement: z.boolean(),
  crossing_finish_in_pit: z.boolean(),
  flag_at_fl: z.string().nullable(),
  pit_time_s: z.number().nullable(),
  elapsed_raw: z.string().nullable(),
  hour_raw: z.string().nullable(),
});

export const PaginatedLapsSchema = z.object({
  session_id: z.number(),
  car_number: z.string().nullable(),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  results: z.array(LapOutSchema),
});

export const StintOutSchema = z.object({
  car_number: z.string(),
  car_class: z.string().nullable(),
  team: z.string().nullable(),
  stint_number: z.number(),
  start_lap: z.number(),
  end_lap: z.number(),
  lap_count: z.number(),
  tyre_age_laps: z.number(),
  baseline_pace_s: z.number().nullable(),
  degradation_s_per_lap: z.number().nullable(),
  consistency_s: z.number().nullable(),
  is_final_stint: z.boolean(),
});

export const RaceControlPeriodSchema = z.object({
  flag: z.string(),
  label: z.string(),
  start_lap: z.number(),
  end_lap: z.number(),
  duration_laps: z.number(),
});

export const EventSessionSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  session_type: z.string(),
  session_at: z.string().nullable(),
  imsa_series: z.string().nullable().optional(),
  snapshot_hour: z.number().nullable().optional(),
  result_count: z.number().nullable().optional(),
  lap_count: z.number().nullable().optional(),
});

export const EventDetailSchema = z.object({
  id: z.number(),
  series: z.string(),
  season: z.string(),
  name: z.string(),
  round: z.number().nullable(),
  sessions: z.array(EventSessionSummarySchema),
});

export const SeriesListSchema = z.array(SeriesOutSchema);
export const SeasonListSchema = z.array(SeasonOutSchema);
export const EventListSchema = z.array(EventOutSchema);
export const SessionListSchema = z.array(SessionOutSchema);
export const ResultListSchema = z.array(ResultOutSchema);
export const StintListSchema = z.array(StintOutSchema);
export const RaceControlListSchema = z.array(RaceControlPeriodSchema);

export type SeriesOut = z.infer<typeof SeriesOutSchema>;
export type SeasonOut = z.infer<typeof SeasonOutSchema>;
export type EventOut = z.infer<typeof EventOutSchema>;
export type SessionOut = z.infer<typeof SessionOutSchema>;
export type ResultOut = z.infer<typeof ResultOutSchema>;
export type LapOut = z.infer<typeof LapOutSchema>;
export type PaginatedLaps = z.infer<typeof PaginatedLapsSchema>;
export type StintOut = z.infer<typeof StintOutSchema>;
export type RaceControlPeriodOut = z.infer<typeof RaceControlPeriodSchema>;
export type EventDetail = z.infer<typeof EventDetailSchema>;
