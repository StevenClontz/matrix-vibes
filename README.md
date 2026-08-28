# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.4 create --template minimal --types ts --install npm .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Deploying

This app deploys to [Cloudflare Workers](https://developers.cloudflare.com/workers/) via [`@sveltejs/adapter-cloudflare`](https://svelte.dev/docs/kit/adapter-cloudflare) and [Wrangler](https://developers.cloudflare.com/workers/wrangler/).

Pushes to `main` deploy automatically via the [`deploy` GitHub Actions workflow](.github/workflows/deploy.yml), which requires a `CLOUDFLARE_API_TOKEN` repo secret (a Cloudflare API token scoped to "Edit Cloudflare Workers").

To deploy manually:

```sh
npm run deploy
```

This builds the app and runs `wrangler deploy`. You'll need to be logged in via `npx wrangler login` first.
