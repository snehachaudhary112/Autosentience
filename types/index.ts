// TypeScript Type Definitions for AutoSentience

// ============================================
// SENSOR DATA TYPES
// ============================================

export interface SensorReading {
  id: string;
  vehicle_id: string;
  timestamp: string;

  // Engine metrics
  engine_temp?: number;
  engine_rpm?: number;
  engine_load?: number;

  // Battery metrics
  battery_voltage?: number;
  battery_current?: number;

  // Fuel metrics
  fuel_level?: number;
  fuel_pressure?: number;

  // Transmission metrics
  transmission_temp?: number;
  gear_position?: number;

  // Tyre metrics
  tyre_pressure_fl?: number;
  tyre_pressure_fr?: number;
  tyre_pressure_rl?: number;
  tyre_pressure_rr?: number;

  // Other metrics
  coolant_temp?: number;
  oil_pressure?: number;
  speed?: number;
  odometer?: number;

  // Metadata
  raw_data?: Record<string, any>;
  created_at: string;
}

export interface SensorDataInput {
  vehicle_id: string;
  engine_temp?: number;
  engine_rpm?: number;
  engine_load?: number;
  battery_voltage?: number;
  battery_current?: number;
  fuel_level?: number;
  fuel_pressure?: number;
  transmission_temp?: number;
  gear_position?: number;
  tyre_pressure_fl?: number;
  tyre_pressure_fr?: number;
  tyre_pressure_rl?: number;
  tyre_pressure_rr?: number;
  coolant_temp?: number;
  oil_pressure?: number;
  speed?: number;
  odometer?: number;
  raw_data?: Record<string, any>;
}

// ============================================
// ALERT TYPES
// ============================================

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Alert {
  id: string;
  vehicle_id: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  description?: string;

  // AI diagnosis
  diagnosis?: string;
  recommended_action?: string;
  estimated_cost?: number;

  // Status tracking
  status: AlertStatus;
  acknowledged_at?: string;
  resolved_at?: string;

  // Related data
  sensor_reading_id?: string;
  agent_decision_id?: string;

  // Metadata
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertInput {
  vehicle_id: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  description?: string;
  diagnosis?: string;
  recommended_action?: string;
  estimated_cost?: number;
  sensor_reading_id?: string;
  metadata?: Record<string, any>;
}

// ============================================
// BOOKING TYPES
// ============================================

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_SERVICE' | 'COMPLETED' | 'CANCELLED';

export interface Booking {
  id: string;
  vehicle_id: string;
  alert_id?: string;

  // Booking details
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  service_center?: string;

  // Customer details
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;

  // Issue details
  issue_description?: string;
  special_instructions?: string;

  // Status
  status: BookingStatus;
  confirmation_number?: string;

  // Metadata
  estimated_duration?: number;
  estimated_cost?: number;
  actual_cost?: number;
  metadata?: Record<string, any>;

  created_at: string;
  updated_at: string;
}

export interface CreateBookingInput {
  vehicle_id: string;
  alert_id?: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  service_center?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  issue_description?: string;
  special_instructions?: string;
  estimated_duration?: number;
  estimated_cost?: number;
}

// ============================================
// VOICE LOG TYPES
// ============================================

export type VoiceInteractionType = 'BROWSER' | 'PHONE' | 'VAPI';

export interface VoiceLog {
  id: string;
  vehicle_id?: string;

  // Voice interaction details
  interaction_type: VoiceInteractionType;
  user_query: string;
  transcribed_text?: string;

  // AI response
  agent_response?: string;
  response_audio_url?: string;

  // Session tracking
  session_id?: string;
  conversation_context?: Record<string, any>;

  // Metadata
  duration_seconds?: number;
  language?: string;
  sentiment?: string;
  metadata?: Record<string, any>;

  created_at: string;
}

// ============================================
// AGENT LOG TYPES
// ============================================

export type AgentType = 'MASTER' | 'DIAGNOSIS' | 'ENGAGEMENT' | 'SCHEDULING' | 'RCA' | 'UEBA';

export interface AgentLog {
  id: string;
  vehicle_id?: string;

  // Agent details
  agent_type: AgentType;
  action: string;

  // Decision tracking
  input_data: Record<string, any>;
  reasoning?: string;
  decision: Record<string, any>;
  confidence_score?: number;

  // Related entities
  alert_id?: string;
  booking_id?: string;

  // Execution details
  execution_time_ms?: number;
  groq_tokens_used?: number;

  // Metadata
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================
// UEBA LOG TYPES
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UEBALog {
  id: string;
  vehicle_id?: string;

  // Event details
  event_type: string;
  event_description?: string;

  // Risk assessment
  risk_level?: RiskLevel;
  risk_score?: number;
  anomaly_detected: boolean;

  // Detection details
  detection_method?: string;
  baseline_behavior?: Record<string, any>;
  current_behavior?: Record<string, any>;
  deviation_metrics?: Record<string, any>;

  // Response
  action_taken?: string;
  flagged_for_review: boolean;
  reviewed_at?: string;
  reviewer_notes?: string;

  // Metadata
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================
// AGENT SYSTEM TYPES
// ============================================

export interface AgentInput {
  vehicle_id: string;
  sensor_data?: SensorReading;
  context?: Record<string, any>;
}

export interface AgentOutput {
  action: string;
  reasoning: string;
  confidence: number;
  next_steps?: string[];
  data?: Record<string, any>;
}

export interface DiagnosisAgentOutput extends AgentOutput {
  fault_detected: boolean;
  fault_type?: string;
  severity: AlertSeverity;
  diagnosis: string;
  recommended_action: string;
  estimated_cost?: number;
}

export interface EngagementAgentOutput extends AgentOutput {
  message: string;
  tone: 'informative' | 'urgent' | 'reassuring';
  should_call_user: boolean;
}

export interface SchedulingAgentOutput extends AgentOutput {
  booking_recommended: boolean;
  suggested_dates?: string[];
  service_type?: string;
  estimated_duration?: number;
}

export interface RCAAgentOutput extends AgentOutput {
  root_cause: string;
  contributing_factors: string[];
  capa_recommendations: string[];
  preventive_measures: string[];
}

export interface UEBAAgentOutput extends AgentOutput {
  anomaly_detected: boolean;
  risk_level: RiskLevel;
  risk_score: number;
  suspicious_patterns: string[];
}

export interface DataAnalysisAgentOutput extends AgentOutput {
  anomalies_detected: boolean;
  predicted_maintenance_needs: string[];
  demand_forecast: {
    service_type: string;
    predicted_volume: 'low' | 'medium' | 'high';
    timeframe: string;
  }[];
}

export interface FeedbackAgentOutput extends AgentOutput {
  satisfaction_score: number;
  qualitative_feedback: string;
  record_updated: boolean;
}

export interface ManufacturingAgentOutput extends AgentOutput {
  design_improvements: string[];
  defect_reduction_strategies: string[];
  affected_components: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PredictionResponse {
  vehicle_id: string;
  anomalies_detected: boolean;
  alerts_created: Alert[];
  diagnosis: DiagnosisAgentOutput;
  master_decision: AgentOutput;
}

// ============================================
// RULE DETECTION TYPES
// ============================================

export interface RuleViolation {
  rule_name: string;
  parameter: string;
  current_value: number;
  threshold: number;
  severity: AlertSeverity;
  message: string;
}

export interface RuleDetectionResult {
  violations: RuleViolation[];
  has_violations: boolean;
  highest_severity: AlertSeverity | null;
}

// ============================================
// CHART DATA TYPES
// ============================================

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface SensorChartData {
  engine_temp: ChartDataPoint[];
  engine_rpm: ChartDataPoint[];
  battery_voltage: ChartDataPoint[];
  fuel_level: ChartDataPoint[];
  speed: ChartDataPoint[];
}

// ============================================
// VOICE INTERFACE TYPES
// ============================================

export interface VoiceQuery {
  query: string;
  vehicle_id?: string;
  session_id?: string;
  context?: Record<string, any>;
}

export interface VoiceResponse {
  response: string;
  action_taken?: string;
  data?: Record<string, any>;
}
