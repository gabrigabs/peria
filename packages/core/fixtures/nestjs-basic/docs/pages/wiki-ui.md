# Wiki UI

The visual wiki is generated into `docs`. It uses `docs/wiki-manifest.json` as its page registry and reads markdown from `docs/pages/*.md`.

## Contract

- Markdown pages remain the source of truth.
- `index.html` provides search, navigation, reading metadata, and rendered markdown.
- `wiki-manifest.json` is the bridge between generated pages and the browser UI.
- The UI has no backend requirement; it can be served as static files.
