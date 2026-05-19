# @streameye/n8n-nodes-streameye

[![npm version](https://img.shields.io/npm/v/@streameye/n8n-nodes-streameye?style=flat-square)](https://www.npmjs.com/package/@streameye/n8n-nodes-streameye)
[![n8n community node](https://img.shields.io/badge/n8n-community%20node-FF6D5A?style=flat-square)](https://docs.n8n.io/integrations/community-nodes/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

This is an [n8n](https://n8n.io/) community node. It lets you use the [Streameye](https://streameye.com/) API in your n8n workflows to build, render and distribute **data-driven creatives** straight from your automations.

**Streameye** is a dynamic creative platform for building, rendering and distributing data-driven banners and feeds from reusable **wizards** and asset **galleries**. With this node you can create and update feeds, inject live data and images, render the results as **ad tags, rendered images and permalinks** — all without leaving n8n.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

---

## Table of Contents

- [Key Features](#key-features)
- [Installation](#installation)
- [Credentials](#credentials)
- [Operations](#operations)
  - [📰 Feed](#-feed)
  - [🖼️ Gallery](#️-gallery)
  - [🧩 Wizard](#-wizard)
- [Triggering Workflows (Webhooks & Schedules)](#triggering-workflows-webhooks--schedules)
- [Example Usage](#example-usage)
  - [Example 1 — Match-day banners that redirect permalinks to the next best game](#example-1--match-day-banners-that-redirect-permalinks-to-the-next-best-game)
  - [Example 2 — Scheduled retail product feed pushed to an ad platform](#example-2--scheduled-retail-product-feed-pushed-to-an-ad-platform)
- [How It Works](#how-it-works)
  - [Feed data validation](#feed-data-validation-create--update)
  - [`asset_picker` resolution](#asset_picker-resolution)
  - [Compressed fields](#compressed-fields)
- [Compatibility](#compatibility)
- [Resources](#resources)
- [Version History](#version-history)
- [License](#license)

---

## Key Features

- 📰 **Create & update feeds** from a wizard, with feed data validated against the wizard schema before it is sent.
- 🪄 **Automatic image resolution** — reference gallery assets by name and the node swaps in the correct asset URL for you.
- 🔗 **Produce ad tags, rendered images and permalinks** from any feed, optionally scoped to a single banner, quality or type.
- 📦 **Download generated feed files** for a feed.
- 🗂️ **Browse galleries and wizards** with rich filtering, sorting and pagination.
- 🔐 **Secure OAuth2 authentication** against the Streameye identity provider.

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In short:

1. Go to **Settings → Community Nodes**.
2. Select **Install**.
3. Enter `@streameye/n8n-nodes-streameye` as the npm package name.
4. Agree to the risks of using community nodes and select **Install**.

Once installed, the **Streameye** node is available from the nodes panel.

---

## Credentials

Authentication uses **OAuth2 (Authorization Code)** against the Streameye identity provider.

1. Obtain an OAuth2 **Client ID** and **Client Secret** from Streameye.
2. In n8n, create a new **Streameye OAuth2 API** credential and enter the **Client ID** and **Client Secret**.
3. Adjust the **Scope** if needed (default: `openid email profile`).
4. Select **Connect my account** and complete the OAuth2 sign-in flow.

> The API URL, authorization URL and token URL are preconfigured in the credential — you don't need to set them.

---

## Operations

The node exposes three resources — **Feed**, **Gallery** and **Wizard**. All calls go to a single Streameye GraphQL endpoint using your OAuth2 credentials.

### 📰 Feed

| | Operation | Description | Key inputs |
|---|-----------|-------------|------------|
| ➕ | **Create** | Create a feed from a wizard. The `Data` is validated against the wizard schema before sending (see [How It Works](#how-it-works)). | **Wizard ID** *(required)*, **Name** *(required)*, **Language** *(required, defaults to `en`)*, **Data** — feed data as JSON *(required)*; optional **Looping** (defaults to 2) |
| ✏️ | **Update** | Update an existing feed's data. `Data` is validated against the wizard schema. | **Feed ID** *(required)*, **Name** *(required)*, **Language** *(required)*, **Data** — JSON *(required)*; optional **Looping** (leave at 0 to keep current) |
| 🔍 | **Get by ID** | Retrieve a single feed. | **Feed ID** *(required)* |
| 📥 | **Get Files** | Download the generated files for a feed. | **Feed ID** *(required)* |
| 🖼️ | **Get Images** | Get rendered image URLs for a feed. | **Feed ID** *(required)*, **Quality** (defaults to 93), **Type** (JPG / PNG / WEBP, defaults to JPG) |
| 🔗 | **Get Permalinks** | Get permalink URLs for a feed. | **Feed ID** *(required)* |
| 📋 | **List** | List feeds (filterable, sortable, paginated). | Optional **Wizard ID**, **Keyword**, **Type**, **Filters** (created/updated date ranges), **Order By** + **Order Direction**, **Page**, **Page Size** |

> ℹ️ **Mixed-type runs.** **Get Images** and **Get Permalinks** are not supported for `html5` feeds. When a batch contains such items, those items are skipped with an n8n warning and empty output rather than failing the whole workflow.

### 🖼️ Gallery

| | Operation | Description | Key inputs |
|---|-----------|-------------|------------|
| 📂 | **List Gallery Assets** | List the assets in a gallery (filterable, sortable, paginated). | **Gallery ID** *(required)*; optional **Keyword**, **Filters** (Category), **Order By** + **Order Direction**, **Page**, **Page Size** |

### 🧩 Wizard

| | Operation | Description | Key inputs |
|---|-----------|-------------|------------|
| 🔍 | **Get by ID** | Retrieve a wizard's `schema`, `data` (defaults) and supported `languages`. The compressed `schema`/`data` fields are decompressed automatically. | **Wizard ID** *(required)* |
| 📋 | **List** | List wizards (filterable, sortable, paginated). | Optional **Keyword**, **Type**, **Filters** (created/updated date ranges), **Order By** + **Order Direction**, **Page**, **Page Size** |

---

## Triggering Workflows (Webhooks & Schedules)

Streameye does **not** ship a dedicated trigger node — the Streameye node is an **action** node that you place *after* a trigger. To start a workflow, use one of n8n's built-in triggers and then feed its data into the Streameye node.

The two most common patterns:

### 🪝 Webhook (event-driven)

Use n8n's core [**Webhook** node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) when an external system should push data into n8n in real time (for example, a sports-data service or an AI selection job that posts the next best games).

1. Add a **Webhook** node as the workflow's trigger and copy its **Production URL**.
2. Configure your external system to **POST** its payload to that URL.
3. Wire the Webhook node into a **Streameye** node (e.g. *Feed → Update*) and map fields from `{{$json.body}}` into the feed `Data`.

### ⏱️ Schedule (polling)

Use the core [**Schedule Trigger** node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/) to run on an interval — ideal for periodically syncing a product catalogue or refreshing creatives.

1. Add a **Schedule Trigger** and set the cadence (e.g. every 15 minutes, or daily at 06:00).
2. Pull data from your source (database, API, spreadsheet), then pass it into a **Streameye** node.

> 💡 You can also start any of these workflows manually with the **Manual Trigger** while you build and test.

---

## Example Usage

> The snippets below show the *shape* of the data at each step. Map values with n8n expressions such as `{{$json.body.fixture.homeTeam}}`.

### Example 1 — Match-day banners that redirect permalinks to the next best game

**Scenario:** an AI job selects the best upcoming football fixtures and posts them to n8n. The workflow updates an existing Streameye feed so its **permalinks start redirecting to the next best game** — pulling team crests from a Streameye gallery and enriching the creative with kickoff time and the last 5 meetings between the teams.

**Flow:**

1. **Webhook** *(trigger)* — receives the AI-selected fixture:
   ```json
   {
     "feedId": "fd_9aZ…",
     "home": "arsenal",
     "away": "chelsea",
     "kickoff": "2026-06-07T16:30:00Z"
   }
   ```
2. **Data store / HTTP Request** — look up the **last 5 meetings** between the two teams from your own database.
3. **Streameye → Feed → Update** — update the existing feed, injecting the match data. The crest fields are `asset_picker` fields bound to a Streameye gallery, so you can pass the **team names** and the node resolves them to the correct crest URLs automatically:
   ```json
   {
     "homeCrest": "arsenal",
     "awayCrest": "chelsea",
     "kickoff": "Sat 7 Jun · 17:30",
     "form": "W-D-L-W-W vs L-W-D-L-D"
   }
   ```
   > Because `homeCrest`/`awayCrest` are `asset_picker` fields, `"arsenal"` is swapped for that gallery asset's URL. A value that matches nothing is dropped so the wizard's default crest is used. See [`asset_picker` resolution](#asset_picker-resolution).
4. **Streameye → Feed → Get Permalinks** — fetch the feed's permalinks. Because the **same** permalink now points at the updated feed, every banner already in the wild **redirects to the next best game** with no re-trafficking.

The result: a single permalink per banner that always serves the freshest fixture.

### Example 2 — Scheduled retail product feed pushed to an ad platform

**Scenario:** every morning, pull the latest product catalogue from a data store, update (or create) a Streameye feed, render the ads, and push the creatives to an ad platform.

**Flow:**

1. **Schedule Trigger** *(trigger)* — runs daily (e.g. 06:00).
2. **Database / Spreadsheet node** — query the current product feed (image URLs, pricing, availability).
3. **Streameye → Feed → Create** (first run) or **Feed → Update** (subsequent runs) — build the feed from a retail wizard, injecting product images **directly via their URLs**, plus pricing and availability:
   ```json
   {
     "productImage": "https://cdn.example.com/products/sku-1234.jpg",
     "price": "£49.99",
     "availability": "In stock"
   }
   ```
   > Any `asset_picker`/image field that already contains an `http(s)://` URL is kept as-is — no gallery lookup is performed.
4. **Streameye → Feed → Get Images** — render the ads for the current products and collect the image URLs.
5. **HTTP Request / ad-platform node** — push the rendered creatives to your ad platform.

The result: a hands-off pipeline that keeps live product ads in sync with stock and pricing.

---

## How It Works

### Feed data validation (Create / Update)

Before a feed is created or updated, the node loads the feed's wizard schema and validates the `Data` JSON against it:

1. **Language check.** If you provide a `Language` and the wizard publishes a list of supported languages, an unsupported language throws an error listing the supported ones. (If the wizard exposes no language list, any value is accepted.)
2. **Required fields.** Fields marked `required` in the wizard schema must be present and non-empty. This is enforced across the schema's `fields`, the fields inside `required` `groups`, the `conditionFields`, and `required` nested `items` within a field.
3. **Defaults from the wizard.** Any required field that is missing or empty is filled from the wizard's default data when a default exists. The node adds an execution hint listing which fields were defaulted.
4. **Validation errors.** If, after defaulting, any required field is still missing/empty, the node throws a single error listing every failing field.

### `asset_picker` resolution

Wizards expose image/asset fields as the **`asset_picker`** type, each bound to a Streameye gallery (via a `galleryId` in the wizard schema). For each `asset_picker` property in your `Data` you may supply either a final asset URL **or** just an asset name — the node resolves it for you, so you don't have to look up gallery URLs manually.

| Your value | What the node does |
|------------|--------------------|
| A URL (`https://…` or `http://…`) | Kept as-is — no lookup. |
| Any other text (an asset name / keyword) | Searches that field's gallery for the keyword and substitutes the **top match's** asset URL. |
| A keyword with **no** matching gallery asset | The property is **removed**, so the feed falls back to the **wizard's default** value for that field. |

Resolution runs for both **Create** and **Update**, and the node adds an execution hint listing which `asset_picker` fields were resolved to URLs and which were dropped.

**Example** — a wizard with an `asset_picker` field `team1` bound to a teams gallery:

| `Data` you provide | Result sent to the API |
|--------------------|------------------------|
| `{ "team1": "https://static.streameye.net/galleries/4jt…/arsenal" }` | Unchanged (already a URL) |
| `{ "team1": "arsenal" }` | Resolved to the matching gallery asset's URL |
| `{ "team1": "no-such-team" }` | `team1` removed → wizard default is used |

### Compressed fields

Some Streameye fields are stored gzip-compressed and base64-encoded (e.g. a wizard's `schema` and `data`). The node decompresses these on read and compresses feed `data` on write automatically — **you always work with plain JSON in n8n.**

---

## Compatibility

- Requires an n8n version that supports community nodes (n8n Nodes API v1).
- Requires Node.js `>=20.15`.
- Built and linted in `strict` mode, eligible for n8n Cloud verification.
- No external runtime dependencies (uses n8n's authenticated HTTP helpers only).

> New to n8n? See the [Try it out](https://docs.n8n.io/try-it-out/) documentation to get started.

---

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Streameye](https://streameye.com/)
- [n8n Webhook node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [n8n Schedule Trigger node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/)

---

## Version History

### 0.1.0

Initial release. Feed (Create, Update, Get by ID, Get Files, Get Images, Get Permalinks, List), Gallery (List Gallery Assets) and Wizard (Get by ID, List) operations, OAuth2 authentication, feed-data validation against the wizard schema, automatic `asset_picker` resolution, and automatic gzip/base64 (de)compression of wizard `schema`/`data`.

---

## License

[MIT](./LICENSE) © StreamEye
