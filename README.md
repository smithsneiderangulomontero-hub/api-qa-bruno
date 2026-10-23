# 🚀 API Test Automation with Bruno & Azure DevOps

[![Build Status](https://dev.azure.com/smithsneiderangulomontero/api-qa-bruno/_apis/build/status/smithsneiderangulomontero-hub.api-qa-bruno?branchName=main)](https://dev.azure.com/smithsneiderangulomontero/api-qa-bruno/_build)

Automated API testing suite for **Restful-Booker** built using **Bruno CLI** and integrated into an **Azure DevOps CI/CD Pipeline**.

---

## ♾️ Azure DevOps Integration Architecture

This repository is connected directly to **Azure DevOps Pipelines** to enforce Continuous Integration (CI) practices for API testing.

### How the Integration Works

1. **Webhook Triggering:**
   Whenever code is pushed to `main` or a `feature/*` branch (or when a Pull Request is merged), GitHub sends a webhook event to Azure DevOps.

2. **Automated Pipeline Execution:**
   - Azure DevOps provisions an ephemeral **Ubuntu Linux Runner** (`ubuntu-latest`).
   - It installs Node.js and `@usebruno/cli` dynamically in a clean containerized environment.
   - The test suite is executed headlessly against target environment configurations (`bru run --env public`).

3. **Feedback Loop & Artifact Publishing:**
   - **JUnit Test Results:** Raw test execution results are published to the **Azure Test Plans / Run Summary** dashboard for native metrics tracking.
   - **HTML Reports:** A standalone interactive HTML test report is generated and attached to the build as a downloadable pipeline artifact (`bruno-reports`).
   - **Build Status:** Build badges reflect real-time pipeline status directly on the repository home page.

## 🛠️ Tech Stack & Tools

- **Test Framework:** [Bruno](https://www.usebruno.com/) (Open-source API Client)
- **CLI Execution:** `@usebruno/cli`
- **CI/CD Orchestration:** Azure DevOps Pipelines
- **Target API:** [Restful-Booker Public API](https://restful-booker.herokuapp.com/)
- **Version Control:** GitHub

---

## 📁 Repository Structure

```text
api-qa-bruno/
├── collections/
│   └── restful-booker/        # Bruno API Collection
│       ├── environments/      # Environment configurations (public.yml)
│       └── health/            # Health checks & smoke tests (ping.yml)
├── data/                      # Test data / payloads (if applicable)
├── azure-pipelines.yml        # CI/CD Pipeline configuration
└── README.md                  # Project documentation
```
