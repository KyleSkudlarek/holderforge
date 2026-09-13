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
- **Backend (`backend/`, AWS SAM)**: stacks `holderforge-api-staging` and
  `holderforge-api-prod`. Staging deploys from `deploy-staging-backend.yml` on
  any push to `main` that touches `backend/**`; prod deploys as the first job of
  `deploy-prod.yml`. Local: `cd backend && npm run deploy:staging`. Secrets and
  personal data live in SSM under `/holderforge/<stage>/`, never in the repo.
  Full flow, parameters and go-live checklist: `docs/payments.md`.
- The storefront reads the API base URL from `VITE_API_URL` at build time. On
  the staging Amplify app it is an app environment variable; the prod workflow
  injects it from the stack output. Unset means the Order panel shows
  "Coming Soon" and never calls the API.

## Site structure

Two halves: the designer (`/design`, `src/GridPreview.jsx`, dark `theme`) and
the catalog (`src/site/` pages driven by `src/catalog/` data, light
`lightTheme` applied per-route in `App.jsx`; both themes share token names). Routes, data model, photo
naming and the prerender step: `docs/catalog.md`. Adding a measured bottle is
one row in `src/catalog/bottles.js`; everything else derives from it.

## Infrastructure inventory

| Resource | Name / id |
|---|---|
| Amplify app (staging) | `holderforge` `d3nnchft3fvnkp`, branch `main` (DEVELOPMENT, auto-build) |
| Amplify app (production) | `holderforge-prod` `d3u13d7kxpo2y6`, branch `production` (PRODUCTION, manual deploy) |
| Amplify custom domain | `staging.holderforge.com` → `holderforge`/`main` |
| Amplify custom domain | `holderforge.com` (+ `www`) → `holderforge-prod`/`production` |
| IAM role | `holderforge-github-deploy` (GitHub OIDC, trusts environments `production` and `staging`; PowerUserAccess + inline `amplify-deploy-holderforge-prod` + `holderforge-api-stack-roles`) |
| CloudFormation stacks | `holderforge-api-staging`, `holderforge-api-prod` (SAM; HTTP API, 2 Lambdas, DynamoDB table `holderforge-orders-<stage>`, S3 `holderforge-uploads-<stage>-641383114949`) |
| SSM parameters | `/holderforge/<stage>/{stripe/secret_key, stripe/webhook_secret, shippo/api_key, ship_from, notify_email}` |
| Stripe | account HolderForge; webhook endpoints per stage managed by `backend/scripts/register-stripe-webhook.sh` |
| Shippo | account for label purchase; test and live tokens in SSM |
| SES | email identity = `notify_email` (sandbox mode is sufficient) |
| IAM OIDC provider | `token.actions.githubusercontent.com` (account-wide, pre-existing) |
| Route 53 hosted zone | `holderforge.com.` `Z01876611GQP3UAURM8LA` |
| Route 53 registered domain | `holderforge.com`, auto-renew on, expires 2027-01-31 |
| GitHub Actions environments | `production`, `staging` (auto-created by the workflows; add required reviewers to `production` if wanted) |
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
- SSM `GetParametersByPath` evaluates the path WITH a trailing slash, so the IAM
  resource must list both `parameter/holderforge/<stage>` and
  `parameter/holderforge/<stage>/*`; the first form alone is AccessDenied.
- SAM's esbuild builder installs production dependencies only, so `esbuild`
  must sit in `dependencies` in `backend/package.json`, not devDependencies.
- The Claude Code `Bash(aws *)` allow rule is a prefix match on the whole
  command: `VAR=x aws ...` or `cat > f && aws ...` does not match and is routed
  to the auto-mode classifier, which blocks IAM/DNS writes. Run `aws` commands
  as standalone commands.
- Headless Chrome renders this app blank without `--use-angle=swiftshader
  --enable-unsafe-swiftshader` (three.js/regl need WebGL).
- `scripts/prerender.mjs` reads `dist/index.html` as its template and
  overwrites it, so it only works right after `vite build`; always run
  `npm run build`, never the script alone twice.
- `vite preview` serves the SPA fallback for `/shop` etc. instead of the
  prerendered `dist/shop/index.html`; to check prerendered pages locally serve
  `dist/` with `python3 -m http.server` (or any static server) and use
  trailing slashes.
- The SSR bundle must inline `styled-components` and `react-helmet`
  (`ssr.noExternal` in the prerender script); as externals their default
  exports resolve wrong under Node ESM and `styled.div` is undefined.
- Amplify 301s `/shop` to `/shop/` because prerendered routes are directories.
  Internal links, canonicals and the sitemap all use trailing slashes
  (`canonicalUrl` in `src/site/Seo.jsx`); keep new links that way.
- `npm run lint` has ~140 pre-existing errors in `GridPreview.jsx` (prop-types,
  unused imports); it is not a gate.
