
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "branches": {
                  Row: {
                    "code": string,"id": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"id"?: string,"label": string
                  }
                  Update: {
                    "code"?: string,"id"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"companies": {
                  Row: {
                    "created_at": string | null,"id": string,"logo_url": string | null,"name": string,"sector": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"id"?: string,"logo_url"?: string | null,"name": string,"sector"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"id"?: string,"logo_url"?: string | null,"name"?: string,"sector"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"drive_branches": {
                  Row: {
                    "branch_id": string,"drive_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "branch_id": string,"drive_id": string
                  }
                  Update: {
                    "branch_id"?: string,"drive_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "drive_branches_branch_id_fkey"
      columns: ["branch_id"]
isOneToOne: false
      referencedRelation: "branches"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drive_branches_drive_id_fkey"
      columns: ["drive_id"]
isOneToOne: false
      referencedRelation: "drives"
      referencedColumns: ["id"]
    }
                  ]
                },"drives": {
                  Row: {
                    "company_id": string,"created_at": string | null,"created_by": string | null,"drive_date": string | null,"eligibility_cgpa": number | null,"grad_years": (number)[],"id": string,"location": string | null,"max_backlogs": number,"min_10th_pct": number | null,"min_12th_pct": number | null,"role_id": string,"status": string,"title": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string | null,"created_by"?: string | null,"drive_date"?: string | null,"eligibility_cgpa"?: number | null,"grad_years"?: (number)[],"id"?: string,"location"?: string | null,"max_backlogs"?: number,"min_10th_pct"?: number | null,"min_12th_pct"?: number | null,"role_id": string,"status"?: string,"title": string,"updated_at"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string | null,"created_by"?: string | null,"drive_date"?: string | null,"eligibility_cgpa"?: number | null,"grad_years"?: (number)[],"id"?: string,"location"?: string | null,"max_backlogs"?: number,"min_10th_pct"?: number | null,"min_12th_pct"?: number | null,"role_id"?: string,"status"?: string,"title"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "drives_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drives_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "drives_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                },"experience_resources": {
                  Row: {
                    "experience_id": string,"resource_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "experience_id": string,"resource_id": string
                  }
                  Update: {
                    "experience_id"?: string,"resource_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "experience_resources_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "community_tips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_resources_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_resources_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "public_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_resources_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"experience_topics": {
                  Row: {
                    "experience_id": string,"topic_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "experience_id": string,"topic_id": string
                  }
                  Update: {
                    "experience_id"?: string,"topic_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "experience_topics_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "community_tips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_topics_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_topics_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "public_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_topics_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"experiences": {
                  Row: {
                    "company_id": string,"created_at": string | null,"drive_id": string | null,"evidence_path": string | null,"id": string,"preparation_timeline": string | null,"rejection_reason": string | null,"role_id": string,"rounds_summary": string | null,"status": string,"updated_at": string | null,"user_id": string | null,"verified_at": string | null,"verified_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id": string,"created_at"?: string | null,"drive_id"?: string | null,"evidence_path"?: string | null,"id"?: string,"preparation_timeline"?: string | null,"rejection_reason"?: string | null,"role_id": string,"rounds_summary"?: string | null,"status"?: string,"updated_at"?: string | null,"user_id"?: string | null,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Update: {
                    "company_id"?: string,"created_at"?: string | null,"drive_id"?: string | null,"evidence_path"?: string | null,"id"?: string,"preparation_timeline"?: string | null,"rejection_reason"?: string | null,"role_id"?: string,"rounds_summary"?: string | null,"status"?: string,"updated_at"?: string | null,"user_id"?: string | null,"verified_at"?: string | null,"verified_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "experiences_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiences_drive_id_fkey"
      columns: ["drive_id"]
isOneToOne: false
      referencedRelation: "drives"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiences_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiences_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiences_verified_by_fkey"
      columns: ["verified_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_experiences": {
                  Row: {
                    "experience_id": string,"plan_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "experience_id": string,"plan_id": string
                  }
                  Update: {
                    "experience_id"?: string,"plan_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_experiences_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "community_tips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_experiences_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_experiences_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "public_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_experiences_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "prep_plans"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_item_resources": {
                  Row: {
                    "plan_item_id": string,"resource_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "plan_item_id": string,"resource_id": string
                  }
                  Update: {
                    "plan_item_id"?: string,"resource_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_item_resources_plan_item_id_fkey"
      columns: ["plan_item_id"]
isOneToOne: false
      referencedRelation: "plan_items"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_item_resources_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_items": {
                  Row: {
                    "done": boolean,"done_at": string | null,"id": string,"label": string,"plan_id": string,"position": number,"topic_id": string | null,"week": number
                  }
                  ComputedFields: never
                  Insert: {
                    "done"?: boolean,"done_at"?: string | null,"id"?: string,"label": string,"plan_id": string,"position": number,"topic_id"?: string | null,"week": number
                  }
                  Update: {
                    "done"?: boolean,"done_at"?: string | null,"id"?: string,"label"?: string,"plan_id"?: string,"position"?: number,"topic_id"?: string | null,"week"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_items_plan_id_fkey"
      columns: ["plan_id"]
isOneToOne: false
      referencedRelation: "prep_plans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_items_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"prep_plans": {
                  Row: {
                    "created_at": string | null,"drive_id": string,"id": string,"updated_at": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string | null,"drive_id": string,"id"?: string,"updated_at"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string | null,"drive_id"?: string,"id"?: string,"updated_at"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "prep_plans_drive_id_fkey"
      columns: ["drive_id"]
isOneToOne: false
      referencedRelation: "drives"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "prep_plans_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "backlogs": number,"branch_id": string | null,"cgpa": number | null,"created_at": string | null,"grad_year": number | null,"id": string,"pct_10th": number | null,"pct_12th": number | null,"role": string
                  }
                  ComputedFields: never
                  Insert: {
                    "backlogs"?: number,"branch_id"?: string | null,"cgpa"?: number | null,"created_at"?: string | null,"grad_year"?: number | null,"id": string,"pct_10th"?: number | null,"pct_12th"?: number | null,"role"?: string
                  }
                  Update: {
                    "backlogs"?: number,"branch_id"?: string | null,"cgpa"?: number | null,"created_at"?: string | null,"grad_year"?: number | null,"id"?: string,"pct_10th"?: number | null,"pct_12th"?: number | null,"role"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_branch_id_fkey"
      columns: ["branch_id"]
isOneToOne: false
      referencedRelation: "branches"
      referencedColumns: ["id"]
    }
                  ]
                },"resources": {
                  Row: {
                    "company_id": string | null,"created_at": string | null,"id": string,"title": string,"topic_id": string | null,"type": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company_id"?: string | null,"created_at"?: string | null,"id"?: string,"title": string,"topic_id"?: string | null,"type": string,"url": string
                  }
                  Update: {
                    "company_id"?: string | null,"created_at"?: string | null,"id"?: string,"title"?: string,"topic_id"?: string | null,"type"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "resources_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "resources_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"roles": {
                  Row: {
                    "aliases": (string)[],"created_at": string | null,"id": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aliases"?: (string)[],"created_at"?: string | null,"id"?: string,"label": string
                  }
                  Update: {
                    "aliases"?: (string)[],"created_at"?: string | null,"id"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                },"round_resources": {
                  Row: {
                    "resource_id": string,"round_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "resource_id": string,"round_id": string
                  }
                  Update: {
                    "resource_id"?: string,"round_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "round_resources_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "round_resources_round_id_fkey"
      columns: ["round_id"]
isOneToOne: false
      referencedRelation: "rounds"
      referencedColumns: ["id"]
    }
                  ]
                },"round_topics": {
                  Row: {
                    "round_id": string,"topic_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "round_id": string,"topic_id": string
                  }
                  Update: {
                    "round_id"?: string,"topic_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "round_topics_round_id_fkey"
      columns: ["round_id"]
isOneToOne: false
      referencedRelation: "rounds"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "round_topics_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"rounds": {
                  Row: {
                    "description": string | null,"drive_id": string,"id": string,"name": string,"position": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"drive_id": string,"id"?: string,"name": string,"position": number
                  }
                  Update: {
                    "description"?: string | null,"drive_id"?: string,"id"?: string,"name"?: string,"position"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "rounds_drive_id_fkey"
      columns: ["drive_id"]
isOneToOne: false
      referencedRelation: "drives"
      referencedColumns: ["id"]
    }
                  ]
                },"topics": {
                  Row: {
                    "aliases": (string)[],"category": string,"created_at": string | null,"id": string,"label": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aliases"?: (string)[],"category": string,"created_at"?: string | null,"id"?: string,"label": string
                  }
                  Update: {
                    "aliases"?: (string)[],"category"?: string,"created_at"?: string | null,"id"?: string,"label"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "community_tips": {
                  Row: {
                    "company_id": string,"created_at": string | null,"id": string,"role_id": string,"rounds_summary": string | null
                  }
                  ComputedFields: never
                  Insert: {
                           "company_id"?: string | null,"created_at"?: string | null,"id"?: string | null,"role_id"?: string | null,"rounds_summary"?: string | null
                         }
                        Update: {
                           "company_id"?: string | null,"created_at"?: string | null,"id"?: string | null,"role_id"?: string | null,"rounds_summary"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "experiences_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiences_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                },"public_experience_resources": {
                  Row: {
                    "experience_id": string,"resource_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "experience_resources_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "community_tips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_resources_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_resources_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "public_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_resources_resource_id_fkey"
      columns: ["resource_id"]
isOneToOne: false
      referencedRelation: "resources"
      referencedColumns: ["id"]
    }
                  ]
                },"public_experience_topics": {
                  Row: {
                    "experience_id": string,"topic_id": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "experience_topics_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "community_tips"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_topics_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_topics_experience_id_fkey"
      columns: ["experience_id"]
isOneToOne: false
      referencedRelation: "public_experiences"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experience_topics_topic_id_fkey"
      columns: ["topic_id"]
isOneToOne: false
      referencedRelation: "topics"
      referencedColumns: ["id"]
    }
                  ]
                },"public_experiences": {
                  Row: {
                    "author_role": string | null,"company_id": string,"created_at": string | null,"drive_id": string | null,"grad_year": number | null,"has_evidence": boolean | null,"id": string,"preparation_timeline": string | null,"role_id": string,"rounds_summary": string | null,"verified_at": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "experiences_company_id_fkey"
      columns: ["company_id"]
isOneToOne: false
      referencedRelation: "companies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiences_drive_id_fkey"
      columns: ["drive_id"]
isOneToOne: false
      referencedRelation: "drives"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "experiences_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"save_drive":
{ Args: { "p_branch_ids": (string)[],"p_company_id": string,"p_drive_date": string,"p_drive_id": string,"p_eligibility_cgpa": number,"p_grad_years": (number)[],"p_location": string,"p_max_backlogs": number,"p_min_10th_pct": number,"p_min_12th_pct": number,"p_role_id": string,"p_rounds": Json,"p_status": string,"p_title": string }; Returns: string
                           },
"save_plan":
{ Args: { "p_drive_id": string,"p_experience_ids": (string)[],"p_items": Json }; Returns: string
                           },
"submit_experience":
{ Args: { "p_company_id": string,"p_drive_id": string,"p_evidence_path": string,"p_resource_ids": (string)[],"p_role_id": string,"p_rounds_summary": string,"p_timeline": string,"p_topic_ids": (string)[] }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
