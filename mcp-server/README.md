# @replay-build/mcp-server

MCP server for [Replay.build](https://replay.build) — generate production-ready React UI from video recordings via AI agents.

## Tools

| Tool | Description | Credits |
|------|-------------|---------|
| `replay_generate` | Video URL → React + Tailwind code | 150 |
| `replay_scan` | Video URL → UI structure JSON (pages, colors, navigation) | 50 |
| `replay_validate` | Code + Design System → validation errors | 5 |

## Setup

### 1. Get an API key

Go to [replay.build/settings?tab=api-keys](https://replay.build/settings?tab=api-keys) and create a key.

### 2. Claude Code / Claude Desktop

Add to your MCP config (`~/.claude/settings.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "replay": {
      "command": "npx",
      "args": ["@replay-build/mcp-server"],
      "env": {
        "REPLAY_API_KEY": "rk_live_your_key_here"
      }
    }
  }
}
```

### 3. Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "replay": {
      "command": "npx",
      "args": ["@replay-build/mcp-server"],
      "env": {
        "REPLAY_API_KEY": "rk_live_your_key_here"
      }
    }
  }
}
```

## Usage

Once configured, your AI agent can call:

```
replay_generate({ video_url: "https://example.com/recording.mp4" })
→ Returns complete React + Tailwind HTML code

replay_scan({ video_url: "https://example.com/recording.mp4" })
→ Returns { pages: [...], ui: { colors, typography, navigation } }

replay_validate({ code: "<html>...", design_system_id: "uuid" })
→ Returns { valid: false, errors: [...] }
```

## REST API

The MCP server wraps the Replay REST API. You can also call it directly:

```bash
# Generate code from video
curl -X POST https://replay.build/api/v1/generate \
  -H "Authorization: Bearer rk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://example.com/recording.mp4"}'

# Scan video for UI structure
curl -X POST https://replay.build/api/v1/scan \
  -H "Authorization: Bearer rk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://example.com/recording.mp4"}'

# Validate code against design system
curl -X POST https://replay.build/api/v1/validate \
  -H "Authorization: Bearer rk_live_..." \
  -H "Content-Type: application/json" \
  -d '{"code": "<html>...", "design_system_id": "uuid"}'
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `REPLAY_API_KEY` | Yes | API key from replay.build/settings |
| `REPLAY_API_URL` | No | Custom API URL (default: https://replay.build) |

## License

MIT
