/**
 * Get database schema context for AI generation
 * This allows Gemini to generate code that matches user's actual database structure
 */

import { createClient } from "@supabase/supabase-js";

interface DatabaseContext {
  isConnected: boolean;
  schemaText: string;
  tables: string[];
  error?: string;
}

// Common table names to probe
const COMMON_TABLES = [
  "profiles",
  "users", 
  "products",
  "orders",
  "items",
  "posts",
  "comments",
  "categories",
  "settings",
  "subscriptions",
];

/**
 * Get secrets from localStorage for a project
 */
export function getProjectSecrets(projectId: string): { supabaseUrl: string; supabaseAnonKey: string } | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(`replay_secrets_${projectId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Try to detect columns from a sample row
 */
function detectColumns(sampleRow: any): string[] {
  if (!sampleRow || typeof sampleRow !== 'object') return [];
  return Object.keys(sampleRow).map(key => {
    const value = sampleRow[key];
    let type: string = typeof value;
    if (value === null) type = 'nullable';
    else if (Array.isArray(value)) type = 'array';
    else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) type = 'timestamp';
    return `${key}: ${type}`;
  });
}

/**
 * Fetch database schema from user's Supabase instance
 * Uses probing approach since information_schema is not accessible via REST API
 */
export async function getDatabaseContext(projectId: string): Promise<DatabaseContext> {
  const secrets = getProjectSecrets(projectId);
  
  if (!secrets?.supabaseUrl || !secrets?.supabaseAnonKey) {
    return {
      isConnected: false,
      schemaText: "",
      tables: [],
    };
  }

  // Validate URL format
  if (!secrets.supabaseUrl.includes('.supabase.co')) {
    return {
      isConnected: false,
      schemaText: "",
      tables: [],
      error: "Invalid Supabase URL",
    };
  }

  try {
    // First verify connection with a direct fetch
    const testUrl = `${secrets.supabaseUrl}/rest/v1/`;
    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': secrets.supabaseAnonKey,
        'Authorization': `Bearer ${secrets.supabaseAnonKey}`,
      },
    });

    if (!testResponse.ok && testResponse.status !== 404) {
      return {
        isConnected: false,
        schemaText: "",
        tables: [],
        error: `Connection failed: ${testResponse.status}`,
      };
    }

    const supabase = createClient(secrets.supabaseUrl, secrets.supabaseAnonKey);
    const foundTables: { name: string; columns: string[]; rowCount: number }[] = [];
    
    // Probe common tables to discover schema
    for (const tableName of COMMON_TABLES) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: false })
          .limit(1);
        
        if (!error && data) {
          const columns = data.length > 0 ? detectColumns(data[0]) : [];
          foundTables.push({
            name: tableName,
            columns,
            rowCount: count || data.length,
          });
        }
      } catch {
        // Table doesn't exist or not accessible, skip
      }
    }

    if (foundTables.length === 0) {
      // Try profiles as fallback (most common)
      const { data, error } = await supabase.from("profiles").select("*").limit(1);
      
      if (error) {
        // Check if auth error
        if (error.message?.includes('JWT') || error.message?.includes('apikey')) {
          return {
            isConnected: false,
            schemaText: "",
            tables: [],
            error: "Invalid API key",
          };
        }
        return {
          isConnected: false,
          schemaText: "",
          tables: [],
          error: "Could not access any tables",
        };
      }

      const columns = data && data.length > 0 ? detectColumns(data[0]) : ['id', 'email', 'created_at'];
      foundTables.push({
        name: 'profiles',
        columns,
        rowCount: data?.length || 0,
      });
    }

    // Format schema for AI
    const tables = foundTables.map(t => t.name);
    const schemaText = foundTables
      .map(t => {
        const colsText = t.columns.length > 0 
          ? t.columns.map(c => `  - ${c}`).join('\n')
          : '  (columns detected at runtime)';
        return `TABLE: ${t.name} (${t.rowCount} rows)\n${colsText}`;
      })
      .join('\n\n');

    return {
      isConnected: true,
      schemaText,
      tables,
    };
  } catch (err: any) {
    return {
      isConnected: false,
      schemaText: "",
      tables: [],
      error: err.message,
    };
  }
}

/**
 * Format database context for injection into AI prompt
 */
export function formatDatabaseContextForPrompt(context: DatabaseContext): string {
  if (!context.isConnected || !context.schemaText) {
    return "";
  }

  return `
### DATABASE CONTEXT (IMPORTANT - USER HAS CONNECTED SUPABASE):
The user has connected their Supabase database. When generating code:

1. USE THE EXACT TABLE NAMES AND COLUMN NAMES from the schema below
2. DO NOT invent or guess table/column names - use only what's provided
3. Generate data fetching code using supabase-js client
4. The user's Supabase credentials are stored in localStorage

CONNECTED DATABASE SCHEMA:
${context.schemaText}

SUPABASE CONNECTION CODE:
\`\`\`javascript
// Get credentials from localStorage
const SUPABASE_URL = localStorage.getItem('replay_supabase_url');
const SUPABASE_KEY = localStorage.getItem('replay_supabase_key');

// Initialize client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Fetch data
const { data, error } = await supabase.from('${context.tables[0] || "table_name"}').select('*');
\`\`\`

Generate frontend code that fetches REAL data from these tables!
`;
}
