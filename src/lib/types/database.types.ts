export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = "administrador" | "manager" | "empleado";
export type Department =
  | "crm"
  | "inventory"
  | "finance"
  | "hr"
  | "operations";

export type CustomerStatus = "lead" | "cliente" | "inactivo";
export type DealStage = "prospeccion" | "propuesta" | "ganado" | "perdido";
export type MovementType = "entrada" | "salida" | "ajuste";
export type TransactionType = "ingreso" | "gasto";
export type InvoiceStatus = "borrador" | "emitida" | "pagada" | "vencida";
export type LeaveType = "vacaciones" | "baja_medica" | "personal";
export type LeaveStatus = "pendiente" | "aprobado" | "rechazado";
export type ProjectStatus = "planificacion" | "en_progreso" | "pausado" | "completado";
export type TaskPriority = "baja" | "media" | "alta" | "urgente";
export type TaskStatus = "pendiente" | "en_progreso" | "revision" | "completado";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: AppRole;
          department: Department | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role?: AppRole;
          department?: Department | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          role?: AppRole;
          department?: Department | null;
          created_at?: string;
        };
        Relationships: [];
      };
      crm_customers: {
        Row: { id: string; name: string; email: string | null; phone: string | null; company: string | null; status: CustomerStatus; created_at: string; created_by: string };
        Insert: { id?: string; name: string; email?: string | null; phone?: string | null; company?: string | null; status?: CustomerStatus; created_at?: string; created_by: string };
        Update: { id?: string; name?: string; email?: string | null; phone?: string | null; company?: string | null; status?: CustomerStatus; created_at?: string; created_by?: string };
        Relationships: [];
      };
      crm_deals: {
        Row: { id: string; customer_id: string; title: string; value: number; stage: DealStage; expected_close_date: string | null; created_at: string };
        Insert: { id?: string; customer_id: string; title: string; value?: number; stage?: DealStage; expected_close_date?: string | null; created_at?: string };
        Update: { id?: string; customer_id?: string; title?: string; value?: number; stage?: DealStage; expected_close_date?: string | null; created_at?: string };
        Relationships: [];
      };
      inventory_categories: {
        Row: { id: string; name: string; description: string | null };
        Insert: { id?: string; name: string; description?: string | null };
        Update: { id?: string; name?: string; description?: string | null };
        Relationships: [];
      };
      inventory_products: {
        Row: { id: string; category_id: string | null; sku: string; name: string; description: string | null; price: number; cost: number; stock_quantity: number; min_stock_alert: number };
        Insert: { id?: string; category_id?: string | null; sku: string; name: string; description?: string | null; price?: number; cost?: number; stock_quantity?: number; min_stock_alert?: number };
        Update: { id?: string; category_id?: string | null; sku?: string; name?: string; description?: string | null; price?: number; cost?: number; stock_quantity?: number; min_stock_alert?: number };
        Relationships: [];
      };
      inventory_movements: {
        Row: { id: string; product_id: string; type: MovementType; quantity: number; reason: string | null; user_id: string; created_at: string };
        Insert: { id?: string; product_id: string; type: MovementType; quantity: number; reason?: string | null; user_id: string; created_at?: string };
        Update: { id?: string; product_id?: string; type?: MovementType; quantity?: number; reason?: string | null; user_id?: string; created_at?: string };
        Relationships: [];
      };
      finance_transactions: {
        Row: { id: string; type: TransactionType; amount: number; category: string; description: string | null; date: string; created_by: string };
        Insert: { id?: string; type: TransactionType; amount: number; category: string; description?: string | null; date?: string; created_by: string };
        Update: { id?: string; type?: TransactionType; amount?: number; category?: string; description?: string | null; date?: string; created_by?: string };
        Relationships: [];
      };
      finance_invoices: {
        Row: { id: string; invoice_number: string; customer_id: string | null; issue_date: string; due_date: string; subtotal: number; tax_amount: number; total: number; status: InvoiceStatus };
        Insert: { id?: string; invoice_number: string; customer_id?: string | null; issue_date?: string; due_date: string; subtotal: number; tax_amount: number; total: number; status?: InvoiceStatus };
        Update: { id?: string; invoice_number?: string; customer_id?: string | null; issue_date?: string; due_date?: string; subtotal?: number; tax_amount?: number; total?: number; status?: InvoiceStatus };
        Relationships: [];
      };
      hr_attendance: {
        Row: { id: string; user_id: string; clock_in: string; clock_out: string | null; notes: string | null };
        Insert: { id?: string; user_id: string; clock_in: string; clock_out?: string | null; notes?: string | null };
        Update: { id?: string; user_id?: string; clock_in?: string; clock_out?: string | null; notes?: string | null };
        Relationships: [];
      };
      hr_leaves: {
        Row: { id: string; user_id: string; type: LeaveType; start_date: string; end_date: string; status: LeaveStatus; reviewed_by: string | null };
        Insert: { id?: string; user_id: string; type: LeaveType; start_date: string; end_date: string; status?: LeaveStatus; reviewed_by?: string | null };
        Update: { id?: string; user_id?: string; type?: LeaveType; start_date?: string; end_date?: string; status?: LeaveStatus; reviewed_by?: string | null };
        Relationships: [];
      };
      ops_projects: {
        Row: { id: string; name: string; description: string | null; status: ProjectStatus; start_date: string | null; end_date: string | null };
        Insert: { id?: string; name: string; description?: string | null; status?: ProjectStatus; start_date?: string | null; end_date?: string | null };
        Update: { id?: string; name?: string; description?: string | null; status?: ProjectStatus; start_date?: string | null; end_date?: string | null };
        Relationships: [];
      };
      ops_tasks: {
        Row: { id: string; project_id: string; assigned_to: string | null; title: string; description: string | null; priority: TaskPriority; status: TaskStatus; due_date: string | null };
        Insert: { id?: string; project_id: string; assigned_to?: string | null; title: string; description?: string | null; priority?: TaskPriority; status?: TaskStatus; due_date?: string | null };
        Update: { id?: string; project_id?: string; assigned_to?: string | null; title?: string; description?: string | null; priority?: TaskPriority; status?: TaskStatus; due_date?: string | null };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      adjust_inventory_stock: {
        Args: { p_product_id: string; p_quantity: number; p_type: MovementType; p_reason: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRole;
      crm_customer_status: CustomerStatus;
      crm_deal_stage: DealStage;
      inventory_movement_type: MovementType;
      finance_transaction_type: TransactionType;
      finance_invoice_status: InvoiceStatus;
      hr_leave_type: LeaveType;
      hr_leave_status: LeaveStatus;
      ops_project_status: ProjectStatus;
      ops_task_priority: TaskPriority;
      ops_task_status: TaskStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
