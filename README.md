# HolderForge

Storefront for 3D-printed bottle holders: a catalog of ready-made sizes backed
by a measured-bottle database (`src/catalog/`, see `docs/catalog.md`) and a
designer (`/design`) that generates the STL and an Autodesk Fusion python script.


## How To Install
```
npm install
```


## How To Run

```
npm run dev -- --host
```

`npm run build` also prerenders every catalog route to static HTML and writes
the sitemap (`scripts/prerender.mjs`).

## How To Access Locally
https://localhost:5173


## How To Access from Mobile

https://192.168.1.225:5173


## CI/CD

`main` is the only branch. Two AWS Amplify Hosting apps, both us-east-1:

| Environment | URL | How it deploys |
|---|---|---|
| Staging | https://staging.holderforge.com (alias https://main.d3nnchft3fvnkp.amplifyapp.com) | Automatic on every push/merge to `main` (Amplify app `holderforge`, connected to this repo) |
| Production | https://holderforge.com | Manual: GitHub → Actions → **Deploy to production** → Run workflow (or `gh workflow run deploy-prod.yml`). Builds the chosen ref and uploads `dist/` to Amplify app `holderforge-prod`. |

Roll back by re-running the workflow with an older commit SHA.

## Backend (payments)

`backend/` is an AWS SAM app: Stripe Checkout session creation, Stripe webhook,
Shippo label purchase, owner email. See [docs/payments.md](docs/payments.md).

```
cd backend && npm install && npm test
npm run deploy:staging      # sam build && sam deploy --config-env staging
```
