# GitHub Pages deployment

This build is already split into GitHub-friendly static files.

## Upload
Upload the entire contents of this folder to the ROOT of your GitHub repository.

Important files/folders:
- `.nojekyll`
- `index.html`
- `app.js`
- `style.css`
- `data/`

Do not rename or move the files inside `data/` unless you also update `index.html`.

## Enable GitHub Pages
1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select **main** and **/(root)**.
5. Save.

GitHub will provide the public Pages URL after deployment.

## Why the data is split
The previous `data.js` was about 30 MB, which is too large for GitHub's browser file uploader.
This version loads a small base file plus multiple item chunks, each comfortably below that limit.
