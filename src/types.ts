import { User } from '@supabase/supabase-js';

    // Interface for authenticated user state
    export interface AuthState {
      user: User | null;
      loading: boolean;
    }

    // Interface for a medication record
    export interface Medication {
      id: string;
      created_at: string;
      user_id: string; // The ID of the user who owns this medication
      name: string;
      dosage: string;
      frequency: string; // e.g., "Once daily", "Twice a day"
    }

    // Interface for creating a new medication (without ID, timestamps, user_id)
    export type NewMedication = Omit<Medication, 'id' | 'created_at' | 'user_id'>;

    // Interface for a medication log entry
    export interface MedicationLog {
      id: string;
      created_at: string;
      user_id: string; // The ID of the user who took this medication
      medication_id: string; // ID of the medication that was taken
      taken_at: string; // Timestamp when it was marked as taken
    }
