# Session Handoff — Beds24 Booking Page Setup

## Goal

Complete the pre-work checklist from the original `beds24-setup-handoff.md` before the first Claude Code work session. The checklist has three items:

1. VPS deploy user setup
2. WordPress MCP server configuration
3. Phase 0 manual tests

---

## What Was Accomplished This Session

### Claude Code installed and authenticated
- Node.js v20.17.0 confirmed present
- Claude Code CLI v2.1.9 installed via `npm install -g @anthropic-ai/claude-code`
- Authenticated successfully on first launch (picked up Anthropic account automatically)
- Verified working with `claude --version`

### Claude Desktop installed
- Downloaded and installed during this session

### WordPress application password generated
- Generated for the landing page site: `landing.astrongpresence.com`
- Password format: 5 segments separated by spaces (e.g. `xxxx xxxx xxxx xxxx xxxx`)
- WordPress admin username confirmed

---

## What Was NOT Accomplished

### 1. VPS deploy user setup — BLOCKED

**Blocker:** Cannot authenticate to the VPS. Specifically:
- Hostkey HTML5 console lags badly, won't accept paste, only sometimes accepts keyboard input
- PowerShell SSH (`ssh root@194.180.206.138`) connects but password is rejected
- aaPanel terminal also blocked by the same wrong password
- Root password not found in Hostkey Invapi panel (not listed under Info → Tags)
- Original welcome email credentials appear to be incorrect or the password has been changed
- Hostkey support contacted but no response yet

**What still needs to happen (once VPS access is resolved):**
```bash
useradd -m -s /bin/bash beds24deploy
mkdir -p /www/wwwroot/assets.yourtestdomain.com  # substitute actual test domain
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

**Note:** The site is currently on a staging/test domain. The VPS path and CLAUDE.md will need updating again when migrated to the final domain.

### 2. WordPress MCP server configuration — PARTIALLY BLOCKED

**What was tried:**
- Created `%APPDATA%\Claude\claude_code_config.json` manually and added the correct JSON config
- Config was ignored — `claude mcp list` returned "No MCP servers configured"
- Attempted `claude mcp add` via CLI but could not find working syntax after multiple attempts
- Errors encountered: `missing required argument 'name'`, `unknown option '-y'`, `missing required argument 'commandOrUrl'`

**Root cause (confirmed by research):** Manually editing the config file is not enough — Claude Code requires the `claude mcp add` CLI command to properly register servers. The correct syntax for this version of Claude Code was not successfully determined in this session.

**What needs to happen next:**
- Find the correct `claude mcp add` syntax for Claude Code v2.1.92 for a stdio server using npx
- Register the landing page site first, verify with `/mcp` inside Claude Code
- Then repeat for all 5 sites (1 landing page + 4 property pages)

**Sites to configure (all currently on staging domains):**
- `landing.astrongpresence.com` — main landing page (application password already generated)
- 4 x property pages (application passwords not yet generated)

**Config template (correct JSON, confirmed from official WordPress MCP adapter docs):**
```json
{
  "mcpServers": {
    "wordpress-landing": {
      "command": "npx",
      "args": ["-y", "@automattic/mcp-wordpress-remote@latest"],
      "env": {
        "WP_API_URL": "https://landing.astrongpresence.com/wp-json/mcp/mcp-adapter-default-server",
        "WP_API_USERNAME": "your-username",
        "WP_API_PASSWORD": "xxxx xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

**Note:** The WordPress MCP Adapter plugin must be installed and active on each WordPress site for this to work. Verify this before attempting to connect.

### 3. Phase 0 manual tests — NOT STARTED

These were not reached. See original `beds24-setup-handoff.md` for full details. Tests are:
- 0.1 — WordPress widget parameter passing (real iOS device)
- 0.2 — Price injection feasibility (browser DevTools)
- 0.3 — Claude in Chrome content extraction viability

---

## Recommended Next Steps (In Order)

1. **Wait for Hostkey support** to reset the root password, then complete VPS deploy user setup
2. **Find correct `claude mcp add` syntax** for Claude Code v2.1.92 — check the official Claude Code docs at `https://docs.claude.ai` or run `claude mcp add --help` and work from the exact output
3. **Generate application passwords** for the 4 remaining WordPress property sites
4. **Register all 5 MCP servers** and verify each with `/mcp` inside Claude Code
5. **Update CLAUDE.md** with WordPress server names and property details
6. **Run Phase 0 tests** once the above is complete
7. **Start first Claude Code work session** with `chainlink session start` → `chainlink session work 3`
