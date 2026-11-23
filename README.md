# Sand Theft

A comedic incremental game about Cezary Baryka turning a playground sandbox into an entire glass housing program.

## Run locally

Requires Node.js and Python 3. No packages need to be installed.

```sh
npm start
```

Open <http://localhost:4173> in your browser. Progress is saved in the browser; no sand is collected while the game is closed.

## Test

```sh
npm test
```

See [GAME_DESIGN.md](GAME_DESIGN.md) for the game's progression, scope, and design decisions. The playable files are in `dist/`.

## Language and test mode

Choose **English** or **Polski** in the header. The game remembers your choice without changing your progress.

Open <http://localhost:4173/?debug=1> for the debug menu. It uses a separate browser save. You can jump to any area, empty it for the remaining sand, grant resources, or restart the test run. Granting houses or Universes opens the relevant tab. To return to the regular campaign, remove `?debug=1` from the address.

## GitHub Pages

In the GitHub repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. The **Deploy to GitHub Pages** workflow runs the tests and publishes `dist/` on pushes to `main`. You can also run it manually against `main` from the **Actions** tab.

The deployment job links to the published game. For this repository, the default address is <https://felix-1871.github.io/sand-theft/>. The debug menu is available by appending `?debug=1` to that address.
