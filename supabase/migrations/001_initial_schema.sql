-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表 (Linked to auth.users if possible, but here we just use UUID)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'artist')),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 展会表
CREATE TABLE IF NOT EXISTS public.conventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(200) NOT NULL,
    venue VARCHAR(200),
    total_booths INTEGER DEFAULT 1,
    artists_needed INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 展位分配表
CREATE TABLE IF NOT EXISTS public.booth_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES public.users(id),
    booth_number VARCHAR(50),
    work_hours VARCHAR(100),
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'cancelled')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 客户表
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    tattoo_reference TEXT,
    tattoo_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预约表
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id),
    convention_id UUID REFERENCES public.conventions(id),
    artist_id UUID REFERENCES public.users(id),
    appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours INTEGER DEFAULT 1,
    tattoo_type VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单表
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id),
    artist_id UUID REFERENCES public.users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) DEFAULT 0,
    design_description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'deposit_paid', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 支付记录表
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'transfer', 'other')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 住宿信息表
CREATE TABLE IF NOT EXISTS public.accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    convention_id UUID REFERENCES public.conventions(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES public.users(id),
    hotel_name VARCHAR(200),
    hotel_address TEXT,
    check_in_date DATE,
    check_out_date DATE,
    room_number VARCHAR(50)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_conventions_dates ON public.conventions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_appointments_artist ON public.appointments(artist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_convention ON public.appointments(convention_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_orders_artist ON public.orders(artist_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);

-- 设置权限
GRANT SELECT ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT SELECT ON public.conventions TO anon;
GRANT ALL PRIVILEGES ON public.conventions TO authenticated;
GRANT SELECT ON public.appointments TO anon;
GRANT ALL PRIVILEGES ON public.appointments TO authenticated;
GRANT SELECT ON public.orders TO anon;
GRANT ALL PRIVILEGES ON public.orders TO authenticated;
GRANT SELECT ON public.payments TO anon;
GRANT ALL PRIVILEGES ON public.payments TO authenticated;
GRANT SELECT ON public.accommodations TO anon;
GRANT ALL PRIVILEGES ON public.accommodations TO authenticated;
GRANT SELECT ON public.booth_assignments TO anon;
GRANT ALL PRIVILEGES ON public.booth_assignments TO authenticated;
GRANT SELECT ON public.customers TO anon;
GRANT ALL PRIVILEGES ON public.customers TO authenticated;

-- Disable RLS for now to ensure development is smooth, can be enabled later
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Insert some dummy data
INSERT INTO public.users (id, email, name, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'manager@test.com', 'Manager Alice', 'manager'),
('22222222-2222-2222-2222-222222222222', 'artist1@test.com', 'Artist Bob', 'artist'),
('33333333-3333-3333-3333-333333333333', 'artist2@test.com', 'Artist Charlie', 'artist')
ON CONFLICT (email) DO NOTHING;
