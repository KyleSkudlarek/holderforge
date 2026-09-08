# HolderForge

Web UI for 3D modeling a bottle holder that generates an STL model and Autodesk Fusion python script


## How To Install
```
npm install
```


## How To Run

```
npm run dev -- --host
```

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
