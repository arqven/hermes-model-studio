# Architecture and API Notes

## Runtime surface

The plugin is loaded by Hermes Desktop from its `desktop-plugins` directory. It uses the native plugin SDK and renders one right-side pane plus a status-bar restore chip.

## Hermes calls

| Purpose | Call |
| --- | --- |
| List providers and models | `host.request('model.options', ...)` |
| Read profile configuration | `GET /api/config` |
| Save a provider key | `host.request('model.save_key', ...)` |
| Apply the model assignment | `POST /api/model/set` |
| Validate a provider key | `POST /api/providers/validate` |
| Reveal the current key | `POST /api/env/reveal` |
| Read redacted credential history | `GET /api/credentials/pool` |
| Save masked rotation history | Plugin-scoped `ctx.storage` (previews only) |
| Disconnect a provider | `host.request('model.disconnect', ...)` |
| Save model behavior | `host.request('config.set', ...)` |

## Profile handling

The active profile is read from `host.state.profile`. Configuration and credential requests are made against the active Hermes connection. The plugin does not read another profile's files directly.

## UI behavior

The pane is registered under `model-key-switcher:pane`. The hide action removes the pane contribution but leaves the plugin loaded. A status-bar chip registers while the pane is hidden and restores it on click. The hidden state is stored in the plugin's namespaced `ctx.storage`.

## Credential history

Hermes' credential pool reports redacted pool entries, but a rotation of a custom `key_env` value is not necessarily represented as a historical pool row. The plugin therefore records only a masked preview of the value being replaced (for example `sk-a46…HkXU`) in its own profile/provider-scoped storage. Raw previous keys are never persisted by the plugin.

## Compatibility

The plugin relies on the Hermes Desktop SDK and backend contracts available in the target Hermes installation. If an older Hermes build lacks one of the endpoints, the UI displays the returned error and does not fabricate a credential state.
