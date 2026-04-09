// Tipos de base de datos — formato manual alineado con Supabase JS v2.
// Para regenerar automáticamente:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts
//
// Cambios clave respecto a v1:
//   - Views/Functions usan { [_ in never]: never } en lugar de Record<string, never>
//   - Cada tabla tiene Relationships[] (requerido por el inferenciador de joins)
//   - Se agrega CompositeTypes (requerido por la estructura de GenericSchema v2)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:         string
          full_name:  string
          role:       'cashier' | 'kitchen' | 'admin'
          is_active:  boolean
          created_at: string
        }
        Insert: {
          id:          string
          full_name:   string
          role?:       'cashier' | 'kitchen' | 'admin'
          is_active?:  boolean
          created_at?: string
        }
        Update: {
          full_name?: string
          role?:      'cashier' | 'kitchen' | 'admin'
          is_active?: boolean
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          id:         string
          number:     number
          name:       string | null
          capacity:   number
          status:     'available' | 'occupied' | 'requesting_bill'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?:       string
          number:    number
          name?:     string | null
          capacity?: number
          status?:   'available' | 'occupied' | 'requesting_bill'
        }
        Update: {
          number?:   number
          name?:     string | null
          capacity?: number
          status?:   'available' | 'occupied' | 'requesting_bill'
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          id:         string
          name:       string
          sort_order: number
          is_active:  boolean
          created_at: string
        }
        Insert: {
          id?:         string
          name:        string
          sort_order?: number
          is_active?:  boolean
        }
        Update: {
          name?:       string
          sort_order?: number
          is_active?:  boolean
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id:               string
          category_id:      string
          name:             string
          description:      string | null
          price:            number
          is_available:     boolean
          sort_order:       number
          base_ingredients: Json
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:               string
          category_id:       string
          name:              string
          description?:      string | null
          price:             number
          is_available?:     boolean
          sort_order?:       number
          base_ingredients?: Json
        }
        Update: {
          category_id?:      string
          name?:             string
          description?:      string | null
          price?:            number
          is_available?:     boolean
          sort_order?:       number
          base_ingredients?: Json
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      orders: {
        Row: {
          id:               string
          table_id:         string | null
          cashier_id:       string
          customer_name:    string
          service_type:     'comer_aqui' | 'para_llevar'
          status:           'pending' | 'preparing' | 'ready' | 'delivered' | 'closed' | 'cancelled'
          kitchen_station:  'station_1' | 'station_2'
          total:            number
          notes:            string | null
          created_at:       string
          updated_at:       string
          closed_at:        string | null
        }
        Insert: {
          id?:               string
          table_id?:         string | null
          cashier_id:        string
          customer_name:     string
          service_type?:     'comer_aqui' | 'para_llevar'
          status?:           'pending' | 'preparing' | 'ready' | 'delivered' | 'closed' | 'cancelled'
          kitchen_station?:  'station_1' | 'station_2'
          total?:            number
          notes?:            string | null
          closed_at?:        string | null
        }
        Update: {
          customer_name?:   string
          service_type?:    'comer_aqui' | 'para_llevar'
          status?:          'pending' | 'preparing' | 'ready' | 'delivered' | 'closed' | 'cancelled'
          kitchen_station?: 'station_1' | 'station_2'
          total?:           number
          notes?:           string | null
          closed_at?:       string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "restaurant_tables"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id:            string
          order_id:      string
          menu_item_id:  string
          quantity:      number
          unit_price:    number
          subtotal:      number
          modifications: Json
          notes:         string | null
          created_at:    string
        }
        Insert: {
          id?:            string
          order_id:       string
          menu_item_id:   string
          quantity:       number
          unit_price:     number
          subtotal:       number
          modifications?: Json
          notes?:         string | null
        }
        Update: {
          quantity?:      number
          modifications?: Json
          notes?:         string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role:    'cashier' | 'kitchen' | 'admin'
      table_status: 'available' | 'occupied' | 'requesting_bill'
      order_status:     'pending' | 'preparing' | 'ready' | 'delivered' | 'closed' | 'cancelled'
      kitchen_station:  'station_1' | 'station_2'
      service_type: 'comer_aqui' | 'para_llevar'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
