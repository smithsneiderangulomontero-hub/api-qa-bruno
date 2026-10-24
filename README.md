# 🚀 API Test Automation with Bruno & Azure DevOps

[![Build Status](https://dev.azure.com/smithsneiderangulomontero/api-qa-bruno/_apis/build/status/smithsneiderangulomontero-hub.api-qa-bruno?branchName=main)](https://dev.azure.com/smithsneiderangulomontero/api-qa-bruno/_build)

Automated API testing suite for **Restful-Booker** built using **Bruno CLI** (OpenCollection YAML format), a **TypeScript endpoint generator**, and an **Azure DevOps CI/CD pipeline**.

---

## 🛠️ Tech Stack & Tools

- **Test Framework:** [Bruno](https://www.usebruno.com/) (open-source API client), OpenCollection YAML format
- **CLI Execution:** `@usebruno/cli` (pinned as a local dependency)
- **Endpoint Generator:** TypeScript 5 + `ts-node`
- **CI/CD Orchestration:** Azure DevOps Pipelines
- **Target API:** [Restful-Booker Public API](https://restful-booker.herokuapp.com/)
- **Version Control:** GitHub

---

## 📁 Repository Structure

```text
api-qa-bruno/
├── collections/
│   └── restful-booker/          # Bruno collection (OpenCollection YAML)
│       ├── opencollection.yml   # Collection root
│       ├── environments/
│       │   └── public.yml       # `public` environment (baseUrl)
│       ├── health/              # Smoke tests
│       │   ├── folder.yml
│       │   └── ping.yml
│       └── booking/             # Generated requests
│           ├── folder.yml
│           └── create-booking.yml
├── data/
│   └── endpoints/               # Endpoint definitions (JSON) used by the generator
│       └── create-booking.json
├── tools/
│   └── generate-tests.ts        # Generates Bruno .yml requests from data/endpoints/*.json
├── azure-pipelines.yml          # CI pipeline
├── tsconfig.json
├── package.json
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 22+
- npm

### Install

```bash
npm ci
```

This installs everything locally, including Bruno CLI, so no global install is needed.

### Run the tests

| Command                | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `npm test`             | Runs the whole collection against the `public` environment    |
| `npm run test:booking` | Runs only the `booking` folder                                |
| `npm run test:ci`      | Same as `npm test`, plus JUnit and HTML reports in `reports/` |
| `npm run typecheck`    | Type-checks the generator (`tools/`) without emitting files   |
| `npm run generate`     | Generates request files from `data/endpoints/*.json`          |

---

## 🤖 Endpoint Generator

Instead of writing each request by hand, define it in a JSON file and let the generator produce the Bruno `.yml` file.

### Add a new endpoint

1. Create `data/endpoints/<name>.json`:

   ```json
   {
     "folder": "booking",
     "name": "create-booking",
     "method": "POST",
     "url": "{{baseUrl}}/booking",
     "expectedStatus": 200,
     "headers": { "X-Example": "value" },
     "body": { "firstname": "John", "lastname": "Doe" }
   }
   ```

2. Generate it:

   ```bash
   npm run generate
   ```

3. Run it:

   ```bash
   npm run test:booking
   ```

### Fields

| Field            | Required | Description                                                              |
| ---------------- | -------- | ------------------------------------------------------------------------ |
| `folder`         | ✅       | Folder inside the collection (created if missing, with its `folder.yml`) |
| `name`           | ✅       | Request name, also used as the file name                                 |
| `method`         | ✅       | `GET`, `POST`, `PUT`, `PATCH` or `DELETE`                                |
| `url`            | ✅       | Request URL, supports variables such as `{{baseUrl}}`                    |
| `expectedStatus` | ✅       | HTTP status asserted with `res.status eq <value>`                        |
| `headers`        | ❌       | Extra headers, merged with the defaults below                            |
| `body`           | ❌       | JSON body                                                                |

### Behavior

- **Default headers:** `Content-Type: application/json` and `Accept: application/json`. Restful-Booker answers `418 I'm a teapot` when `Accept` is missing.
- **Existing files are not overwritten.** Use `npm run generate -- --force` to regenerate them.
- **`seq` is calculated automatically** from the existing requests in the folder (an existing request keeps its `seq` when regenerated).
- **Validation:** missing required fields or an invalid method stop the generator with a clear error.

---

## ♾️ Azure DevOps Integration

The repository is connected to **Azure DevOps Pipelines** to enforce Continuous Integration for API testing.

### How it works

1. **Triggering:** a push to `main` or `feature/*`, or a merged Pull Request, triggers the pipeline.
2. **Pipeline stages** (on an ephemeral `ubuntu-latest` agent):
   - Install Node.js 22 and restore the npm cache (keyed on `package-lock.json`).
   - `npm ci`: install the exact dependency versions from the lockfile.
   - `npm run typecheck`: fail fast on TypeScript errors in the generator.
   - `npm run test:ci`: run the Bruno collection headlessly (`--env public`).
   - **Invalid-file guard:** the run fails if Bruno reports `Skipping invalid file`. Bruno alone would skip a malformed `.yml` and still finish as `PASS`.
3. **Feedback loop:**
   - **JUnit results** are published to the Azure _Tests_ tab.
   - **HTML report and raw log** are attached as the `bruno-reports` pipeline artifact.
   - **Build badge** reflects the latest status of `main`.

---

## 📝 Notes

- Tests run against a **public shared API**, so `create-booking` creates a real booking on every run.
- `GET /ping` on Restful-Booker answers `201 Created`, and the smoke test asserts that.
