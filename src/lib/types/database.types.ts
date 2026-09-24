export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: "admin" | "user";
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: "admin" | "user";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: "admin" | "user";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "admin" | "user";
    };
    CompositeTypes: Record<string, never>;
  };
};
