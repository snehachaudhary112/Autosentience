-- AutoSentience Database Schema
-- Supabase PostgreSQL Schema with Row-Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- 1. Sensor Readings Table
CREATE TABLE sensor_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Engine metrics
    engine_temp DECIMAL(5,2),
    engine_rpm INTEGER,
    engine_load DECIMAL(5,2),
    
    -- Battery metrics
    battery_voltage DECIMAL(5,2),
    battery_current DECIMAL(5,2),
    
    -- Fuel metrics
    fuel_level DECIMAL(5,2),
    fuel_pressure DECIMAL(5,2),
    
    -- Transmission metrics
    transmission_temp DECIMAL(5,2),
    gear_position INTEGER,
    
    -- Tire metrics
    tire_pressure_fl DECIMAL(5,2),
    tire_pressure_fr DECIMAL(5,2),
    tire_pressure_rl DECIMAL(5,2),
    tire_pressure_rr DECIMAL(5,2),
    
    -- Other metrics
    coolant_temp DECIMAL(5,2),
    oil_pressure DECIMAL(5,2),
    speed DECIMAL(6,2),
    odometer INTEGER,
    
    -- Metadata
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Alerts Table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- AI diagnosis
    diagnosis TEXT,
    recommended_action TEXT,
    estimated_cost DECIMAL(10,2),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Related data
    sensor_reading_id UUID REFERENCES sensor_readings(id),
    agent_decision_id UUID,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Service Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(100) NOT NULL,
    alert_id UUID REFERENCES alerts(id),
    
    -- Booking details
    service_type VARCHAR(100) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    service_center VARCHAR(255),
    
    -- Customer details
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    
    -- Issue details
    issue_description TEXT,
    special_instructions TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED')),
    confirmation_number VARCHAR(50),
    
    -- Metadata
    estimated_duration INTEGER, -- in minutes
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Voice Logs Table
CREATE TABLE voice_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(100),
    
    -- Voice interaction details
    interaction_type VARCHAR(20) CHECK (interaction_type IN ('BROWSER', 'PHONE', 'VAPI')),
    user_query TEXT NOT NULL,
    transcribed_text TEXT,
    
    -- AI response
    agent_response TEXT,
    response_audio_url TEXT,
    
    -- Session tracking
    session_id VARCHAR(100),
    conversation_context JSONB,
    
    -- Metadata
    duration_seconds INTEGER,
    language VARCHAR(10) DEFAULT 'en',
    sentiment VARCHAR(20),
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Agent Logs Table
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(100),
    
    -- Agent details
    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('MASTER', 'DIAGNOSIS', 'ENGAGEMENT', 'SCHEDULING', 'RCA', 'UEBA')),
    action VARCHAR(100) NOT NULL,
    
    -- Decision tracking
    input_data JSONB NOT NULL,
    reasoning TEXT,
    decision JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    
    -- Related entities
    alert_id UUID REFERENCES alerts(id),
    booking_id UUID REFERENCES bookings(id),
    
    -- Execution details
    execution_time_ms INTEGER,
    groq_tokens_used INTEGER,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. UEBA Security Logs Table
CREATE TABLE ueba_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id VARCHAR(100),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    
    -- Risk assessment
    risk_level VARCHAR(20) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_score DECIMAL(5,2),
    anomaly_detected BOOLEAN DEFAULT FALSE,
    
    -- Detection details
    detection_method VARCHAR(50),
    baseline_behavior JSONB,
    current_behavior JSONB,
    deviation_metrics JSONB,
    
    -- Response
    action_taken VARCHAR(100),
    flagged_for_review BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    reviewer_notes TEXT,
    
    -- Metadata
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Sensor readings indexes
CREATE INDEX idx_sensor_readings_vehicle_id ON sensor_readings(vehicle_id);
CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX idx_sensor_readings_vehicle_timestamp ON sensor_readings(vehicle_id, timestamp DESC);

-- Alerts indexes
CREATE INDEX idx_alerts_vehicle_id ON alerts(vehicle_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_vehicle_status ON alerts(vehicle_id, status);

-- Bookings indexes
CREATE INDEX idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_alert_id ON bookings(alert_id);

-- Voice logs indexes
CREATE INDEX idx_voice_logs_vehicle_id ON voice_logs(vehicle_id);
CREATE INDEX idx_voice_logs_session_id ON voice_logs(session_id);
CREATE INDEX idx_voice_logs_created_at ON voice_logs(created_at DESC);

-- Agent logs indexes
CREATE INDEX idx_agent_logs_vehicle_id ON agent_logs(vehicle_id);
CREATE INDEX idx_agent_logs_agent_type ON agent_logs(agent_type);
CREATE INDEX idx_agent_logs_created_at ON agent_logs(created_at DESC);
CREATE INDEX idx_agent_logs_alert_id ON agent_logs(alert_id);

-- UEBA logs indexes
CREATE INDEX idx_ueba_logs_vehicle_id ON ueba_logs(vehicle_id);
CREATE INDEX idx_ueba_logs_risk_level ON ueba_logs(risk_level);
CREATE INDEX idx_ueba_logs_anomaly_detected ON ueba_logs(anomaly_detected);
CREATE INDEX idx_ueba_logs_created_at ON ueba_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ueba_logs ENABLE ROW LEVEL SECURITY;

-- Policies for sensor_readings
CREATE POLICY "Allow public read access to sensor_readings" 
    ON sensor_readings FOR SELECT 
    USING (true);

CREATE POLICY "Allow service role to insert sensor_readings" 
    ON sensor_readings FOR INSERT 
    WITH CHECK (true);

-- Policies for alerts
CREATE POLICY "Allow public read access to alerts" 
    ON alerts FOR SELECT 
    USING (true);

CREATE POLICY "Allow service role to manage alerts" 
    ON alerts FOR ALL 
    USING (true);

-- Policies for bookings
CREATE POLICY "Allow public read access to bookings" 
    ON bookings FOR SELECT 
    USING (true);

CREATE POLICY "Allow service role to manage bookings" 
    ON bookings FOR ALL 
    USING (true);

-- Policies for voice_logs
CREATE POLICY "Allow public read access to voice_logs" 
    ON voice_logs FOR SELECT 
    USING (true);

CREATE POLICY "Allow service role to insert voice_logs" 
    ON voice_logs FOR INSERT 
    WITH CHECK (true);

-- Policies for agent_logs
CREATE POLICY "Allow public read access to agent_logs" 
    ON agent_logs FOR SELECT 
    USING (true);

CREATE POLICY "Allow service role to insert agent_logs" 
    ON agent_logs FOR INSERT 
    WITH CHECK (true);

-- Policies for ueba_logs
CREATE POLICY "Allow public read access to ueba_logs" 
    ON ueba_logs FOR SELECT 
    USING (true);

CREATE POLICY "Allow service role to manage ueba_logs" 
    ON ueba_logs FOR ALL 
    USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_alerts_updated_at 
    BEFORE UPDATE ON alerts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample vehicle sensor reading
INSERT INTO sensor_readings (
    vehicle_id, engine_temp, engine_rpm, battery_voltage, 
    fuel_level, speed, odometer
) VALUES (
    'DEMO-VEH-001', 95.5, 2500, 12.6, 
    75.0, 65.5, 45000
);

-- Insert sample alert
INSERT INTO alerts (
    vehicle_id, alert_type, severity, title, description,
    diagnosis, recommended_action, status
) VALUES (
    'DEMO-VEH-001', 'ENGINE_TEMP', 'MEDIUM', 
    'Engine Temperature Above Normal',
    'Engine temperature has exceeded normal operating range',
    'Possible coolant system issue or thermostat malfunction',
    'Schedule inspection within 7 days. Monitor coolant levels.',
    'OPEN'
);
