# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run build:watch    # Watch mode (tsc --watch only, no n8n-node tooling)
npm run dev            # Start n8n at http://localhost:5678 with hot reload
npm run lint           # Run ESLint via n8n-node lint
npm run lint:fix       # Auto-fix lint issues
npm run release        # Full release: build → lint → changelog → git tag → npm publish
```

There is no test suite. Quality is verified by `npm run build` (TypeScript errors) and `npm run lint` (ESLint), plus manual testing in dev mode.

## Architecture

This is a **programmatic-style** n8n node. The GraphQL API uses a single endpoint for all operations, and several responses require decompression (gzip + base64), which rules out the declarative style.

### Request flow

`Streameye.node.ts` → dispatches to a `ResourceOperation` → `helpers.httpRequestWithAuthentication` → GraphQL endpoint

Every execution POSTs `{ query, variables }` to the `apiUrl` stored in the OAuth2 credentials. The `apiUrl` is fixed to `https://api.streameye.com/graphql` and injected at runtime from the credential, not hardcoded in the node.

### ResourceOperation pattern

Each operation is defined as a `ResourceOperation` object (see `resources/types.ts`):

```ts
type ResourceOperation = {
  responseKey: string;          // key inside response.data to extract
  query: string;                // GraphQL query or mutation
  getVariables: (...) => IDataObject;
  transformResponse?: (response) => unknown; // optional post-processing
};
```

Operation files live in `resources/<resource>/<operation>.ts` and each exports both the operation object and an `INodeProperties[]` description array. The `index.ts` for each resource re-exports both, keyed by operation name.

### Response normalisation

`normalizeApiResult` in `Streameye.node.ts` handles three shapes: plain object, array, or `{ items: [...] }` (paginated). The feeds `list` operation's `transformResponse` also JSON-parses the `items` field because the API returns it as a serialised string.

### Compression helpers

`helpers/compression.ts` exports `unzipJson` and `zipJson` for fields that the Streameye API stores gzip-compressed and base64-encoded. Use these when an operation reads or writes such fields.

### helpers/inputHelpers.ts

Utilities shared across operations for building request input:
- `compactObject` — strips `undefined` and `""` from an object before sending to the API
- `getStringArray` — validates and returns a JSON array of strings

### Feed validation and asset_picker resolution

`resources/feeds/validateFeedData.ts` runs before every feed `create`/`update` (via each operation's `validate` hook → `validateFeedInput`). It loads the wizard schema (`loadWizard`), checks the language is supported, validates required fields, and fills missing fields from the wizard's default data.

It also resolves **`asset_picker`** fields. Wizard schemas mark image/asset fields with `type: "asset_picker"` and a `galleryId`. `resolveAssetPickers` walks the schema (`collectAssetPickerGalleries` — recursive, since schemas nest fields differently per wizard), then for each asset_picker property present in the feed data:

- value already a URL (`^https?://`) → kept as-is;
- otherwise → `lookupAssetUrl` calls `n8nListAssets` (`filter: { gid: galleryId, keyword }`, `size: 1`) and substitutes the first match's `url`;
- no match → the property is **removed** so the API applies the wizard's default for that field.

Resolved/removed fields are surfaced as an n8n execution hint. This logic lives in the node (not the workflow) so it applies uniformly to both create and update.

### Adding a new resource or operation

1. Create `resources/<resource>/<operation>.ts` exporting a `ResourceOperation` and an `INodeProperties[]`.
2. Register it in `resources/<resource>/index.ts`.
3. Spread its description into the resource's `feedDescription`/etc. array.
4. Add the resource to the `resource` options in `Streameye.node.ts` if it is new.
5. Run `npm run build && npm run lint` before considering the work done.
