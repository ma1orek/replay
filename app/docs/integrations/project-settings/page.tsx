import Link from "next/link";
import { Settings, Pencil, Key, Database, BarChart3, Trash2 } from "lucide-react";

export default function ProjectSettingsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span>Integrations</span>
          <span>/</span>
          <span className="text-white">Project Settings</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <Settings className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Project Settings</h1>
        </div>
        <p className="text-xl text-zinc-400">
          Configure your project's database, secrets, and analytics.
        </p>
      </div>

      {/* Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Overview</h2>
        <p className="text-zinc-400 leading-relaxed">
          Project Settings is your control center for managing individual project configuration. 
          Access it by clicking the gear icon next to any project in your workspace.
        </p>
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Settings Tabs</h2>
        
        {/* General */}
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-3">
            <Pencil className="w-5 h-5 text-zinc-400" />
            <h3 className="font-medium text-white text-lg">General</h3>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><strong className="text-white">Project Name:</strong> Rename your project</li>
            <li><strong className="text-white">Project ID:</strong> Unique identifier (read-only)</li>
            <li><strong className="text-white">Created:</strong> Creation date and time</li>
          </ul>
        </div>

        {/* Secrets */}
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-zinc-400" />
            <h3 className="font-medium text-white text-lg">Secrets</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            Store your Supabase credentials to enable database integration:
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><strong className="text-white">SUPABASE_URL:</strong> Your Supabase project URL</li>
            <li><strong className="text-white">SUPABASE_ANON_KEY:</strong> Anonymous API key</li>
          </ul>
          <p className="text-xs text-zinc-500 mt-3">
            Keys are stored locally in your browser. Replay only reads from your database - never writes.
          </p>
        </div>

        {/* Database */}
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-zinc-400" />
            <h3 className="font-medium text-white text-lg">Database</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            View your connected Supabase tables. The AI uses this schema to generate data-fetching code.
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>Table names and row counts</li>
            <li>RLS status for each table</li>
            <li>Column information</li>
          </ul>
          <Link href="/docs/integrations/supabase" className="inline-flex items-center gap-1 text-zinc-400 text-sm mt-3 hover:text-white transition-colors">
            Learn more about Supabase integration
          </Link>
        </div>

        {/* Analytics */}
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            <h3 className="font-medium text-white text-lg">Analytics</h3>
          </div>
          <p className="text-sm text-zinc-400 mb-3">
            Track your project's usage:
          </p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li><strong className="text-white">Generations:</strong> Initial video-to-UI generations</li>
            <li><strong className="text-white">AI Edits:</strong> Edit with AI operations</li>
            <li><strong className="text-white">Exports:</strong> Code downloads and publishes</li>
          </ul>
        </div>
      </div>

      {/* How to access */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How to Access</h2>
        <p className="text-zinc-400 leading-relaxed">
          Click the <Settings className="inline w-4 h-4" /> icon next to the History button 
          in the main toolbar when you have a project open.
        </p>
      </div>

      {/* Danger zone note */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Deleting Projects</h2>
        <p className="text-zinc-400 leading-relaxed">
          Projects can be deleted from the History panel. Click on a project, then use the delete option.
          This action cannot be undone.
        </p>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-300">
              Deleting a project removes all associated settings, secrets, and analytics data.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
