import Link from "next/link";
import { Database, Key, Shield, AlertTriangle, CheckCircle, Code, Settings } from "lucide-react";

export default function SupabasePage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Integrations</span>
          <span>/</span>
          <span className="text-white">Supabase</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/20">
            <Database className="w-6 h-6 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Supabase Integration</h1>
        </div>
        <p className="text-xl text-white/60">
          Connect your Supabase database to generate code that works with your real data.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-white/70 leading-relaxed">
          When you connect Supabase, Replay AI can see your database schema (table names, columns, types) 
          and generate frontend code that fetches real data. Instead of mock data, you get 
          actual <code className="px-1 py-0.5 rounded bg-white/10 text-[#FF6E3C]">supabase.from().select()</code> calls.
        </p>
      </div>

      {/* Setup steps */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Setup</h2>
        
        {/* Step 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">1</div>
            <h3 className="text-lg font-medium text-white">Get your Supabase credentials</h3>
          </div>
          <div className="ml-11">
            <p className="text-white/70 mb-3">
              Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#FF6E3C] hover:underline">Supabase Dashboard</a> → 
              Project Settings → API
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white">Project URL</span>
                  <code className="ml-auto text-xs text-white/50 font-mono">https://xxxxx.supabase.co</code>
                </div>
                <div className="flex items-center gap-3">
                  <Key className="w-4 h-4 text-white/40" />
                  <span className="text-sm text-white">anon public key</span>
                  <code className="ml-auto text-xs text-white/50 font-mono">eyJhbGciOiJIUzI1NiIs...</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">2</div>
            <h3 className="text-lg font-medium text-white">Add credentials to Replay</h3>
          </div>
          <div className="ml-11">
            <p className="text-white/70 mb-3 flex items-center gap-1 flex-wrap">
              Open Project Settings (<Settings className="w-4 h-4 inline" /> icon) → Secrets tab
            </p>
            <ul className="list-disc list-inside space-y-1 text-white/60 text-sm">
              <li>Paste your <strong>SUPABASE_URL</strong></li>
              <li>Paste your <strong>SUPABASE_ANON_KEY</strong></li>
              <li>Click <strong>Save Secrets</strong></li>
            </ul>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">3</div>
            <h3 className="text-lg font-medium text-white">Configure Row Level Security</h3>
          </div>
          <div className="ml-11">
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-400">Important: RLS blocks access by default</p>
                  <p className="text-sm text-white/60 mt-1">
                    If your tables show 0 rows, you need to add RLS policies.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-white/70 mb-3">
              Run this SQL in Supabase Dashboard → SQL Editor:
            </p>
            <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 font-mono text-sm overflow-x-auto">
              <pre className="text-green-400">
{`-- Allow public read access to your tables
CREATE POLICY "Allow public read"
ON profiles FOR SELECT
USING (true);

-- Repeat for other tables you want to expose:
CREATE POLICY "Allow public read"
ON products FOR SELECT
USING (true);`}
              </pre>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FF6E3C] text-white font-bold flex items-center justify-center text-sm">4</div>
            <h3 className="text-lg font-medium text-white">Verify connection</h3>
          </div>
          <div className="ml-11">
            <p className="text-white/70 mb-3">
              Go to Project Settings → Database tab. You should see:
            </p>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Connected to Supabase</span>
              </div>
              <p className="text-sm text-white/60 mt-2">
                Your tables will be listed with row counts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Using Database in AI Prompts</h2>
        <p className="text-white/70 leading-relaxed">
          Once connected, mention your tables in Edit with AI prompts:
        </p>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/70 font-mono mb-2">
              "Show all users from my profiles table"
            </p>
            <p className="text-xs text-green-400">
              → AI generates: supabase.from('profiles').select('*')
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/70 font-mono mb-2">
              "Create a product grid using data from products table"
            </p>
            <p className="text-xs text-green-400">
              → AI generates fetch code with your actual column names
            </p>
          </div>
        </div>
      </div>

      {/* Generated code example */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Generated Code Example</h2>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 font-mono text-sm overflow-x-auto">
          <pre className="text-white/70">
{`<div x-data="{
  users: [],
  loading: true,
  async init() {
    const SUPABASE_URL = localStorage.getItem('replay_supabase_url');
    const SUPABASE_KEY = localStorage.getItem('replay_supabase_key');
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { data } = await supabase.from('profiles').select('*');
    this.users = data || [];
    this.loading = false;
  }
}">
  <div x-show="loading">Loading...</div>
  <template x-for="user in users" :key="user.id">
    <div class="p-4 border rounded">
      <p x-text="user.email"></p>
      <p x-text="user.created_at"></p>
    </div>
  </template>
</div>`}
          </pre>
        </div>
      </div>

      {/* Security note */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Security Notes</h2>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-white/40 mt-0.5" />
            <div className="space-y-2 text-sm text-white/60">
              <p>
                <strong className="text-white">Keys are stored locally.</strong> Your Supabase credentials 
                are saved in your browser's localStorage, not on our servers.
              </p>
              <p>
                <strong className="text-white">Use anon key only.</strong> Never use your service_role key 
                in frontend code. The anon key is safe for client-side use.
              </p>
              <p>
                <strong className="text-white">RLS protects your data.</strong> Row Level Security ensures 
                users can only access data they're allowed to see.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

