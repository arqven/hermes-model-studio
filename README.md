# Hermes Model Studio

A small native desktop plugin for Hermes Agent that manages the active model setup from a single pane.

## Features

- Choose a configured provider and model.
- Read provider metadata and the configured base URL from Hermes.
- Save a new API key through Hermes' credential lifecycle.
- Validate a new key before saving it.
- Reveal the current key only on explicit request through Hermes' protected reveal endpoint.
- Show redacted credential-pool history when available.
- Configure Reasoning and Fast mode.
- Hide or restore the pane without disabling the plugin.
- Keep plugin state scoped to the active Hermes profile.

The plugin does not contain provider keys, does not write `.env` files directly, and does not ship any personal Hermes configuration.

## Requirements

- Hermes Agent Desktop (the CLI alone does not load desktop UI plugins).
- A configured Hermes profile and at least one provider/model if you want to use the connection controls.
- No Node.js installation, package install, build step, or extra dependency is required to install the plugin.

## Install

The plugin is a single JavaScript file. Hermes Desktop loads it from its
`desktop-plugins` directory; the folder name must match the plugin id
(`model-key-switcher`).

### 1. Get the file

Download `src/plugin.js` from this repository, or clone it:

```bash
git clone https://github.com/arqven/hermes-model-studio.git
cd hermes-model-studio
```

You can also use **Code > Download ZIP** on GitHub and extract the archive.

### 2. Create the plugin folder

The destination depends on your operating system. `%LOCALAPPDATA%` is usually
`C:\Users\<you>\AppData\Local`.

**Windows (PowerShell):**

```powershell
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\hermes\desktop-plugins\model-key-switcher" | Out-Null
Copy-Item src\plugin.js "$env:LOCALAPPDATA\hermes\desktop-plugins\model-key-switcher\plugin.js"
```

**macOS / Linux:**

```bash
mkdir -p ~/.hermes/desktop-plugins/model-key-switcher
cp src/plugin.js ~/.hermes/desktop-plugins/model-key-switcher/plugin.js
```

If you use a named Hermes profile, replace the base directory with the
profile directory:

- Windows: `%LOCALAPPDATA%\hermes\profiles\<profile>\desktop-plugins\model-key-switcher\plugin.js`
- macOS / Linux: `~/.hermes/profiles/<profile>/desktop-plugins/model-key-switcher/plugin.js`

### 3. Load it

1. Open Hermes Desktop.
2. The app watches the plugins directory and loads the file within a few
   seconds. If the pane does not appear, run `Reload desktop plugins` from the
   command palette (`Cmd+K / Ctrl+K`).
3. Open the **Model Studio** pane.

### Verify

- The Model Studio pane appears on the right side of the workspace.
- No error toast such as `Plugin model-key-switcher failed to load` appears.
- Closing the pane hides it; a small `model studio` chip in the status bar
  restores it.

### Uninstall

Delete the plugin folder:

```powershell
Remove-Item -Recurse "$env:LOCALAPPDATA\hermes\desktop-plugins\model-key-switcher"
```

```bash
rm -rf ~/.hermes/desktop-plugins/model-key-switcher
```

## Usage

- Select a provider and model in **Connection**.
- The Base URL is prefilled from the provider configuration when Hermes exposes one.
- Enter a replacement key only when you need to change it.
- Use **Check** before saving a replacement key. Saving a new key is also blocked when validation fails.
- Use **Reveal** to explicitly request the current key and redacted credential history.
- Use the close icon to hide the pane. The plugin remains enabled; a small `model studio` status-bar chip restores it.

## Security

The plugin delegates credential handling to Hermes:

- `model.save_key` saves API keys through Hermes' credential lifecycle.
- `/api/env/reveal` is called only after the user opens the reveal section.
- `/api/credentials/pool` returns redacted previews, not raw historical keys.
- No secret is persisted in plugin storage or in this repository.

Showing a raw secret in a desktop UI is inherently sensitive. Keep the reveal section closed when it is not needed.

## Development

This is an uncompiled ESM plugin. Only Hermes' supported plugin imports are used. Validate syntax with:

```bash
node --check src/plugin.js
```

After editing, reload desktop plugins in Hermes Desktop.

## License

MIT. See [LICENSE](LICENSE).
