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
  | "operations"
  | "marketing";

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
export type LeadStage = "prospeccion" | "negociacion" | "cierre";
export type QuoteStatus = "borrador" | "enviada" | "aceptada" | "rechazada";
export type InteractionType = "llamada" | "email" | "reunion" | "nota";
export type StockMovementType = "entrada" | "salida";
export type CampaignStatus = "borrador" | "activa" | "pausada" | "finalizada";

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type EnterpriseTables = {
  system_settings: TableDefinition<{ key: string; value: Json; updated_at: string; updated_by: string | null }, { key: string; value?: Json; updated_at?: string; updated_by?: string | null }>;
  system_audit_logs: TableDefinition<{ id: string; actor_id: string; action: string; entity: string; entity_id: string | null; metadata: Json; created_at: string }>;
  crm_leads: TableDefinition<{ id: string; name: string; email: string | null; phone: string | null; company: string | null; stage: LeadStage; source: string | null; assigned_to: string | null; created_at: string; created_by: string }, { name: string; email?: string | null; phone?: string | null; company?: string | null; stage?: LeadStage; source?: string | null; assigned_to?: string | null; created_by: string }>;
  crm_quotes: TableDefinition<{ id: string; customer_id: string; quote_number: string; subtotal: number; tax_amount: number; total: number; status: QuoteStatus; created_at: string; created_by: string }>;
  crm_interactions: TableDefinition<{ id: string; customer_id: string; type: InteractionType; notes: string; occurred_at: string; created_by: string }>;
  inv_suppliers: TableDefinition<{ id: string; name: string; email: string | null; phone: string | null; created_at: string }, { name: string; email?: string | null; phone?: string | null }>;
  inv_products: TableDefinition<{ id: string; sku: string; name: string; description: string | null; supplier_id: string | null; stock_actual: number; stock_minimo: number; unit_cost: number }>;
  inv_movements: TableDefinition<{ id: string; product_id: string; supplier_id: string | null; type: StockMovementType; quantity: number; notes: string | null; created_by: string; created_at: string }>;
  fin_transactions: TableDefinition<{ id: string; type: TransactionType; amount: number; category: string; description: string | null; transaction_date: string; created_by: string }>;
  fin_invoices: TableDefinition<{ id: string; customer_id: string | null; invoice_number: string; subtotal: number; tax_amount: number; total: number; status: InvoiceStatus; issued_at: string; due_date: string; created_by: string }>;
  hr_employees_data: TableDefinition<{ user_id: string; job_title: string | null; phone: string | null; start_date: string | null; emergency_contact: string | null; updated_at: string }>;
  ops_milestones: TableDefinition<{ id: string; project_id: string; name: string; due_date: string | null; completed: boolean }>;
  mkt_campaigns: TableDefinition<{ id: string; name: string; budget: number; platform: string; status: CampaignStatus; created_by: string; created_at: string }>;
  mkt_performance: TableDefinition<{ id: string; campaign_id: string; leads_count: number; conversions_count: number; spend: number; measured_at: string }>;
};

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
    } & EnterpriseTables;
    Views: Record<string, never>;
    Functions: {
      adjust_inventory_stock: {
        Args: { p_product_id: string; p_quantity: number; p_type: MovementType; p_reason: string | null };
        Returns: undefined;
      };
      audit_change: {
        Args: { action_name: string; entity_name: string; entity_uuid: string | null; details: Json };
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
