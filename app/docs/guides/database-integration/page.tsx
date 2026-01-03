import Link from "next/link";
import { Database, Key, Settings, Code, Shield, Check, AlertTriangle } from "lucide-react";

export default function DatabaseIntegrationPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Guides</span>
          <span>/</span>
          <span className="text-white">Database Integration</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <Database className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-white">Database Integration</h1>
        </div>
        <p className="text-xl text-white/60">
          Connect Supabase to generate UI that works with your real data.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Why Connect a Database?</h2>
        <p className="text-white/70 leading-relaxed">
          By connecting your Supabase database, the AI understands your actual data structure. 
          When you ask "create a users list", it generates code that fetches from your real 
          <code className="px-1.5 py-0.5 bg-white/10 rounded text-sm mx-1">users</code> table 
          with correct column names.
        </p>
      </div>

      {/* What Replay can see */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">What Replay Can Access</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-400" />
              <h4 className="font-medium text-green-400">Read Access:</h4>
            </div>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Table names</li>
              <li>• Column names and types</li>
              <li>• Sample data (for schema inference)</li>
              <li>• Row counts</li>
            </ul>
          </div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-red-400" />
              <h4 className="font-medium text-red-400">No Write Access:</h4>
            </div>
            <ul className="space-y-1 text-sm text-white/70">
              <li>• Cannot modify data</li>
              <li>• Cannot delete records</li>
              <li>• Cannot alter schema</li>
              <li>• Uses anon key only</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Setup steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Setup Guide</h2>
        <div className="space-y-4">
          {[
            {
              step: 1,
              title: "Get Your Supabase Credentials",
              description: "Go to your Supabase project → Settings → API. Copy the Project URL and anon/public key.",
              icon: Key
            },
            {
              step: 2,
              title: "Open Project Settings",
              description: "In Replay, click the gear icon next to History to open Project Settings.",
              icon: Settings
            },
            {
              step: 3,
              title: "Add Credentials",
              description: "Go to the Secrets tab. Paste your SUPABASE_URL and SUPABASE_ANON_KEY. Click Save.",
              icon: Key
            },
            {
              step: 4,
              title: "Configure RLS",
              description: "In Supabase, enable Row Level Security and create SELECT policies for tables you want Replay to see.",
              icon: Shield
            },
            {
              step: 5,
              title: "Verify Connection",
              description: "Go to the Database tab in Project Settings. You should see your tables listed.",
              icon: Check
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-[#FF6E3C] flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-white">Step {item.step}: {item.title}</h4>
                <p className="text-sm text-white/60 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RLS Setup */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Configuring Row Level Security</h2>
        <p className="text-white/70 leading-relaxed">
          For Replay to see your tables, you need to enable RLS and create policies. Here's an example:
        </p>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 font-mono text-sm overflow-x-auto">
          <pre className="text-white/70">{`-- Enable RLS on the table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows SELECT for anonymous users
CREATE POLICY "Allow public read access"
ON public.products
FOR SELECT
TO anon
USING (true);`}</pre>
        </div>
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
            <p className="text-sm text-white/70">
              Only create read policies for data that's safe to expose. Don't expose sensitive user data.
            </p>
          </div>
        </div>
      </div>

      {/* Using with AI */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Using Database Context with AI</h2>
        <p className="text-white/70 leading-relaxed">
          Once connected, the AI automatically knows about your schema. Try prompts like:
        </p>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 font-mono text-sm">
          <p className="text-[#FF6E3C]">"Create a product grid using my products table"</p>
          <p className="text-[#FF6E3C] mt-2">"Add a user profile section with data from profiles"</p>
          <p className="text-[#FF6E3C] mt-2">"Build a dashboard showing order statistics"</p>
        </div>
        <p className="text-white/70 leading-relaxed mt-4">
          The generated code will include proper Supabase client initialization and queries:
        </p>
        <div className="p-4 rounded-xl bg-[#1a1a1a] border border-white/10 font-mono text-sm overflow-x-auto">
          <pre className="text-white/70">{`<script>
  const supabase = supabase.createClient(
    'YOUR_SUPABASE_URL',
    'YOUR_ANON_KEY'
  );
  
  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url');
    // ...
  }
</script>`}</pre>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Troubleshooting</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">Tables not showing?</h4>
            <p className="text-sm text-white/60">Check that RLS is enabled AND you have a SELECT policy for the anon role.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">Showing 0 rows?</h4>
            <p className="text-sm text-white/60">Your RLS policy might be too restrictive. Try <code className="px-1 py-0.5 bg-white/10 rounded text-xs">USING (true)</code> for public data.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">Invalid URL error?</h4>
            <p className="text-sm text-white/60">Make sure your URL starts with https:// and ends with .supabase.co</p>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Security Notes</h2>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#FF6E3C] mt-0.5" />
              <span>Credentials are stored in your browser's localStorage - never sent to our servers</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#FF6E3C] mt-0.5" />
              <span>Only use the anon key - never the service role key</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-[#FF6E3C] mt-0.5" />
              <span>Generated code uses your credentials - review before publishing</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

