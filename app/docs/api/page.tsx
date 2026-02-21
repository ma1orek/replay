import Link from "next/link";
import { Key, Terminal, Cpu, Shield } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white">API Reference</span>
        </div>
        <h1 className="text-4xl font-bold text-white">REST API & MCP Server</h1>
        <p className="text-xl text-zinc-400">
          Access Replay programmatically from AI agents, scripts, or any HTTP client.
        </p>
      </div>

      {/* Auth */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-orange-400" />
          <h2 className="text-2xl font-bold text-white">Authentication</h2>
        </div>
        <p className="text-zinc-400">
          All API requests require an API key. Create one at{" "}
          <Link href="/settings?tab=api-keys" className="text-orange-400 hover:text-orange-300">
            Settings → API Keys
          </Link>.
        </p>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <code className="text-sm text-zinc-300 font-mono">
            Authorization: Bearer rk_live_your_key_here
          </code>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-8">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-orange-400" />
          <h2 className="text-2xl font-bold text-white">Endpoints</h2>
        </div>

        {/* Generate */}
        <div className="space-y-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">POST</span>
            <code className="text-white font-mono">/api/v1/generate</code>
            <span className="text-zinc-500 text-sm">150 credits</span>
          </div>
          <p className="text-zinc-400 text-sm">Generate production-ready React + Tailwind code from a video recording.</p>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Request body:</p>
            <pre className="bg-black/50 rounded-lg p-3 text-xs text-zinc-300 font-mono overflow-x-auto">{`{
  "video_url": "https://...",    // Required: public URL to MP4/WebM/MOV
  "style": "minimal",            // Optional: style preset
  "design_system_id": "uuid",    // Optional: use imported DS
  "use_surveyor": true            // Optional: pixel measurements (default true)
}`}</pre>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Response:</p>
            <pre className="bg-black/50 rounded-lg p-3 text-xs text-zinc-300 font-mono overflow-x-auto">{`{
  "success": true,
  "code": "<html>...",           // Complete React + Tailwind HTML
  "scan_data": { ... },          // Extracted UI structure
  "token_usage": { "prompt": 4000, "completion": 8000, "total": 12000 },
  "credits_used": 150
}`}</pre>
          </div>
        </div>

        {/* Scan */}
        <div className="space-y-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">POST</span>
            <code className="text-white font-mono">/api/v1/scan</code>
            <span className="text-zinc-500 text-sm">50 credits</span>
          </div>
          <p className="text-zinc-400 text-sm">Analyze a video to extract UI structure without generating code.</p>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Request body:</p>
            <pre className="bg-black/50 rounded-lg p-3 text-xs text-zinc-300 font-mono overflow-x-auto">{`{
  "video_url": "https://..."     // Required: public URL to video
}`}</pre>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Response:</p>
            <pre className="bg-black/50 rounded-lg p-3 text-xs text-zinc-300 font-mono overflow-x-auto">{`{
  "success": true,
  "pages": [{ "id": "home", "title": "Home", "components": [...] }],
  "ui": {
    "navigation": { "type": "top-menu", "items": [...] },
    "colors": { "primary": "#FF6E3C", "background": "#0a0a0a" },
    "typography": { "heading": "Inter", "body": "Inter" }
  },
  "credits_used": 50
}`}</pre>
          </div>
        </div>

        {/* Validate */}
        <div className="space-y-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">POST</span>
            <code className="text-white font-mono">/api/v1/validate</code>
            <span className="text-zinc-500 text-sm">5 credits</span>
          </div>
          <p className="text-zinc-400 text-sm">Validate code against a Design System for color and typography compliance.</p>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Request body:</p>
            <pre className="bg-black/50 rounded-lg p-3 text-xs text-zinc-300 font-mono overflow-x-auto">{`{
  "code": "<html>...",           // Required: HTML/React code
  "design_system_id": "uuid"     // Required: DS ID from Replay
}`}</pre>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Response:</p>
            <pre className="bg-black/50 rounded-lg p-3 text-xs text-zinc-300 font-mono overflow-x-auto">{`{
  "valid": false,
  "errors": [
    { "type": "color", "message": "Hardcoded #3B82F6 not in DS", "value": "#3B82F6" }
  ],
  "design_system": "Acme Corp DS",
  "credits_used": 5
}`}</pre>
          </div>
        </div>
      </div>

      {/* MCP Server */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-orange-400" />
          <h2 className="text-2xl font-bold text-white">MCP Server</h2>
        </div>
        <p className="text-zinc-400">
          Use Replay as a tool in AI coding agents like Claude Code, Cursor, or Windsurf.
        </p>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 space-y-3">
          <p className="text-xs text-zinc-500">Add to your MCP config:</p>
          <pre className="text-sm text-zinc-300 font-mono">{`{
  "mcpServers": {
    "replay": {
      "command": "npx",
      "args": ["@replay-build/mcp-server"],
      "env": {
        "REPLAY_API_KEY": "rk_live_..."
      }
    }
  }
}`}</pre>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <code className="text-orange-400 text-sm font-mono">replay_generate</code>
            <p className="text-zinc-500 text-xs mt-1">Video → React code</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <code className="text-orange-400 text-sm font-mono">replay_scan</code>
            <p className="text-zinc-500 text-xs mt-1">Video → UI structure</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <code className="text-orange-400 text-sm font-mono">replay_validate</code>
            <p className="text-zinc-500 text-xs mt-1">Code + DS → errors</p>
          </div>
        </div>
      </div>

      {/* Error codes */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-400" />
          <h2 className="text-2xl font-bold text-white">Error Codes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-2 text-zinc-400 font-medium">Status</th>
                <th className="text-left py-2 text-zinc-400 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/50"><td className="py-2 font-mono">401</td><td>Invalid or missing API key</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-2 font-mono">402</td><td>Insufficient credits</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-2 font-mono">400</td><td>Missing required field (video_url, etc.)</td></tr>
              <tr className="border-b border-zinc-800/50"><td className="py-2 font-mono">404</td><td>Design system not found</td></tr>
              <tr><td className="py-2 font-mono">500</td><td>Internal server error</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
