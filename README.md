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

- Hermes Agent Desktop with the desktop plugin loader.
- A Hermes version exposing the model RPCs and provider endpoints used by this plugin.
- A configured Hermes profile.

## Install

1. Copy `src/plugin.js` to the Hermes desktop plugin directory:

   ```text
   %LOCALAPPDATA%\hermes\desktop-plugins\model-key-switcher\plugin.js
   ```

   On macOS/Linux, use:

   ```text
   ~/.hermes/desktop-plugins/model-key-switcher/plugin.js
   ```

2. Open Hermes Desktop.
3. Run `Reload desktop plugins` from the command palette if the plugin is not loaded automatically.
4. Open the Model Studio pane.

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
