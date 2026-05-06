# Session Handoff 2 — Beds24 Booking Page Setup

## Goal

Complete the pre-work checklist from the original `beds24-setup-handoff.md` before the first Claude Code work session. The checklist has three items:

1. VPS deploy user setup
2. WordPress MCP server configuration
3. Phase 0 manual tests

---

## What Was Accomplished Across Sessions 1 & 2

### Claude Code installed and authenticated (Session 1)
- Node.js v20.17.0 confirmed present
- Claude Code CLI installed via `npm install -g @anthropic-ai/claude-code`
- Current version: v2.1.92
- Authenticated successfully on first launch
- Project folder: `C:\Users\Dr. COMPUTER\booking-page`

### Claude Desktop installed (Session 1)
- Downloaded and installed

### WordPress MCP servers — FULLY CONFIGURED (Session 2)

All 5 WordPress sites are connected and verified via `/mcp`:

| Server name | Site URL | Status |
|---|---|---|
| `wordpress-landing` | `landing.astrongpresence.com` | connected |
| `wordpress-pink` | `pink.astrongpresence.com` | connected |
| `wordpress-test` | `test.astrongpresence.com` | connected |
| `wordpress-seaside` | `seaside.astrongpresence.com` | connected |
| `wordpress-chillzone` | `chillzone.astrongpresence.com` | connected |

**How it was done:**
- The `claude mcp add` and `claude mcp add-json` CLI commands do not work reliably on Windows (known issue — returns "Invalid input")
- The working method: edit `.mcp.json` directly in the project root (`C:\Users\Dr. COMPUTER\booking-page\.mcp.json`)
- Each server uses the `cmd /c` wrapper for npx (required on Windows to avoid "Connection closed" errors)
- The WordPress MCP Adapter plugin was installed and activated on each site
- Application passwords were generated for all 5 sites
- Permalinks must not be set to "Plain" (the `/wp-json/` path requires pretty permalinks)

**Config location:** `C:\Users\Dr. COMPUTER\booking-page\.mcp.json`

**Config structure per server:**
```json
{
  "wordpress-example": {
    "command": "cmd",
    "args": ["/c", "npx", "-y", "@automattic/mcp-wordpress-remote@latest"],
    "env": {
      "WP_API_URL": "https://example.astrongpresence.com/wp-json/mcp/mcp-adapter-default-server",
      "WP_API_USERNAME": "username",
      "WP_API_PASSWORD": "xxxx xxxx xxxx xxxx xxxx"
    }
  }
}
```

**To launch Claude Code with MCP servers active:**
```powershell
cd "C:\Users\Dr. COMPUTER\booking-page"
claude
```

The `.mcp.json` file is only read from the current working directory when Claude Code starts.

### Other notes
- `chainlink-safe-fetch` MCP server is also in `.mcp.json` but shows as "failed" — this is expected (depends on `uv` and a Python script that isn't set up yet)
- The claude.ai Gmail and Google Calendar connectors show as "needs authentication" — not related to this project

---

## What Was NOT Accomplished

### 1. VPS deploy user setup — STILL BLOCKED

**Blocker:** Cannot authenticate to the VPS. No change from Session 1:
- Hostkey HTML5 console lags badly, won't accept paste
- PowerShell SSH (`ssh root@194.180.206.138`) connects but password is rejected
- aaPanel terminal also blocked
- Hostkey support contacted but no response yet

**What still needs to happen (once VPS access is resolved):**
```bash
useradd -m -s /bin/bash beds24deploy
mkdir -p /www/wwwroot/assets.yourtestdomain.com
chown beds24deploy:www /www/wwwroot/assets.yourtestdomain.com
chmod 755 /www/wwwroot/assets.yourtestdomain.com
mkdir -p /home/beds24deploy/.ssh
chmod 700 /home/beds24deploy/.ssh
passwd -l beds24deploy
```

Then locally:
```powershell
ssh-keygen -t ed25519 -C "beds24deploy" -f $HOME\.ssh\beds24deploy
```

Copy the `.pub` key to `/home/beds24deploy/.ssh/authorized_keys` on the VPS, then point the subdomain in aaPanel and update `CLAUDE.md` with the deploy path and public URL.

### 2. Phase 0 manual tests — NOT STARTED

These are the next priority. See original `beds24-setup-handoff.md` for full details. Tests are:
- 0.1 — WordPress widget parameter passing (real iOS device)
- 0.2 — Price injection feasibility (browser DevTools)
- 0.3 — Claude in Chrome content extraction viability

---

## Recommended Next Steps (In Order)

1. **Run Phase 0 tests** (0.1, 0.2, 0.3) — this is the next task
2. **Wait for Hostkey support** to reset the root password, then complete VPS deploy user setup
3. **Update CLAUDE.md** with WordPress server names and property details
4. **Start first Claude Code work session** with `chainlink session start` → `chainlink session work 3`
