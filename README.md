# DropIn GitHub Deployment

This folder is a standalone GitHub Pages package for the DropIn landing.

## Included

- `index.html`
- `styles.css`
- `script.js`
- `assets/`
- `.nojekyll`
- `site.webmanifest`
- `.github/workflows/deploy-pages.yml`

## Publish on GitHub

1. Create a new GitHub repository.
2. Upload the full contents of this folder to the repository root.
3. Make sure the default branch is `main`.
4. In GitHub, open `Settings > Pages`.
5. Set the source to `GitHub Actions`.
6. Push to `main` and wait for the workflow `Deploy DropIn Landing`.

## Forms

The landing is visually ready, but real email delivery starts only after adding a Web3Forms access key in `script.js`.

Current placeholder:

```js
const WEB3FORMS_ACCESS_KEY = "";
```

After the site is live, add the real key and test both forms on the public URL.
