# holderforge

Vite + React app (jscad/three.js) hosted on AWS Amplify Hosting (Gen 1 CLI,
hosting type `cicd`). Amplify builds directly from GitHub on push; there is no
GitHub Actions workflow in this repo.

## Deploy

- **Amplify app:** `holderforge`, app id `d3nnchft3fvnkp`, us-east-1, account
  641383114949. Repo `github.com/kyleskudlarek/holderforge`. Build spec lives in
  the Amplify console (not `amplify.yml`): `npm ci` → `npm run build` → `dist/`.
- **Branch → URL mapping** (both branches have auto-build on):
  - `main` → https://main.d3nnchft3fvnkp.amplifyapp.com (staging; see gotcha
    below about `staging.holderforge.com`)
  - `prod` → https://prod.d3nnchft3fvnkp.amplifyapp.com and the **public site**
    https://holderforge.com / https://www.holderforge.com
- **Release to production** = open and merge a GitHub PR `main → prod`. Pushing
  to `main` only redeploys the staging URL, so committing to `main` is safe.
- Amplify manages the TLS certificate; no cache invalidation step is required.

## Infrastructure inventory

| Resource | Name / id |
|---|---|
| Amplify app | `d3nnchft3fvnkp` (branches `main`, `prod`) |
| Amplify custom domain | `holderforge.com` → branch `prod` (status AVAILABLE) |
| Amplify custom domain | `staging.holderforge.com` → branch `main` (status **FAILED**, see gotcha) |
| Route 53 hosted zone | `holderforge.com.` `Z01876611GQP3UAURM8LA` |
| Route 53 registered domain | `holderforge.com`, auto-renew on, expires 2027-01-31 |
| CloudFormation stack | `amplify-holderforge-dev-e430a` (Amplify Gen 1 backend, hosting only) |
| S3 bucket | `amplify-holderforge-dev-e430a-deployment` (Amplify CLI deployment bucket) |
| IAM roles | `amplify-holderforge-dev-e430a-authRole`, `-unauthRole` |

## Gotchas

- **`staging.holderforge.com` is broken (TLS handshake failure).** Route 53 has
  a CNAME to `main.d3nnchft3fvnkp.amplifyapp.com`, but the Amplify domain
  association for `staging.holderforge.com` expects a CNAME to
  `d82kq8zk42w37.cloudfront.net` and has status FAILED, so no certificate covers
  the hostname. Fix: delete the failed domain association, recreate it for
  branch `main`, and point the Route 53 CNAME at the CloudFront target Amplify
  hands back. Until then use the `main.…amplifyapp.com` URL for staging.
- The Amplify app-level `enableBranchAutoBuild` is false, but per-branch
  auto-build is true on both `main` and `prod`; the per-branch setting is what
  controls builds here.
