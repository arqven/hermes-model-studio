# Contributing

1. Keep the plugin dependency-free outside the Hermes Desktop SDK.
2. Never commit `.env`, API keys, tokens, private config files, or captured screenshots containing secrets.
3. Keep provider and credential operations delegated to Hermes APIs.
4. Run `node --check src/plugin.js` after changes.
5. Test loading, hiding/restoring the pane, provider selection, key validation, and model application in Hermes Desktop.
6. Keep UI strings and behavior aligned with the Hermes plugin SDK documented for the target release.
