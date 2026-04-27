export interface Category {
  id: number;
  name: string;
}

export interface TimeSlot {
  id: number;
  category_id: number;
  start_time: string;
  end_time: string;
  max_capacity: number;
  available_spots: number;
}

export interface Booking {
  id: number;
  user_id: number;
  time_slot_id: number;
  status: string;
}

export interface User {
  id: number;
  email: string;
  is_admin: boolean;
  role: 'driver' | 'technician' | 'admin';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserPreferences {
  preferred_categories: number[];
}