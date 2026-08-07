export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_name: string | null
          created_at: string
          description: string | null
          device: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          module_id: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          device?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          module_id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          description?: string | null
          device?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          module_id?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      applicants: {
        Row: {
          address: string | null
          barangay: string | null
          city: string | null
          cover_letter: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          middle_name: string | null
          phone: string | null
          province: string | null
          resume_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          barangay?: string | null
          city?: string | null
          cover_letter?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          middle_name?: string | null
          phone?: string | null
          province?: string | null
          resume_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          barangay?: string | null
          city?: string | null
          cover_letter?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          province?: string | null
          resume_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      application_history: {
        Row: {
          actor_id: string | null
          application_id: string
          created_at: string
          event: string
          id: string
          notes: string | null
        }
        Insert: {
          actor_id?: string | null
          application_id: string
          created_at?: string
          event: string
          id?: string
          notes?: string | null
        }
        Update: {
          actor_id?: string | null
          application_id?: string
          created_at?: string
          event?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "application_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          final_interviewer_id: string | null
          id: string
          job_posting_id: string
          notes: string | null
          reference_code: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          final_interviewer_id?: string | null
          id?: string
          job_posting_id: string
          notes?: string | null
          reference_code?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          final_interviewer_id?: string | null
          id?: string
          job_posting_id?: string
          notes?: string | null
          reference_code?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_final_interviewer_id_fkey"
            columns: ["final_interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_final_interviewer_id_fkey"
            columns: ["final_interviewer_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_final_interviewer_id_fkey"
            columns: ["final_interviewer_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_final_interviewer_id_fkey"
            columns: ["final_interviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_date: string
          created_at: string
          employee_id: string
          id: string
          late_minutes: number
          overtime_minutes: number
          status: Database["public"]["Enums"]["attendance_status"]
          time_in: string | null
          time_out: string | null
          undertime_minutes: number
          updated_at: string
          working_hours: number
        }
        Insert: {
          attendance_date: string
          created_at?: string
          employee_id: string
          id?: string
          late_minutes?: number
          overtime_minutes?: number
          status?: Database["public"]["Enums"]["attendance_status"]
          time_in?: string | null
          time_out?: string | null
          undertime_minutes?: number
          updated_at?: string
          working_hours?: number
        }
        Update: {
          attendance_date?: string
          created_at?: string
          employee_id?: string
          id?: string
          late_minutes?: number
          overtime_minutes?: number
          status?: Database["public"]["Enums"]["attendance_status"]
          time_in?: string | null
          time_out?: string | null
          undertime_minutes?: number
          updated_at?: string
          working_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "branches_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      change_requests: {
        Row: {
          created_at: string
          id: string
          operation: Database["public"]["Enums"]["change_request_operation"]
          payload: Json
          rejection_reason: string | null
          requested_at: string
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["change_request_status"]
          summary: string
          target_id: string | null
          target_table: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          operation: Database["public"]["Enums"]["change_request_operation"]
          payload?: Json
          rejection_reason?: string | null
          requested_at?: string
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          summary: string
          target_id?: string | null
          target_table: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          operation?: Database["public"]["Enums"]["change_request_operation"]
          payload?: Json
          rejection_reason?: string | null
          requested_at?: string
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["change_request_status"]
          summary?: string
          target_id?: string | null
          target_table?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          business_type: string | null
          company_name: string
          created_at: string
          currency: string
          email: string | null
          fiscal_year_start_month: number
          id: boolean
          legal_name: string | null
          logo_url: string | null
          phone: string | null
          tax_settings: Json
          timezone: string
          tin: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          company_name: string
          created_at?: string
          currency?: string
          email?: string | null
          fiscal_year_start_month?: number
          id?: boolean
          legal_name?: string | null
          logo_url?: string | null
          phone?: string | null
          tax_settings?: Json
          timezone?: string
          tin?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_type?: string | null
          company_name?: string
          created_at?: string
          currency?: string
          email?: string | null
          fiscal_year_start_month?: number
          id?: boolean
          legal_name?: string | null
          logo_url?: string | null
          phone?: string | null
          tax_settings?: Json
          timezone?: string
          tin?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          head_id: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          head_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          head_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deployment_records: {
        Row: {
          application_id: string
          assigned_branch: string | null
          branch_id: string | null
          created_at: string
          deployed_by: string | null
          deployment_date: string
          id: string
          remarks: string | null
          reporting_manager: string | null
          reporting_time: string | null
          updated_at: string
          work_location: string | null
          work_location_id: string | null
          work_schedule_id: string | null
        }
        Insert: {
          application_id: string
          assigned_branch?: string | null
          branch_id?: string | null
          created_at?: string
          deployed_by?: string | null
          deployment_date: string
          id?: string
          remarks?: string | null
          reporting_manager?: string | null
          reporting_time?: string | null
          updated_at?: string
          work_location?: string | null
          work_location_id?: string | null
          work_schedule_id?: string | null
        }
        Update: {
          application_id?: string
          assigned_branch?: string | null
          branch_id?: string | null
          created_at?: string
          deployed_by?: string | null
          deployment_date?: string
          id?: string
          remarks?: string | null
          reporting_manager?: string | null
          reporting_time?: string | null
          updated_at?: string
          work_location?: string | null
          work_location_id?: string | null
          work_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deployment_records_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_records_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_records_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_records_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_records_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deployment_records_deployed_by_fkey"
            columns: ["deployed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_records_work_location_id_fkey"
            columns: ["work_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployment_records_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          document_type: string
          employee_id: string
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_type: string
          employee_id: string
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_type?: string
          employee_id?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_history: {
        Row: {
          actor_id: string | null
          created_at: string
          employee_id: string
          event: string
          id: string
          notes: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          employee_id: string
          event: string
          id?: string
          notes?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          employee_id?: string
          event?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employee_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          application_id: string | null
          barangay: string | null
          basic_salary: number
          benefits: string | null
          branch_id: string | null
          city: string | null
          civil_status: string | null
          created_at: string
          currency: string
          date_of_birth: string | null
          department_id: string | null
          employee_number: string
          employment_status: string
          employment_type: string
          first_name: string
          gender: string | null
          hire_date: string | null
          id: string
          last_name: string
          middle_name: string | null
          nationality: string | null
          personal_email: string | null
          phone: string | null
          photo_url: string | null
          position_id: string | null
          position_title: string | null
          province: string | null
          salary_grade_id: string | null
          separation_date: string | null
          suffix: string | null
          updated_at: string
          work_email: string | null
          work_schedule_id: string | null
        }
        Insert: {
          address?: string | null
          application_id?: string | null
          barangay?: string | null
          basic_salary?: number
          benefits?: string | null
          branch_id?: string | null
          city?: string | null
          civil_status?: string | null
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          department_id?: string | null
          employee_number?: string
          employment_status?: string
          employment_type?: string
          first_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          nationality?: string | null
          personal_email?: string | null
          phone?: string | null
          photo_url?: string | null
          position_id?: string | null
          position_title?: string | null
          province?: string | null
          salary_grade_id?: string | null
          separation_date?: string | null
          suffix?: string | null
          updated_at?: string
          work_email?: string | null
          work_schedule_id?: string | null
        }
        Update: {
          address?: string | null
          application_id?: string | null
          barangay?: string | null
          basic_salary?: number
          benefits?: string | null
          branch_id?: string | null
          city?: string | null
          civil_status?: string | null
          created_at?: string
          currency?: string
          date_of_birth?: string | null
          department_id?: string | null
          employee_number?: string
          employment_status?: string
          employment_type?: string
          first_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          nationality?: string | null
          personal_email?: string | null
          phone?: string | null
          photo_url?: string | null
          position_id?: string | null
          position_title?: string | null
          province?: string | null
          salary_grade_id?: string | null
          separation_date?: string | null
          suffix?: string | null
          updated_at?: string
          work_email?: string | null
          work_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_salary_grade_id_fkey"
            columns: ["salary_grade_id"]
            isOneToOne: false
            referencedRelation: "salary_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      employment_contracts: {
        Row: {
          additional_notes: string | null
          company_policies: string | null
          contract_file_url: string | null
          created_at: string
          id: string
          job_offer_id: string
          signed_at: string | null
          signed_by: string | null
          signing_notes: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          terms: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          company_policies?: string | null
          contract_file_url?: string | null
          created_at?: string
          id?: string
          job_offer_id: string
          signed_at?: string | null
          signed_by?: string | null
          signing_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          terms?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          company_policies?: string | null
          contract_file_url?: string | null
          created_at?: string
          id?: string
          job_offer_id?: string
          signed_at?: string | null
          signed_by?: string | null
          signing_notes?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employment_contracts_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_contracts_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_contracts_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employment_contracts_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employment_contracts_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_accounts: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_budget_allocations: {
        Row: {
          allocated_to: string | null
          amount: number
          budget_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          reference: string | null
        }
        Insert: {
          allocated_to?: string | null
          amount: number
          budget_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reference?: string | null
        }
        Update: {
          allocated_to?: string | null
          amount?: number
          budget_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_budget_allocations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "finance_budget_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budget_allocations_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "finance_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budget_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budget_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budget_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_budget_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_budgets: {
        Row: {
          account_id: string | null
          alert_threshold: number
          allocated: number
          amount: number
          branch_id: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          end_date: string | null
          fiscal_year: number
          id: string
          name: string
          period: Database["public"]["Enums"]["finance_budget_period"]
          spent: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          alert_threshold?: number
          allocated?: number
          amount: number
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          end_date?: string | null
          fiscal_year: number
          id?: string
          name: string
          period?: Database["public"]["Enums"]["finance_budget_period"]
          spent?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          alert_threshold?: number
          allocated?: number
          amount?: number
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          end_date?: string | null
          fiscal_year?: number
          id?: string
          name?: string
          period?: Database["public"]["Enums"]["finance_budget_period"]
          spent?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_budgets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["finance_transaction_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["finance_transaction_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["finance_transaction_type"]
          updated_at?: string
        }
        Relationships: []
      }
      finance_expenses: {
        Row: {
          account_id: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          budget_id: string | null
          category_id: string | null
          created_at: string
          department_id: string | null
          description: string
          expense_date: string
          expense_no: string
          id: string
          request_id: string | null
          requested_by: string | null
          status: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          budget_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description: string
          expense_date?: string
          expense_no: string
          id?: string
          request_id?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          budget_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string
          expense_date?: string
          expense_no?: string
          id?: string
          request_id?: string | null
          requested_by?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "finance_budget_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "finance_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "finance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_expenses_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "finance_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_income: {
        Row: {
          account_id: string | null
          amount: number
          branch_id: string | null
          category_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          received_date: string
          recorded_by: string | null
          reference_no: string | null
          source: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          received_date?: string
          recorded_by?: string | null
          reference_no?: string | null
          source: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          branch_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          received_date?: string
          recorded_by?: string | null
          reference_no?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_income_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_income_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_income_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_journal_entries: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          entry_date: string
          entry_no: string
          id: string
          memo: string | null
          posted_at: string | null
          posted_by: string | null
          source: string
          source_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          entry_date?: string
          entry_no: string
          id?: string
          memo?: string | null
          posted_at?: string | null
          posted_by?: string | null
          source?: string
          source_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          entry_date?: string
          entry_no?: string
          id?: string
          memo?: string | null
          posted_at?: string | null
          posted_by?: string | null
          source?: string
          source_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_journal_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_journal_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_journal_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          description: string | null
          entry_id: string
          id: string
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id: string
          id?: string
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "finance_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          expense_id: string | null
          id: string
          method: Database["public"]["Enums"]["finance_payment_method"]
          paid_at: string | null
          payment_no: string | null
          processed_by: string | null
          proof_path: string | null
          reference_number: string | null
          request_id: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          expense_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["finance_payment_method"]
          paid_at?: string | null
          payment_no?: string | null
          processed_by?: string | null
          proof_path?: string | null
          reference_number?: string | null
          request_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          expense_id?: string | null
          id?: string
          method?: Database["public"]["Enums"]["finance_payment_method"]
          paid_at?: string | null
          payment_no?: string | null
          processed_by?: string | null
          proof_path?: string | null
          reference_number?: string | null
          request_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "finance_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_payments_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "finance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_request_approvals: {
        Row: {
          action: Database["public"]["Enums"]["finance_approval_action"]
          actor_id: string | null
          created_at: string
          from_status:
            | Database["public"]["Enums"]["finance_request_status"]
            | null
          id: string
          remarks: string | null
          request_id: string
          role_at_action: string | null
          to_status:
            | Database["public"]["Enums"]["finance_request_status"]
            | null
        }
        Insert: {
          action: Database["public"]["Enums"]["finance_approval_action"]
          actor_id?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["finance_request_status"]
            | null
          id?: string
          remarks?: string | null
          request_id: string
          role_at_action?: string | null
          to_status?:
            | Database["public"]["Enums"]["finance_request_status"]
            | null
        }
        Update: {
          action?: Database["public"]["Enums"]["finance_approval_action"]
          actor_id?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["finance_request_status"]
            | null
          id?: string
          remarks?: string | null
          request_id?: string
          role_at_action?: string | null
          to_status?:
            | Database["public"]["Enums"]["finance_request_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_request_approvals_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_request_approvals_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_request_approvals_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_request_approvals_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_request_approvals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "finance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_request_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          kind: string
          request_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          kind?: string
          request_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          kind?: string
          request_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "finance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_request_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_request_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_request_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_request_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_requests: {
        Row: {
          amount: number
          branch_id: string | null
          budget_id: string | null
          category_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          expense_date: string | null
          id: string
          justification: string | null
          needed_by: string | null
          payment_schedule: string | null
          priority: string
          request_no: string | null
          requester_id: string
          status: Database["public"]["Enums"]["finance_request_status"]
          title: string
          type: Database["public"]["Enums"]["finance_request_type"]
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          branch_id?: string | null
          budget_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          justification?: string | null
          needed_by?: string | null
          payment_schedule?: string | null
          priority?: string
          request_no?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["finance_request_status"]
          title: string
          type: Database["public"]["Enums"]["finance_request_type"]
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          branch_id?: string | null
          budget_id?: string | null
          category_id?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string
          justification?: string | null
          needed_by?: string | null
          payment_schedule?: string | null
          priority?: string
          request_no?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["finance_request_status"]
          title?: string
          type?: Database["public"]["Enums"]["finance_request_type"]
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "finance_budget_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "finance_budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "finance_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_vendor_categories: {
        Row: {
          category_id: string
          vendor_id: string
        }
        Insert: {
          category_id: string
          vendor_id: string
        }
        Update: {
          category_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_vendor_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_vendor_categories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "finance_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          tin: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          tin?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          tin?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      generated_reports: {
        Row: {
          created_at: string
          file_url: string | null
          filters: Json | null
          format: Database["public"]["Enums"]["report_format"]
          generated_by: string | null
          id: string
          report_type: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          filters?: Json | null
          format: Database["public"]["Enums"]["report_format"]
          generated_by?: string | null
          id?: string
          report_type: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          filters?: Json | null
          format?: Database["public"]["Enums"]["report_format"]
          generated_by?: string | null
          id?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "generated_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          application_id: string
          created_at: string
          final_remarks: string | null
          id: string
          interview_notes: string | null
          interview_type: Database["public"]["Enums"]["interview_type"]
          interviewer_id: string | null
          location: string | null
          meeting_link: string | null
          mode: string | null
          overall_impression: string | null
          rating_communication: number | null
          rating_confidence: number | null
          rating_culture_fit: number | null
          rating_experience: number | null
          rating_leadership: number | null
          rating_problem_solving: number | null
          rating_technical_evaluation: number | null
          rating_technical_skills: number | null
          recommended_salary: number | null
          rejection_reason: string | null
          remarks: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["interview_status"]
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          final_remarks?: string | null
          id?: string
          interview_notes?: string | null
          interview_type: Database["public"]["Enums"]["interview_type"]
          interviewer_id?: string | null
          location?: string | null
          meeting_link?: string | null
          mode?: string | null
          overall_impression?: string | null
          rating_communication?: number | null
          rating_confidence?: number | null
          rating_culture_fit?: number | null
          rating_experience?: number | null
          rating_leadership?: number | null
          rating_problem_solving?: number | null
          rating_technical_evaluation?: number | null
          rating_technical_skills?: number | null
          recommended_salary?: number | null
          rejection_reason?: string | null
          remarks?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          final_remarks?: string | null
          id?: string
          interview_notes?: string | null
          interview_type?: Database["public"]["Enums"]["interview_type"]
          interviewer_id?: string | null
          location?: string | null
          meeting_link?: string | null
          mode?: string | null
          overall_impression?: string | null
          rating_communication?: number | null
          rating_confidence?: number | null
          rating_culture_fit?: number | null
          rating_experience?: number | null
          rating_leadership?: number | null
          rating_problem_solving?: number | null
          rating_technical_evaluation?: number | null
          rating_technical_skills?: number | null
          recommended_salary?: number | null
          rejection_reason?: string | null
          remarks?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["interview_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "interviews_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          notes: string | null
          product_id: string
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          stock_after: number
          stock_before: number
          store_id: string
          total_cost: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          notes?: string | null
          product_id: string
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          stock_after: number
          stock_before: number
          store_id: string
          total_cost: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          stock_after?: number
          stock_before?: number
          store_id?: string
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_store_fk"
            columns: ["product_id", "store_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id", "store_id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          additional_compensation: string | null
          application_id: string
          benefits: string | null
          created_at: string
          currency: string
          decline_notes: string | null
          decline_reason: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          notes: string | null
          offer_date: string
          prepared_by: string | null
          proposed_salary: number
          responded_at: string | null
          salary_grade_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
          work_schedule_id: string | null
          working_days: string | null
          working_hours: string | null
        }
        Insert: {
          additional_compensation?: string | null
          application_id: string
          benefits?: string | null
          created_at?: string
          currency?: string
          decline_notes?: string | null
          decline_reason?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          notes?: string | null
          offer_date?: string
          prepared_by?: string | null
          proposed_salary: number
          responded_at?: string | null
          salary_grade_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          work_schedule_id?: string | null
          working_days?: string | null
          working_hours?: string | null
        }
        Update: {
          additional_compensation?: string | null
          application_id?: string
          benefits?: string | null
          created_at?: string
          currency?: string
          decline_notes?: string | null
          decline_reason?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          notes?: string | null
          offer_date?: string
          prepared_by?: string | null
          proposed_salary?: number
          responded_at?: string | null
          salary_grade_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
          work_schedule_id?: string | null
          working_days?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_offers_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_salary_grade_id_fkey"
            columns: ["salary_grade_id"]
            isOneToOne: false
            referencedRelation: "salary_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          closing_date: string | null
          created_at: string
          date_posted: string | null
          department_id: string
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          position_id: string
          posted_by: string | null
          requirements: string | null
          status: Database["public"]["Enums"]["job_posting_status"]
          updated_at: string
          vacancies: number
        }
        Insert: {
          closing_date?: string | null
          created_at?: string
          date_posted?: string | null
          department_id: string
          description: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          position_id: string
          posted_by?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["job_posting_status"]
          updated_at?: string
          vacancies?: number
        }
        Update: {
          closing_date?: string | null
          created_at?: string
          date_posted?: string | null
          department_id?: string
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          position_id?: string
          posted_by?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["job_posting_status"]
          updated_at?: string
          vacancies?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_postings_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          employee_id: string
          id: string
          leave_type_id: string
          remaining_credits: number | null
          total_credits: number
          updated_at: string
          used_credits: number
          year: number
        }
        Insert: {
          employee_id: string
          id?: string
          leave_type_id: string
          remaining_credits?: number | null
          total_credits?: number
          updated_at?: string
          used_credits?: number
          year: number
        }
        Update: {
          employee_id?: string
          id?: string
          leave_type_id?: string
          remaining_credits?: number | null
          total_credits?: number
          updated_at?: string
          used_credits?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          days_requested: number
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_request_status"]
          supporting_document_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_requested: number
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          supporting_document_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_requested?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          supporting_document_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          created_at: string
          default_credits: number
          id: string
          is_paid: boolean
          name: string
        }
        Insert: {
          created_at?: string
          default_credits?: number
          id?: string
          is_paid?: boolean
          name: string
        }
        Update: {
          created_at?: string
          default_credits?: number
          id?: string
          is_paid?: boolean
          name?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          route: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          route?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          route?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notification_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience_permission: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          link: string | null
          module_id: string | null
          priority: string
          title: string
          user_id: string | null
        }
        Insert: {
          audience_permission?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          module_id?: string | null
          priority?: string
          title: string
          user_id?: string | null
        }
        Update: {
          audience_permission?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          module_id?: string | null
          priority?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_audience_permission_fkey"
            columns: ["audience_permission"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "notifications_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_line_items: {
        Row: {
          amount: number
          created_at: string
          id: string
          item_type: string
          label: string
          payroll_record_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          item_type: string
          label: string
          payroll_record_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          item_type?: string
          label?: string
          payroll_record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_line_items_payroll_record_id_fkey"
            columns: ["payroll_record_id"]
            isOneToOne: false
            referencedRelation: "payroll_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          created_by: string | null
          frequency: string
          id: string
          pay_date: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["payroll_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          frequency?: string
          id?: string
          pay_date?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["payroll_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          frequency?: string
          id?: string
          pay_date?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["payroll_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payroll_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_records: {
        Row: {
          absent_days: number
          basic_salary: number
          created_at: string
          currency: string
          days_present: number
          employee_id: string
          gross_salary: number
          id: string
          late_deduction: number
          late_minutes: number
          leave_deduction: number
          net_salary: number
          notes: string | null
          other_deductions: number
          overtime_hours: number
          overtime_pay: number
          pagibig_contribution: number
          paid_leave_days: number
          payroll_period_id: string
          philhealth_contribution: number
          rejection_reason: string | null
          released_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sss_contribution: number
          status: Database["public"]["Enums"]["payroll_status"]
          submitted_at: string | null
          submitted_by: string | null
          total_allowances: number
          total_deductions: number
          undertime_deduction: number
          undertime_minutes: number
          unpaid_leave_days: number
          updated_at: string
          working_days: number
        }
        Insert: {
          absent_days?: number
          basic_salary?: number
          created_at?: string
          currency?: string
          days_present?: number
          employee_id: string
          gross_salary?: number
          id?: string
          late_deduction?: number
          late_minutes?: number
          leave_deduction?: number
          net_salary?: number
          notes?: string | null
          other_deductions?: number
          overtime_hours?: number
          overtime_pay?: number
          pagibig_contribution?: number
          paid_leave_days?: number
          payroll_period_id: string
          philhealth_contribution?: number
          rejection_reason?: string | null
          released_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sss_contribution?: number
          status?: Database["public"]["Enums"]["payroll_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          total_allowances?: number
          total_deductions?: number
          undertime_deduction?: number
          undertime_minutes?: number
          unpaid_leave_days?: number
          updated_at?: string
          working_days?: number
        }
        Update: {
          absent_days?: number
          basic_salary?: number
          created_at?: string
          currency?: string
          days_present?: number
          employee_id?: string
          gross_salary?: number
          id?: string
          late_deduction?: number
          late_minutes?: number
          leave_deduction?: number
          net_salary?: number
          notes?: string | null
          other_deductions?: number
          overtime_hours?: number
          overtime_pay?: number
          pagibig_contribution?: number
          paid_leave_days?: number
          payroll_period_id?: string
          philhealth_contribution?: number
          rejection_reason?: string | null
          released_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sss_contribution?: number
          status?: Database["public"]["Enums"]["payroll_status"]
          submitted_at?: string | null
          submitted_by?: string | null
          total_allowances?: number
          total_deductions?: number
          undertime_deduction?: number
          undertime_minutes?: number
          unpaid_leave_days?: number
          updated_at?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payroll_records_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_records_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payroll_records_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          payroll_record_id: string
          payslip_number: string
          released_at: string | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          payroll_record_id: string
          payslip_number?: string
          released_at?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          payroll_record_id?: string
          payslip_number?: string
          released_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_payroll_record_id_fkey"
            columns: ["payroll_record_id"]
            isOneToOne: false
            referencedRelation: "payroll_records"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          module_id: string
          resource: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          module_id: string
          resource?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          module_id?: string
          resource?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      ph_locations: {
        Row: {
          code: string | null
          created_at: string
          id: string
          level: string
          name: string
          parent_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          level: string
          name: string
          parent_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          level?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ph_locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ph_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          store_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          store_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          store_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_audit_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_audit_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_audit_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_branch_settings: {
        Row: {
          branch_id: string
          created_at: string
          currency: string
          fees: Json
          owner_name: string | null
          payment_qr_url: string | null
          updated_at: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          currency?: string
          fees?: Json
          owner_name?: string | null
          payment_qr_url?: string | null
          updated_at?: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          currency?: string
          fees?: Json
          owner_name?: string | null
          payment_qr_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_branch_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_branch_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_branch_settings_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          department_id: string
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          normalized_name: string | null
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          normalized_name?: string | null
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          normalized_name?: string | null
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          buying_price: number
          category: string
          category_id: string
          created_at: string
          id: string
          image_url: string | null
          is_archived: boolean
          is_deleted: boolean
          is_demo: boolean
          name: string
          selling_price: number
          stock: number
          store_id: string
          updated_at: string
        }
        Insert: {
          buying_price?: number
          category?: string
          category_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_archived?: boolean
          is_deleted?: boolean
          is_demo?: boolean
          name: string
          selling_price?: number
          stock?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          buying_price?: number
          category?: string
          category_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_archived?: boolean
          is_deleted?: boolean
          is_demo?: boolean
          name?: string
          selling_price?: number
          stock?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_same_store_fk"
            columns: ["category_id", "store_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id", "store_id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          granted_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          rank: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          rank?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          rank?: number
          updated_at?: string
        }
        Relationships: []
      }
      salary_grades: {
        Row: {
          created_at: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          grade_name: string
          id: string
          max_salary: number
          min_salary: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          grade_name: string
          id?: string
          max_salary: number
          min_salary: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          grade_name?: string
          id?: string
          max_salary?: number
          min_salary?: number
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          category_id: string | null
          category_name: string
          cost_snapshot_source: string
          created_at: string
          id: string
          line_cogs: number
          line_gross_profit: number
          line_profit: number
          line_total: number
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          unit_cost_snapshot: number
          unit_price: number
          unit_profit: number
        }
        Insert: {
          category_id?: string | null
          category_name?: string
          cost_snapshot_source: string
          created_at?: string
          id?: string
          line_cogs: number
          line_gross_profit: number
          line_profit: number
          line_total: number
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          unit_cost_snapshot: number
          unit_price: number
          unit_profit: number
        }
        Update: {
          category_id?: string | null
          category_name?: string
          cost_snapshot_source?: string
          created_at?: string
          id?: string
          line_cogs?: number
          line_gross_profit?: number
          line_profit?: number
          line_total?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          unit_cost_snapshot?: number
          unit_price?: number
          unit_profit?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_tendered: number | null
          checkout_key: string | null
          created_at: string
          created_by: string | null
          fees: Json | null
          gross_profit: number
          gross_sales: number
          id: string
          net_profit: number
          net_sales: number
          payment_method: string
          payment_reference: string | null
          store_id: string
          store_paid_deductions: number
          subtotal: number | null
          total_amount: number
          total_cogs: number
          total_profit: number
        }
        Insert: {
          amount_tendered?: number | null
          checkout_key?: string | null
          created_at?: string
          created_by?: string | null
          fees?: Json | null
          gross_profit?: number
          gross_sales?: number
          id?: string
          net_profit?: number
          net_sales?: number
          payment_method?: string
          payment_reference?: string | null
          store_id: string
          store_paid_deductions?: number
          subtotal?: number | null
          total_amount?: number
          total_cogs?: number
          total_profit?: number
        }
        Update: {
          amount_tendered?: number | null
          checkout_key?: string | null
          created_at?: string
          created_by?: string | null
          fees?: Json | null
          gross_profit?: number
          gross_sales?: number
          id?: string
          net_profit?: number
          net_sales?: number
          payment_method?: string
          payment_reference?: string | null
          store_id?: string
          store_paid_deductions?: number
          subtotal?: number | null
          total_amount?: number
          total_cogs?: number
          total_profit?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          effect: Database["public"]["Enums"]["permission_effect"]
          permission_id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          effect: Database["public"]["Enums"]["permission_effect"]
          permission_id: string
          reason?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          effect?: Database["public"]["Enums"]["permission_effect"]
          permission_id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activated_at: string | null
          avatar_url: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          email: string
          employee_id: string | null
          full_name: string
          id: string
          invited_at: string | null
          last_login_at: string | null
          manager_id: string | null
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          username: string | null
        }
        Insert: {
          activated_at?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          email: string
          employee_id?: string | null
          full_name: string
          id: string
          invited_at?: string | null
          last_login_at?: string | null
          manager_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          activated_at?: string | null
          avatar_url?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          invited_at?: string | null
          last_login_at?: string | null
          manager_id?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      work_locations: {
        Row: {
          branch_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_locations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_locations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_locations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          break_minutes: number
          created_at: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          end_time: string
          id: string
          is_default: boolean
          name: string
          start_time: string
          updated_at: string
          working_days: number[]
        }
        Insert: {
          break_minutes?: number
          created_at?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_time: string
          id?: string
          is_default?: boolean
          name: string
          start_time: string
          updated_at?: string
          working_days?: number[]
        }
        Update: {
          break_minutes?: number
          created_at?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_time?: string
          id?: string
          is_default?: boolean
          name?: string
          start_time?: string
          updated_at?: string
          working_days?: number[]
        }
        Relationships: []
      }
    }
    Views: {
      finance_budget_status: {
        Row: {
          account_id: string | null
          alert_threshold: number | null
          allocated: number | null
          amount: number | null
          branch_id: string | null
          category_id: string | null
          created_at: string | null
          created_by: string | null
          department_id: string | null
          department_name: string | null
          end_date: string | null
          fiscal_year: number | null
          id: string | null
          name: string | null
          period: Database["public"]["Enums"]["finance_budget_period"] | null
          remaining: number | null
          reserved: number | null
          spent: number | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_budgets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "hr_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_budgets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_branches: {
        Row: {
          address: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hr_departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hr_employees: {
        Row: {
          address: string | null
          application_id: string | null
          barangay: string | null
          basic_salary: number | null
          benefits: string | null
          birth_date: string | null
          city: string | null
          civil_status: string | null
          created_at: string | null
          currency: string | null
          department_id: string | null
          email: string | null
          employee_number: string | null
          employment_status:
            | Database["public"]["Enums"]["employment_status"]
            | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          first_name: string | null
          gender: string | null
          hire_date: string | null
          id: string | null
          last_name: string | null
          middle_name: string | null
          nationality: string | null
          phone: string | null
          photo_url: string | null
          position_id: string | null
          province: string | null
          salary_grade_id: string | null
          updated_at: string | null
          work_schedule_id: string | null
        }
        Insert: {
          address?: string | null
          application_id?: string | null
          barangay?: string | null
          basic_salary?: number | null
          benefits?: string | null
          birth_date?: string | null
          city?: string | null
          civil_status?: string | null
          created_at?: string | null
          currency?: string | null
          department_id?: string | null
          email?: never
          employee_number?: string | null
          employment_status?: never
          employment_type?: never
          first_name?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string | null
          last_name?: string | null
          middle_name?: string | null
          nationality?: string | null
          phone?: string | null
          photo_url?: string | null
          position_id?: string | null
          province?: string | null
          salary_grade_id?: string | null
          updated_at?: string | null
          work_schedule_id?: string | null
        }
        Update: {
          address?: string | null
          application_id?: string | null
          barangay?: string | null
          basic_salary?: number | null
          benefits?: string | null
          birth_date?: string | null
          city?: string | null
          civil_status?: string | null
          created_at?: string | null
          currency?: string | null
          department_id?: string | null
          email?: never
          employee_number?: string | null
          employment_status?: never
          employment_type?: never
          first_name?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string | null
          last_name?: string | null
          middle_name?: string | null
          nationality?: string | null
          phone?: string | null
          photo_url?: string | null
          position_id?: string | null
          province?: string | null
          salary_grade_id?: string | null
          updated_at?: string | null
          work_schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "hr_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_salary_grade_id_fkey"
            columns: ["salary_grade_id"]
            isOneToOne: false
            referencedRelation: "salary_grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_work_schedule_id_fkey"
            columns: ["work_schedule_id"]
            isOneToOne: false
            referencedRelation: "work_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      org_chart: {
        Row: {
          branch_id: string | null
          department_id: string | null
          depth: number | null
          direct_reports: number | null
          email: string | null
          full_name: string | null
          id: string | null
          manager_id: string | null
          path: string | null
          status: Database["public"]["Enums"]["account_status"] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activated_at: string | null
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          employee_id: string | null
          full_name: string | null
          id: string | null
          invited_at: string | null
          last_login_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["hr_account_status"] | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string | null
          invited_at?: string | null
          last_login_at?: string | null
          role?: never
          status?: never
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string | null
          invited_at?: string | null
          last_login_at?: string | null
          role?: never
          status?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      store_memberships: {
        Row: {
          created_at: string | null
          created_by: string | null
          display_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["membership_role"] | null
          status: Database["public"]["Enums"]["membership_status"] | null
          store_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          id?: string | null
          role?: never
          status?: never
          store_id?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          id?: string | null
          role?: never
          status?: never
          store_id?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "store_memberships"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          created_at: string | null
          currency: string | null
          fees: Json | null
          id: string | null
          name: string | null
          owner_id: string | null
          owner_name: string | null
          payment_qr_url: string | null
          phone: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      adjust_product_stock: {
        Args: {
          _notes?: string
          _product_id: string
          _quantity_change: number
          _reason: string
          _store_id: string
        }
        Returns: {
          buying_price: number
          category: string
          category_id: string
          created_at: string
          id: string
          image_url: string | null
          is_archived: boolean
          is_deleted: boolean
          is_demo: boolean
          name: string
          selling_price: number
          stock: number
          store_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      applicant_address_parts: {
        Args: { p_application_id: string }
        Returns: {
          barangay: string
          city: string
          province: string
          street: string
        }[]
      }
      applicant_owns_file: {
        Args: {
          p_bucket: string
          p_email: string
          p_path: string
          p_reference_code: string
        }
        Returns: boolean
      }
      approve_change_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      checkout_sale: {
        Args: {
          _amount_tendered?: number
          _checkout_key?: string
          _items: Json
          _payment_method: string
          _payment_reference?: string
          _store_id: string
        }
        Returns: Json
      }
      core_to_hr_employment_type: {
        Args: { p_type: string }
        Returns: Database["public"]["Enums"]["employment_type"]
      }
      current_branch_id: { Args: never; Returns: string }
      current_employee_id: { Args: never; Returns: string }
      current_role_rank: { Args: never; Returns: number }
      delete_product_category: {
        Args: {
          _category_id: string
          _replacement_category_id?: string
          _store_id: string
        }
        Returns: number
      }
      finance_act_on_request: {
        Args: { p_action: string; p_remarks?: string; p_request_id: string }
        Returns: {
          amount: number
          branch_id: string | null
          budget_id: string | null
          category_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          expense_date: string | null
          id: string
          justification: string | null
          needed_by: string | null
          payment_schedule: string | null
          priority: string
          request_no: string | null
          requester_id: string
          status: Database["public"]["Enums"]["finance_request_status"]
          title: string
          type: Database["public"]["Enums"]["finance_request_type"]
          updated_at: string
          vendor_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "finance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finance_assign_budget: {
        Args: {
          p_budget_id: string
          p_category_id?: string
          p_payment_schedule?: string
          p_request_id: string
        }
        Returns: {
          amount: number
          branch_id: string | null
          budget_id: string | null
          category_id: string | null
          created_at: string
          department_id: string | null
          description: string | null
          expense_date: string | null
          id: string
          justification: string | null
          needed_by: string | null
          payment_schedule: string | null
          priority: string
          request_no: string | null
          requester_id: string
          status: Database["public"]["Enums"]["finance_request_status"]
          title: string
          type: Database["public"]["Enums"]["finance_request_type"]
          updated_at: string
          vendor_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "finance_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finance_can_act_on: {
        Args: {
          p_status: Database["public"]["Enums"]["finance_request_status"]
        }
        Returns: boolean
      }
      finance_stage_permission: {
        Args: {
          p_status: Database["public"]["Enums"]["finance_request_status"]
        }
        Returns: string
      }
      generate_application_reference: { Args: never; Returns: string }
      generate_employee_number: { Args: never; Returns: string }
      generate_payslip_number: { Args: never; Returns: string }
      get_my_transactions: {
        Args: {
          _end_at: string
          _limit_count?: number
          _start_at: string
          _store_id: string
        }
        Returns: {
          amount_tendered: number
          created_at: string
          fees: Json
          id: string
          payment_method: string
          payment_reference: string
          sale_items: Json
          subtotal: number
          total_amount: number
        }[]
      }
      get_pos_categories: {
        Args: { _store_id: string }
        Returns: {
          color: string
          icon: string
          id: string
          name: string
          sort_order: number
        }[]
      }
      get_pos_products: {
        Args: { _store_id: string }
        Returns: {
          category: string
          category_id: string
          id: string
          image_url: string
          is_deleted: boolean
          name: string
          selling_price: number
          stock: number
          store_id: string
        }[]
      }
      get_pos_store: { Args: { _store_id: string }; Returns: Json }
      has_any_permission: { Args: { _permissions: string[] }; Returns: boolean }
      has_module_access: { Args: { _module_key: string }; Returns: boolean }
      has_permission: { Args: { _permission: string }; Returns: boolean }
      has_role: { Args: { _role_key: string }; Returns: boolean }
      hr_apply_role: {
        Args: {
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
        }
        Returns: undefined
      }
      hr_role_for: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_active_employee: { Args: never; Returns: boolean }
      is_active_staff: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_hr_manager_or_admin: { Args: never; Returns: boolean }
      is_hr_staff_or_admin: { Args: never; Returns: boolean }
      is_manager_of: { Args: { p_user: string }; Returns: boolean }
      log_activity: {
        Args: {
          _action: string
          _description?: string
          _entity_id?: string
          _entity_type?: string
          _module_key?: string
          _new_values?: Json
          _old_values?: Json
        }
        Returns: string
      }
      lookup_application: {
        Args: { p_email: string; p_reference_code: string }
        Returns: {
          account_activated_at: string
          account_email: string
          applicant_name: string
          contract_additional_notes: string
          contract_company_policies: string
          contract_file_path: string
          contract_id: string
          contract_signed_at: string
          contract_start_date: string
          contract_status: Database["public"]["Enums"]["contract_status"]
          contract_terms: string
          department_name: string
          deployment_branch: string
          deployment_date: string
          deployment_remarks: string
          deployment_schedule_days: number[]
          deployment_schedule_end: string
          deployment_schedule_name: string
          deployment_schedule_start: string
          deployment_work_location: string
          documents: Json
          employee_basic_salary: number
          employee_benefits: string
          employee_currency: string
          employee_department: string
          employee_email: string
          employee_employment_status: Database["public"]["Enums"]["employment_status"]
          employee_employment_type: Database["public"]["Enums"]["employment_type"]
          employee_hire_date: string
          employee_number: string
          employee_position: string
          interview_location: string
          interview_meeting_link: string
          interview_mode: string
          interview_scheduled_at: string
          interview_status: Database["public"]["Enums"]["interview_status"]
          interview_type: Database["public"]["Enums"]["interview_type"]
          offer_additional_compensation: string
          offer_benefits: string
          offer_currency: string
          offer_employment_type: Database["public"]["Enums"]["employment_type"]
          offer_id: string
          offer_salary: number
          offer_start_date: string
          offer_status: Database["public"]["Enums"]["offer_status"]
          offer_working_days: string
          offer_working_hours: string
          position_employment_type: Database["public"]["Enums"]["employment_type"]
          position_title: string
          reference_code: string
          status: Database["public"]["Enums"]["application_status"]
          submitted_at: string
        }[]
      }
      my_employee_id: { Args: never; Returns: string }
      my_modules: {
        Args: never
        Returns: {
          icon: string
          key: string
          name: string
          route: string
          sort_order: number
        }[]
      }
      my_permissions: {
        Args: never
        Returns: {
          permission_key: string
        }[]
      }
      my_roles: {
        Args: never
        Returns: {
          rank: number
          role_key: string
          role_name: string
        }[]
      }
      pos_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      pos_membership_role_for: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["membership_role"]
      }
      reassign_category_products: {
        Args: {
          _category_id: string
          _replacement_category_id: string
          _store_id: string
        }
        Returns: number
      }
      reassign_category_products_subset: {
        Args: {
          _category_id: string
          _product_ids: string[]
          _replacement_category_id: string
          _store_id: string
        }
        Returns: number
      }
      recompute_payroll_period_status: {
        Args: { p_period_id: string }
        Returns: undefined
      }
      reject_change_request: {
        Args: { p_reason: string; p_request_id: string }
        Returns: undefined
      }
      reorder_product_category: {
        Args: { _category_id: string; _direction: number; _store_id: string }
        Returns: number
      }
      respond_to_job_offer: {
        Args: {
          p_decision: string
          p_decline_notes?: string
          p_decline_reason?: string
          p_email: string
          p_reference_code: string
        }
        Returns: string
      }
      restock_product: {
        Args: {
          _notes?: string
          _product_id: string
          _purchase_unit_cost: number
          _quantity: number
          _store_id: string
        }
        Returns: {
          buying_price: number
          category: string
          category_id: string
          created_at: string
          id: string
          image_url: string | null
          is_archived: boolean
          is_deleted: boolean
          is_demo: boolean
          name: string
          selling_price: number
          stock: number
          store_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      secure_checkout: {
        Args: {
          _amount_tendered?: number
          _checkout_key?: string
          _items: Json
          _payment_method: string
          _payment_reference?: string
          _store_id: string
        }
        Returns: Json
      }
      submit_job_application:
        | {
            Args: {
              p_address: string
              p_cover_letter?: string
              p_email: string
              p_first_name: string
              p_job_posting_id: string
              p_last_name: string
              p_phone: string
              p_resume_path: string
            }
            Returns: {
              applicant_id: string
              application_id: string
            }[]
          }
        | {
            Args: {
              p_address: string
              p_barangay?: string
              p_city?: string
              p_cover_letter?: string
              p_email: string
              p_first_name: string
              p_job_posting_id: string
              p_last_name: string
              p_middle_name?: string
              p_phone: string
              p_province?: string
              p_resume_path: string
            }
            Returns: {
              applicant_id: string
              application_id: string
              reference_code: string
            }[]
          }
      sync_employment_statuses: { Args: never; Returns: undefined }
      user_is_ancestor_of: {
        Args: { p_manager: string; p_user: string }
        Returns: boolean
      }
      user_management_chain: {
        Args: { p_user: string }
        Returns: {
          depth: number
          user_id: string
        }[]
      }
      user_reports: {
        Args: { p_manager: string }
        Returns: {
          depth: number
          user_id: string
        }[]
      }
    }
    Enums: {
      account_status: "invited" | "active" | "suspended" | "deactivated"
      app_role: "admin" | "owner"
      application_status:
        | "submitted"
        | "under_review"
        | "qualified"
        | "rejected"
        | "interview_scheduled"
        | "offered"
        | "hired"
        | "closed"
        | "deployed"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "on_leave"
        | "half_day"
        | "rest_day"
        | "official_business"
        | "work_from_home"
      change_request_operation: "create" | "update" | "delete"
      change_request_status: "pending" | "approved" | "rejected"
      contract_status: "draft" | "printed" | "signed"
      employment_status:
        | "active"
        | "on_leave"
        | "resigned"
        | "terminated"
        | "retired"
      employment_type: "regular" | "part_time"
      finance_approval_action:
        | "submitted"
        | "validated"
        | "final_approved"
        | "completed"
        | "returned"
        | "rejected"
        | "cancelled"
      finance_budget_period: "monthly" | "quarterly" | "yearly"
      finance_payment_method:
        | "bank_transfer"
        | "check"
        | "cash"
        | "gcash"
        | "credit_card"
      finance_request_status:
        | "draft"
        | "pending_finance_staff"
        | "pending_finance_manager"
        | "pending_accountant"
        | "completed"
        | "returned"
        | "rejected"
        | "cancelled"
      finance_request_type: "purchase" | "reimbursement"
      finance_transaction_type: "income" | "expense"
      hr_account_status: "active" | "inactive"
      interview_status:
        | "scheduled"
        | "passed"
        | "failed"
        | "completed"
        | "cancelled"
      interview_type: "initial" | "final"
      job_posting_status: "draft" | "open" | "closed"
      leave_request_status: "pending" | "approved" | "rejected" | "cancelled"
      membership_role: "admin" | "manager" | "cashier"
      membership_status: "active" | "inactive"
      offer_status: "pending" | "accepted" | "declined"
      payroll_status:
        | "draft"
        | "generated"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "released"
      permission_effect: "allow" | "deny"
      report_format: "pdf" | "docx" | "excel"
      user_role: "admin" | "hr_staff" | "employee" | "hr_manager"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["invited", "active", "suspended", "deactivated"],
      app_role: ["admin", "owner"],
      application_status: [
        "submitted",
        "under_review",
        "qualified",
        "rejected",
        "interview_scheduled",
        "offered",
        "hired",
        "closed",
        "deployed",
      ],
      attendance_status: [
        "present",
        "absent",
        "late",
        "on_leave",
        "half_day",
        "rest_day",
        "official_business",
        "work_from_home",
      ],
      change_request_operation: ["create", "update", "delete"],
      change_request_status: ["pending", "approved", "rejected"],
      contract_status: ["draft", "printed", "signed"],
      employment_status: [
        "active",
        "on_leave",
        "resigned",
        "terminated",
        "retired",
      ],
      employment_type: ["regular", "part_time"],
      finance_approval_action: [
        "submitted",
        "validated",
        "final_approved",
        "completed",
        "returned",
        "rejected",
        "cancelled",
      ],
      finance_budget_period: ["monthly", "quarterly", "yearly"],
      finance_payment_method: [
        "bank_transfer",
        "check",
        "cash",
        "gcash",
        "credit_card",
      ],
      finance_request_status: [
        "draft",
        "pending_finance_staff",
        "pending_finance_manager",
        "pending_accountant",
        "completed",
        "returned",
        "rejected",
        "cancelled",
      ],
      finance_request_type: ["purchase", "reimbursement"],
      finance_transaction_type: ["income", "expense"],
      hr_account_status: ["active", "inactive"],
      interview_status: [
        "scheduled",
        "passed",
        "failed",
        "completed",
        "cancelled",
      ],
      interview_type: ["initial", "final"],
      job_posting_status: ["draft", "open", "closed"],
      leave_request_status: ["pending", "approved", "rejected", "cancelled"],
      membership_role: ["admin", "manager", "cashier"],
      membership_status: ["active", "inactive"],
      offer_status: ["pending", "accepted", "declined"],
      payroll_status: [
        "draft",
        "generated",
        "pending_approval",
        "approved",
        "rejected",
        "released",
      ],
      permission_effect: ["allow", "deny"],
      report_format: ["pdf", "docx", "excel"],
      user_role: ["admin", "hr_staff", "employee", "hr_manager"],
    },
  },
} as const

