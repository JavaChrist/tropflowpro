## Générateur d'icônes (Sharp)

Script `generate-icons.mjs` pour générer toutes les tailles d’icônes (favicon, PWA, Apple Touch) à partir d’un PNG.

## Installation

```bash
npm i -D sharp
```

## Utilisation rapide

- Script NPM:

```bash
npm run icons:gen
```

- Équivalent direct:

```bash
node scripts/generate-icons.mjs --src public/logo512.png
```

## Options

- `--src <path>`: PNG source (de préférence carré, ex: 1024x1024)
- `--out <dir>`: dossier de sortie (défaut: `public`)
- `--bg <hex>`: fond (ex: `#ffffff`), sinon transparent

## Exemples

```bash
# Fond transparent (par défaut)
node scripts/generate-icons.mjs --src public/logo512.png

# Fond blanc
node scripts/generate-icons.mjs --src public/logo512.png --bg #ffffff

# Générer dans un dossier spécifique
node scripts/generate-icons.mjs --src public/logo512.png --out public
```

## Notes

- Tailles générées: 16, 32, 48, 64, 96, 128, 192, 256, 384, 512 + Apple Touch (152, 167, 180, et `apple-touch-icon.png`).
- `public/manifest.json` et `public/index.html` référencent déjà ces icônes.
- Pour forcer le rafraîchissement du cache, incrémentez le suffixe `?v=2` si nécessaire.
