// =====================================================
// SCHEMA DE BASE DE DATOS - SUPABASE
// =====================================================
// Archivo generado basado en el schema real de Supabase
// Contiene todas las interfaces TypeScript para las tablas

// =====================================================
// ENUMS Y TIPOS ESPECÍFICOS
// =====================================================

export type ContactoEstado = 'Abierto' | 'Cerrado';
export type Antiguedad = 'Nuevo' | 'Viejo';
export type MessageType = 'human' | 'ai' | 'member';
export type MessageOrigin = 'note' | 'crm';

// =====================================================
// TABLA: contactos
// =====================================================

export interface Contacto {
  session_id: string;                    // PK - ID único del contacto (WhatsApp)
  name: string;                          // Nombre del contacto
  created_at: string | null;             // Timestamp de creación
  etiquetas: Record<string, any> | null; // JSONB - Etiquetas del contacto
  is_paused: boolean | null;             // Si la conversación está pausada
  assigned_to: string | null;            // UUID - FK a auth.users (profiles)
  last_viewed_at: string | null;         // Última vez que se vio la conversación
  last_customer_message: string | null;  // Último mensaje del cliente
  last_customer_message_at: string | null; // Timestamp del último mensaje del cliente
  estado: ContactoEstado;                // Estado de la conversación
  pause_until: string | null;            // Hasta cuándo está pausada
  antiguedad: Antiguedad;                // Antigüedad del contacto
}

// Versión para inserts (campos opcionales)
export interface ContactoInsert {
  session_id: string;
  name: string;
  created_at?: string | null;
  etiquetas?: Record<string, any> | null;
  is_paused?: boolean | null;
  assigned_to?: string | null;
  last_viewed_at?: string | null;
  last_customer_message?: string | null;
  last_customer_message_at?: string | null;
  estado?: ContactoEstado;
  pause_until?: string | null;
  antiguedad?: Antiguedad;
}

// Versión para updates (todos los campos opcionales excepto PK)
export interface ContactoUpdate {
  name?: string;
  created_at?: string | null;
  etiquetas?: Record<string, any> | null;
  is_paused?: boolean | null;
  assigned_to?: string | null;
  last_viewed_at?: string | null;
  last_customer_message?: string | null;
  last_customer_message_at?: string | null;
  estado?: ContactoEstado;
  pause_until?: string | null;
  antiguedad?: Antiguedad;
}

// =====================================================
// TABLA: conversaciones
// =====================================================

export interface MessageEtiquetas {
  imagen?: boolean;
  audio?: boolean;
  video?: boolean;
  fotos?: boolean;
  response?: string;
  [key: string]: any;
}

export interface MessageContent {
  type: MessageType;
  content: string;
  additional_kwargs: {
    origin?: MessageOrigin;
    [key: string]: any;
  };
  response_metadata: Record<string, any>;
  etiquetas?: MessageEtiquetas;
}

export interface Conversacion {
  id: number;                    // PK - ID autoincremental
  session_id: string;            // FK a contactos.session_id
  message: MessageContent;       // JSONB - Contenido del mensaje
  created_at: string;            // Timestamp sin zona horaria
}

// Versión para inserts
export interface ConversacionInsert {
  session_id: string;
  message: MessageContent;
  created_at?: string;
}

// =====================================================
// TABLA: plantillas
// =====================================================

export interface Plantilla {
  name: string;                  // PK - Nombre único de la plantilla
  language: string;              // Idioma de la plantilla
  category: string;              // Categoría de la plantilla
  body_text: string;             // Texto principal de la plantilla
  header_text: string | null;    // Texto del encabezado (opcional)
  footer_text: string | null;    // Texto del pie (opcional)
}

// Versión para inserts
export interface PlantillaInsert {
  name: string;
  language: string;
  category: string;
  body_text: string;
  header_text?: string | null;
  footer_text?: string | null;
}

// Versión para updates (todos opcionales excepto PK)
export interface PlantillaUpdate {
  language?: string;
  category?: string;
  body_text?: string;
  header_text?: string | null;
  footer_text?: string | null;
}

// =====================================================
// TABLA: profiles
// =====================================================

export interface Profile {
  id: string;                    // PK - UUID, FK a auth.users
  name: string;                  // Nombre del usuario
  email: string | null;          // Email del usuario
  avatar_url: string | null;     // URL del avatar
}

// Versión para inserts
export interface ProfileInsert {
  id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
}

// Versión para updates
export interface ProfileUpdate {
  name?: string;
  email?: string | null;
  avatar_url?: string | null;
}

// =====================================================
// TIPOS PARA FILTROS Y CONSULTAS
// =====================================================

export type FilterType = "No Asignado" | "Tú" | "Equipo" | "Todos";
export type StatusFilter = "Abierto" | "Cerrado" | "Todos";
export type SortOrder = "reciente" | "antiguo";
export type MediaType = "audio" | "image" | "video" | null;

// =====================================================
// INTERFACES PARA COMPONENTES Y VISTAS
// =====================================================

// Para notas específicamente
export interface Note {
  id: number;
  message: {
    content: string;
    additional_kwargs: {
      origin?: string;
    };
  };
  created_at?: string;
}

// Para contactos en listas (versión extendida)
export interface ContactWithAssignment extends Contacto {
  // Campos adicionales que podrían calcularse o agregarse
}

// Para real-time updates
export interface ContactoRealtimeUpdate {
  session_id: string;
  assigned_to: string | null;
  estado: ContactoEstado;
  is_paused?: boolean;
  etiquetas?: Record<string, any>;
  last_viewed_at?: string;
  pause_until?: string | null;
}

// =====================================================
// TIPOS PARA SUPABASE STORAGE
// =====================================================

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
    lastModified: string;
    contentLength: number;
    httpStatusCode: number;
  };
}

// =====================================================
// TIPOS PARA RESPUESTAS DE API
// =====================================================

export interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

export interface SupabaseMultiResponse<T> {
  data: T[] | null;
  error: any;
  count?: number;
}

// =====================================================
// CONFIGURACIÓN DE TABLAS PARA SUPABASE CLIENT
// =====================================================

export interface Database {
  public: {
    Tables: {
      contactos: {
        Row: Contacto;
        Insert: ContactoInsert;
        Update: ContactoUpdate;
      };
      conversaciones: {
        Row: Conversacion;
        Insert: ConversacionInsert;
        Update: never; // No se actualizan conversaciones
      };
      plantillas: {
        Row: Plantilla;
        Insert: PlantillaInsert;
        Update: PlantillaUpdate;
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
    };
    Views: {
      // Aquí se pueden definir vistas si las hay
    };
    Functions: {
      // Aquí se pueden definir funciones de PostgreSQL si las hay
      update_last_customer_message: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      contacto_estado: ContactoEstado;
    };
  };
}

// =====================================================
// ALIASES PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
// =====================================================

// Aliases para mantener compatibilidad con interfaces existentes
export type Contact = Contacto;
export type Conversation = Conversacion;
export type Template = Plantilla; 