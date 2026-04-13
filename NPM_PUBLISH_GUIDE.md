# Publishing `@brandkity/mcp` to npm

This guide walks you through every step required to publish the BrandKity MCP Server package to the npm registry so users can install it with `npx @brandkity/mcp`.

---

## Prerequisites

- Node.js 18 or later (`node --version`)
- npm 9 or later (`npm --version`)
- An npm account with access to the `@brandkity` organization scope

---

## ⚠️ Critical Pre-Publish Checks

Before you run `npm publish`, verify these two things that are **required for npx to work**:

### 1. The `bin` field in `package.json`

`npx @brandkity/mcp` only works if `package.json` declares a `bin` entry. Without it, npx downloads the package but has nothing to execute.

**Current state (✅ already correct):**
```json
{
  "name": "@brandkity/mcp",
  "version": "1.1.0",
  "bin": {
    "brandkity-mcp": "./dist/index.js"
  },
  "files": ["dist/", "README.md", "LICENSE"],
  "publishConfig": {
    "access": "public"
  }
}
```

### 2. Shebang line in `src/index.ts` → `dist/index.js`

Your `src/index.ts` must start with this comment so Node.js knows to run it as a script:

```ts
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
// ... rest of your file
```

After rebuilding, verify the shebang made it into the compiled output:

```bash
cd packages/mcp-server
npm run build
Get-Content dist/index.js -TotalCount 1
# should print: #!/usr/bin/env node
```

Also ensure the file is executable (automatic on Unix/macOS, safe on Windows):

```bash
chmod +x dist/index.js  # Unix/macOS only
```

---

## Step 1 — Create / Verify npm Account Access

### If you don't have an npm account yet

1. Go to [npmjs.com](https://www.npmjs.com) and click **Sign Up**
2. Create an account with your work email (e.g. `hello@brandkity.com`)
3. Verify your email address

### Create the `@brandkity` npm Organization

The package is scoped as `@brandkity/mcp`. npm requires you to own the `brandkity` organization.

1. Log in to npmjs.com
2. Click your avatar → **Add Organization**
3. Organization name: `brandkity`
4. Select **Unlimited public packages** (free) ← important: do NOT choose the paid plan unless needed
5. Click **Create**

> ⚠️ If `@brandkity` already exists on npm and you don't own it, you'll need to contact npm support or use a different scope (e.g. `@brandkity-app/mcp`). Check first: `npm info @brandkity`

---

## Step 2 — Log in to npm in Terminal

```bash
cd packages/mcp-server
npm login
```

Follow the prompts:
- Enter your npm username
- Enter your password
- Enter your email
- Enter the OTP from your email or authenticator app

Verify login:
```bash
npm whoami
# should print your npm username
```

---

## Step 3 — Build the Package

The `prepublishOnly` script runs this automatically, but build manually first to catch errors:

```bash
cd packages/mcp-server
npm run build
```

Expected output: TypeScript compiles to `dist/` with no errors.

Check the `dist/` directory exists and contains:
```
dist/
  index.js
  client.js
  types.js
  types.d.ts
  tools/
    workspace.js
    files.js
    kits.js
    blocks.js
    content.js
    upload.js
```

**Verify the shebang is in the compiled output:**
```bash
Get-Content dist/index.js -TotalCount 1  # Windows PowerShell
# or
head -1 dist/index.js  # Unix/macOS
# should print: #!/usr/bin/env node
```

> ✅ Without the shebang, `npx @brandkity/mcp` will fail to execute.

---

## Step 4 — Check What Will Be Published

Run a dry-run to see exactly what files npm will include:

```bash
npm pack --dry-run
```

You should see **only** these files published (defined by the `files` field in `package.json`):
```
dist/
README.md
LICENSE
package.json   ← always included by npm
```

> ✅ `src/` and `node_modules/` should NOT appear in this list.

---

## Step 5 — Create a LICENSE File (Required)

The package.json declares `"license": "MIT"` but the file must exist:

```bash
cd packages/mcp-server
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2026 BrandKity

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

---

## Step 6 — Publish

### First-time publish (v1.1.0)

```bash
cd packages/mcp-server
npm publish --access public
```

The `--access public` flag is required for scoped packages on the first publish. After the first publish, the `publishConfig` in `package.json` handles this automatically for future publishes.

### Future version updates

1. Bump the version in `package.json`:
   ```bash
   npm version patch   # 1.1.0 → 1.1.1   (bug fixes)
   npm version minor   # 1.1.0 → 1.2.0   (new tools or features)
   npm version major   # 1.1.0 → 2.0.0   (breaking changes)
   ```

2. Also update the version string in `src/index.ts`:
   ```ts
   const server = new McpServer({
     name: 'brandkity',
     version: '1.2.0',   // ← keep in sync
   })
   ```

3. And in `src/client.ts` (User-Agent header):
   ```ts
   'User-Agent': 'brandkity-mcp/1.2.0',
   ```

4. Publish:
   ```bash
   npm publish
   ```

---

## Step 7 — Verify the Publish

```bash
npm info @brandkity/mcp
```

Expected output:
```
@brandkity/mcp@1.1.0 | MIT | deps: 2 | versions: 1
BrandKity MCP Server — Create and manage brand kits from AI agents
https://brandkity.com/mcp

keywords: mcp, brandkity, brand-kit, ai, claude, cursor, model-context-protocol

dist
.tarball: https://registry.npmjs.org/@brandkity/mcp/-/mcp-1.1.0.tgz
```

Also test that `npx` works:
```bash
npx @brandkity/mcp --help
# or
BRANDKITY_API_KEY=bk_live_test npx @brandkity/mcp
# should print: ❌ Invalid API key format (or connect to server if key is valid)
```

---

## Step 8 — Update the README

The `packages/mcp-server/README.md` is what users see on the npm page. Make sure it includes:

1. What the package does (one sentence)
2. Installation / Claude Desktop config snippet
3. List of all 20 tools
4. Link back to `https://brandkity.com/mcp`

---

## Troubleshooting

### `403 Forbidden — you must be owner/admin`
Your npm account does not have publish access to `@brandkity`. Either:
- Add yourself as a team member in the `@brandkity` npm org (npmjs.com → Organizations → brandkity → Teams → developers → Add member)
- Or publish from the account that owns the org

### `402 Payment Required — Private packages need a paid account`
You're missing `--access public` or the `publishConfig` in `package.json`. Run:
```bash
npm publish --access public
```

### `E403 — Package name too similar to existing package`
This is a rare npm safety check. Contact npm support if blocked.

### `ENEEDAUTH — Need auth`
Run `npm login` again.

### TypeScript build errors on publish
The `prepublishOnly` script blocks the publish if `tsc` fails. Fix the TypeScript errors first:
```bash
npm run build
```

---

## CI/CD: Automated Publishing via GitHub Actions

Once the manual publish works, you can automate future releases:

Create `.github/workflows/publish-mcp.yml`:

```yaml
name: Publish @brandkity/mcp

on:
  push:
    tags:
      - 'mcp-v*'   # trigger on: git tag mcp-v1.2.0 && git push --tags

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - name: Install dependencies
        run: npm ci
        working-directory: packages/mcp-server
      - name: Build
        run: npm run build
        working-directory: packages/mcp-server
      - name: Publish
        run: npm publish --access public
        working-directory: packages/mcp-server
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add your npm token as a GitHub secret named `NPM_TOKEN`:
1. npmjs.com → Avatar → Access Tokens → Generate New Token → Automation
2. Copy the token
3. GitHub repo → Settings → Secrets and variables → Actions → New repository secret → `NPM_TOKEN`

---

## User Installation Instructions

Once published, users configure their AI client like this:

> 💡 **How it works:** When users run `npx -y @brandkity/mcp`, npm downloads the package and executes the `bin` entry (`./dist/index.js`), which contains the shebang and starts the MCP server.

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "brandkity": {
      "command": "npx",
      "args": ["-y", "@brandkity/mcp"],
      "env": {
        "BRANDKITY_API_KEY": "bk_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

### Cursor (`.cursor/mcp.json` in project root or `~/.cursor/mcp.json` globally)

```json
{
  "mcpServers": {
    "brandkity": {
      "command": "npx",
      "args": ["-y", "@brandkity/mcp"],
      "env": {
        "BRANDKITY_API_KEY": "bk_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

### Windsurf (`~/.codeium/windsurf/mcp_config.json`)

```json
{
  "mcpServers": {
    "brandkity": {
      "command": "npx",
      "args": ["-y", "@brandkity/mcp"],
      "env": {
        "BRANDKITY_API_KEY": "bk_live_YOUR_KEY_HERE"
      }
    }
  }
}
```

Users get their API key from: **BrandKity Dashboard → Settings → API Keys tab**

MCP access requires a **Pro or Agency plan**.
