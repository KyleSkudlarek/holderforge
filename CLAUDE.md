# holderforge

Vite + React app (jscad/three.js) hosted on AWS Amplify Hosting (Gen 1 CLI,
hosting type `cicd`). Amplify builds directly from GitHub on push; there is no
GitHub Actions workflow in this repo.

## Deploy

Two Amplify Hosting apps in us-east-1, account 641383114949. `main` is the only
git branch; never create long-lived branches.

- **Staging = Amplify app `holderforge` (`d3nnchft3fvnkp`)**, connected to
  GitHub, branch `main`, auto-builds on every push. Build spec in the Amplify
  console: `npm ci` → `npm run build` → `dist/`. URL https://staging.holderforge.com
  (alias https://main.d3nnchft3fvnkp.amplifyapp.com). Committing to `main`
  never touches production, so auto-commits are safe.
- **Production = Amplify app `holderforge-prod` (`d3u13d7kxpo2y6`)**, a
  manual-deploy app with no git connection, Amplify branch `production`. Only
  the GitHub Actions workflow `.github/workflows/deploy-prod.yml` deploys to it:
  Actions → "Deploy to production" → Run workflow (default ref `main`), or
  `gh workflow run deploy-prod.yml`. It builds on the runner, zips `dist/`, and
  uses `amplify create-deployment` / `start-deployment`. Rollback = re-run with
  an older SHA. URLs https://holderforge.com, https://www.holderforge.com,
  direct https://production.d3u13d7kxpo2y6.amplifyapp.com.
- **AWS auth for the workflow** is GitHub OIDC → IAM role
  `holderforge-github-deploy`, trust limited to
  `repo:KyleSkudlarek/holderforge:environment:production`. No long-lived keys.
- Amplify manages TLS certificates; no cache invalidation step is required.
- Both apps carry the SPA rewrite `/<*>` → `/index.html` (404-200). Add any
  new custom rule to both.

## Infrastructure inventory

| Resource | Name / id |
|---|---|
| Amplify app (staging) | `holderforge` `d3nnchft3fvnkp`, branch `main` (DEVELOPMENT, auto-build) |
| Amplify app (production) | `holderforge-prod` `d3u13d7kxpo2y6`, branch `production` (PRODUCTION, manual deploy) |
| Amplify custom domain | `staging.holderforge.com` → `holderforge`/`main` |
| Amplify custom domain | `holderforge.com` (+ `www`) → `holderforge-prod`/`production` |
| IAM role | `holderforge-github-deploy` (GitHub OIDC; inline policy `amplify-deploy-holderforge-prod`) |
| IAM OIDC provider | `token.actions.githubusercontent.com` (account-wide, pre-existing) |
| Route 53 hosted zone | `holderforge.com.` `Z01876611GQP3UAURM8LA` |
| Route 53 registered domain | `holderforge.com`, auto-renew on, expires 2027-01-31 |
| GitHub Actions environment | `production` (auto-created by the deploy workflow; add required reviewers there if wanted) |
| CloudFormation stack | `amplify-holderforge-dev-e430a` (Amplify Gen 1 backend for the staging app, hosting only) |
| S3 bucket | `amplify-holderforge-dev-e430a-deployment` (Amplify CLI deployment bucket) |
| IAM roles | `amplify-holderforge-dev-e430a-authRole`, `-unauthRole` |

## Gotchas

- Amplify apps connected to a git repo can only build from a git branch and
  reject `create-deployment`/`start-deployment`; manual-deploy apps are the
  reverse. That is why production is a separate app.
- Custom-domain CNAMEs must point at the CloudFront hostname Amplify returns in
  the domain association, not at `<branch>.<app>.amplifyapp.com`. Pointing at
  the amplifyapp hostname makes the association FAIL and breaks TLS.
- The apex `holderforge.com` is a Route 53 A alias, so Amplify reports that
  subdomain as `verified: false` even when the association is AVAILABLE and
  serving. Trust the domain status, not the per-subdomain flag.
- The staging app's app-level `enableBranchAutoBuild` is false; the per-branch
  `enableAutoBuild` on `main` is what triggers builds.
