-- AutoSentience Booking System Enhancement
-- Migration to add admin dashboard and booking system tables
-- Run this after the base schema.sql

-- ============================================
-- NEW TABLES FOR BOOKING SYSTEM
-- ============================================

-- 1. Issue Categories Table
CREATE TABLE IF NOT EXISTS issue_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50), -- icon name for UI (e.g., 'engine', 'brake', 'tire')
    typical_cost_min DECIMAL(10,2),
    typical_cost_max DECIMAL(10,2),
    avg_duration_minutes INTEGER,
    severity_default VARCHAR(20) CHECK (severity_default IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Service Centers Table
CREATE TABLE IF NOT EXISTS service_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    
    -- Location for distance calculation
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Contact details
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Operating details
    operating_hours JSONB, -- {"monday": "09:00-18:00", "tuesday": "09:00-18:00", ...}
    capacity_per_day INTEGER DEFAULT 10,
    
    -- Ratings and status
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    facilities JSONB, -- ["wifi", "waiting_room", "loaner_cars"]
    certifications JSONB, -- ["ISO_9001", "OEM_Certified"]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'super_admin', 'technician', 'manager')),
    
    -- For technicians
    service_center_id UUID REFERENCES service_centers(id),
    specialization VARCHAR(100), -- "Engine Specialist", "Electrical", etc.
    
    -- Authentication (handled by Supabase Auth, this is just metadata)
    auth_user_id UUID, -- Link to Supabase auth.users
    
    -- Status
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enhanced Bookings Table (if not exists, otherwise we'll alter)
-- First, check if we need to enhance the existing bookings table
DO $$
BEGIN
    -- Add new columns to existing bookings table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'issue_category_id') THEN
        ALTER TABLE bookings ADD COLUMN issue_category_id UUID REFERENCES issue_categories(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'service_center_id') THEN
        ALTER TABLE bookings ADD COLUMN service_center_id UUID REFERENCES service_centers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'assigned_technician_id') THEN
        ALTER TABLE bookings ADD COLUMN assigned_technician_id UUID REFERENCES admin_users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'admin_notes') THEN
        ALTER TABLE bookings ADD COLUMN admin_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'user_id') THEN
        ALTER TABLE bookings ADD COLUMN user_id UUID; -- Link to auth.users
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'priority') THEN
        ALTER TABLE bookings ADD COLUMN priority VARCHAR(20) DEFAULT 'NORMAL' 
            CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));
    END IF;
END $$;

-- 5. Booking Feedback Table
CREATE TABLE IF NOT EXISTS booking_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    -- Ratings (1-5 stars)
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    technician_rating INTEGER CHECK (technician_rating >= 1 AND technician_rating <= 5),
    facility_rating INTEGER CHECK (facility_rating >= 1 AND facility_rating <= 5),
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    
    -- Feedback
    comments TEXT,
    would_recommend BOOLEAN,
    
    -- Issues reported
    issues_reported TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Booking Status History Table (for audit trail)
CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    
    changed_by_user_id UUID, -- admin who made the change
    change_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Vehicles Table (to link users with their vehicles)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Link to auth.users
    
    -- Vehicle identification
    vehicle_id VARCHAR(100) NOT NULL UNIQUE, -- Same as used in sensor_readings
    vin VARCHAR(17) UNIQUE,
    
    -- Vehicle details
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    color VARCHAR(50),
    
    -- Connectivity
    esim_id VARCHAR(100),
    last_connected TIMESTAMPTZ,
    
    -- Registration
    registration_number VARCHAR(50),
    registration_date DATE,
    
    -- Ownership
    purchase_date DATE,
    warranty_expiry DATE,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================

-- Issue categories indexes
CREATE INDEX IF NOT EXISTS idx_issue_categories_active ON issue_categories(active);

-- Service centers indexes
CREATE INDEX IF NOT EXISTS idx_service_centers_active ON service_centers(active);
CREATE INDEX IF NOT EXISTS idx_service_centers_city ON service_centers(city);
CREATE INDEX IF NOT EXISTS idx_service_centers_rating ON service_centers(rating DESC);

-- Admin users indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_service_center ON admin_users(service_center_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(active);

-- Enhanced bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_issue_category ON bookings(issue_category_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_center ON bookings(service_center_id);
CREATE INDEX IF NOT EXISTS idx_bookings_technician ON bookings(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_priority ON bookings(priority);

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_booking_feedback_booking_id ON booking_feedback(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_feedback_overall_rating ON booking_feedback(overall_rating);

-- Vehicles indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_id ON vehicles(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on new tables
ALTER TABLE issue_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policies for issue_categories (public read, admin write)
CREATE POLICY "Allow public read access to issue_categories" 
    ON issue_categories FOR SELECT 
    USING (active = true);

CREATE POLICY "Allow service role to manage issue_categories" 
    ON issue_categories FOR ALL 
    USING (true);

-- Policies for service_centers (public read active centers, admin write)
CREATE POLICY "Allow public read access to active service_centers" 
    ON service_centers FOR SELECT 
    USING (active = true);

CREATE POLICY "Allow service role to manage service_centers" 
    ON service_centers FOR ALL 
    USING (true);

-- Policies for admin_users (restricted access)
CREATE POLICY "Allow service role to manage admin_users" 
    ON admin_users FOR ALL 
    USING (true);

-- Policies for booking_feedback (users can only see their own)
CREATE POLICY "Users can view their own booking feedback" 
    ON booking_feedback FOR SELECT 
    USING (
        booking_id IN (
            SELECT id FROM bookings WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own booking feedback" 
    ON booking_feedback FOR INSERT 
    WITH CHECK (
        booking_id IN (
            SELECT id FROM bookings WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Allow service role to manage booking_feedback" 
    ON booking_feedback FOR ALL 
    USING (true);

-- Policies for booking_status_history
CREATE POLICY "Allow public read access to booking_status_history" 
    ON booking_status_history FOR SELECT 
    USING (true);

CREATE POLICY "Allow service role to insert booking_status_history" 
    ON booking_status_history FOR INSERT 
    WITH CHECK (true);

-- Policies for vehicles (users can only see their own)
CREATE POLICY "Users can view their own vehicles" 
    ON vehicles FOR SELECT 
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own vehicles" 
    ON vehicles FOR INSERT 
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vehicles" 
    ON vehicles FOR UPDATE 
    USING (user_id = auth.uid());

CREATE POLICY "Allow service role to manage vehicles" 
    ON vehicles FOR ALL 
    USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for issue_categories updated_at
CREATE TRIGGER update_issue_categories_updated_at 
    BEFORE UPDATE ON issue_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for service_centers updated_at
CREATE TRIGGER update_service_centers_updated_at 
    BEFORE UPDATE ON service_centers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for admin_users updated_at
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for vehicles updated_at
CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON vehicles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log booking status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO booking_status_history (booking_id, old_status, new_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_booking_status_changes 
    AFTER UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION log_booking_status_change();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default issue categories
INSERT INTO issue_categories (name, description, icon, typical_cost_min, typical_cost_max, avg_duration_minutes, severity_default) VALUES
('Engine Overheating', 'Engine temperature exceeds normal operating range', 'flame', 2000, 15000, 120, 'HIGH'),
('Brake System Issues', 'Problems with brake pads, rotors, or hydraulic system', 'disc-brake', 3000, 20000, 90, 'CRITICAL'),
('Tire Pressure Low', 'One or more tires have pressure below recommended levels', 'tire', 500, 2000, 30, 'MEDIUM'),
('Battery Issues', 'Battery voltage low or charging system malfunction', 'battery', 3000, 8000, 45, 'MEDIUM'),
('Transmission Problems', 'Issues with gear shifting or transmission fluid', 'gear', 5000, 50000, 180, 'HIGH'),
('Oil Pressure Low', 'Engine oil pressure below safe operating levels', 'oil-can', 1000, 5000, 60, 'HIGH'),
('Coolant System', 'Coolant level low or cooling system malfunction', 'droplet', 1500, 10000, 90, 'MEDIUM'),
('Electrical System', 'Issues with vehicle electrical components', 'zap', 2000, 15000, 120, 'MEDIUM'),
('Suspension Issues', 'Problems with shocks, struts, or suspension components', 'spring', 4000, 25000, 150, 'MEDIUM'),
('General Maintenance', 'Routine maintenance and inspection', 'wrench', 1000, 5000, 60, 'LOW')
ON CONFLICT (name) DO NOTHING;

-- Insert sample service centers
INSERT INTO service_centers (name, address, city, state, postal_code, latitude, longitude, phone, email, operating_hours, capacity_per_day, rating, total_reviews) VALUES
('AutoFix Downtown', '123 MG Road', 'Bangalore', 'Karnataka', '560001', 12.9716, 77.5946, '+91-80-12345678', 'downtown@autofix.in', 
 '{"monday": "09:00-18:00", "tuesday": "09:00-18:00", "wednesday": "09:00-18:00", "thursday": "09:00-18:00", "friday": "09:00-18:00", "saturday": "09:00-14:00", "sunday": "closed"}'::jsonb, 
 15, 4.5, 127),
('Premium Auto Care', '456 Indiranagar', 'Bangalore', 'Karnataka', '560038', 12.9784, 77.6408, '+91-80-23456789', 'care@premiumauto.in',
 '{"monday": "08:00-20:00", "tuesday": "08:00-20:00", "wednesday": "08:00-20:00", "thursday": "08:00-20:00", "friday": "08:00-20:00", "saturday": "08:00-20:00", "sunday": "10:00-16:00"}'::jsonb,
 20, 4.7, 203),
('QuickFix Service Center', '789 Whitefield', 'Bangalore', 'Karnataka', '560066', 12.9698, 77.7500, '+91-80-34567890', 'service@quickfix.in',
 '{"monday": "09:00-19:00", "tuesday": "09:00-19:00", "wednesday": "09:00-19:00", "thursday": "09:00-19:00", "friday": "09:00-19:00", "saturday": "09:00-17:00", "sunday": "closed"}'::jsonb,
 12, 4.3, 89)
ON CONFLICT DO NOTHING;

-- Insert sample admin user
INSERT INTO admin_users (email, name, role, active) VALUES
('admin@autosentience.com', 'System Administrator', 'super_admin', true),
('manager@autosentience.com', 'Service Manager', 'manager', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View for booking analytics
CREATE OR REPLACE VIEW booking_analytics AS
SELECT 
    DATE(b.created_at) as booking_date,
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE b.status = 'PENDING') as pending_count,
    COUNT(*) FILTER (WHERE b.status = 'CONFIRMED') as confirmed_count,
    COUNT(*) FILTER (WHERE b.status = 'COMPLETED') as completed_count,
    COUNT(*) FILTER (WHERE b.status = 'CANCELLED') as cancelled_count,
    AVG(b.actual_cost) as avg_cost,
    AVG(b.estimated_duration) as avg_duration
FROM bookings b
GROUP BY DATE(b.created_at)
ORDER BY booking_date DESC;

-- View for service center performance
CREATE OR REPLACE VIEW service_center_performance AS
SELECT 
    sc.id,
    sc.name,
    sc.city,
    COUNT(b.id) as total_bookings,
    COUNT(*) FILTER (WHERE b.status = 'COMPLETED') as completed_bookings,
    AVG(bf.overall_rating) as avg_rating,
    COUNT(bf.id) as total_feedback
FROM service_centers sc
LEFT JOIN bookings b ON sc.id = b.service_center_id
LEFT JOIN booking_feedback bf ON b.id = bf.booking_id
WHERE sc.active = true
GROUP BY sc.id, sc.name, sc.city
ORDER BY avg_rating DESC NULLS LAST;

-- View for issue category trends
CREATE OR REPLACE VIEW issue_category_trends AS
SELECT 
    ic.id,
    ic.name,
    ic.severity_default,
    COUNT(b.id) as booking_count,
    COUNT(a.id) as alert_count,
    AVG(b.actual_cost) as avg_actual_cost,
    AVG(b.estimated_duration) as avg_duration
FROM issue_categories ic
LEFT JOIN bookings b ON ic.id = b.issue_category_id
LEFT JOIN alerts a ON ic.name = a.alert_type
WHERE ic.active = true
GROUP BY ic.id, ic.name, ic.severity_default
ORDER BY booking_count DESC;

COMMENT ON TABLE issue_categories IS 'Predefined categories of vehicle issues for booking classification';
COMMENT ON TABLE service_centers IS 'Authorized service centers where vehicles can be serviced';
COMMENT ON TABLE admin_users IS 'Admin users who can manage bookings and system';
COMMENT ON TABLE booking_feedback IS 'Customer feedback after service completion';
COMMENT ON TABLE booking_status_history IS 'Audit trail of booking status changes';
COMMENT ON TABLE vehicles IS 'User-owned vehicles linked to their accounts';
