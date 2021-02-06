![Forking Edge](https://fly.io/public/images/edge-banner.png?@2x)

# Fly Edge

[![npm version](https://img.shields.io/npm/v/@fly/edge.svg)](https://www.npmjs.com/package/@fly/edge)
[![isc license](https://img.shields.io/npm/l/@fly/edge.svg)](https://github.com/superfly/edge/blob/master/LICENSE) 
[![Build Status](https://dev.azure.com/flydotio/fly/_apis/build/status/fly)](https://dev.azure.com/flydotio/fly/_build/latest?definitionId=1)
![Gitter](https://img.shields.io/gitter/room/superfly/fly.svg?colorB=red)


The Fly Edge project is a set of APIs for routing HTTP traffic, cache content, and add "middleware" (like auth) to any application. It's written in TypeScript and runs on the Fly Edge [runtime](https://github.com/superfly/fly). It's built for developers — that means runs locally, has a tests, and integrate into a CI/release pipeline.

The code targets the Service Worker API and uses the Fly runtime API where necessary. You can deploy it to fly.io hosting or run it on any platform with an Edge Service Worker implementation (with reduced features).

## Getting Started

### Pre-requisites

* yarn (`npm install -g yarn`)
* Node 10.x
* node-gyp: https://github.com/nodejs/node-gyp#installation

### Try the starter app

```bash
git clone https://gist.github.com/ebc48856b74fde392a6d62a032b59a97.git forking-edge
cd forking-edge
yarn install
yarn start # visit http://localhost:3000
```

Once you have that running, try swapping in a different origin. Edit `index.ts` and replace `backends.origin("https://getting-started.edgeapp.net")` with `backends.githubPages("superfly/landing")`.

### Deploy to production

You can deploy edge apps to the Fly hosting service using the CLI. Sign up at fly.io, then run:

```bash
yarn fly login
yarn fly app create <name-of-your-app>
yarn fly deploy
```

You can also run on CloudFlare or StackPath, though not all features will work.

## Features

### Straightforward TypeScript/ JavaScript API

You can do a lot with a single `index.ts` file. This example redirects all requests to `https` and caches content when possible:

```typescript
import { backends, middleware, pipeline } from "@fly/edge";

// user middleware for https redirect and caching
const mw = pipeline(
  middleware.httpsUpgrader,
  middleware.httpCache
)

// point it at the origin
const app = mw(
  backends.origin("https://getting-started.edgeapp.net")
);

// respond to http requests
fly.http.respondWith(app);
```

### Backends

[Backends](https://github.com/superfly/edge/tree/master/src/backends) are origin services you can route requests to. The project includes a backend type [any HTTP service](https://github.com/superfly/edge/blob/master/src/backends/origin.ts), and more specialized types for proxying to third party services.

* [GitHub Pages](https://github.com/superfly/edge/blob/master/src/backends/github_pages.ts)
* [Heroku](https://github.com/superfly/edge/blob/master/src/backends/heroku.ts)
* [Ghost Pro](https://github.com/superfly/edge/blob/master/src/backends/ghost_pro.ts)
* [Glitch](https://github.com/superfly/edge/blob/master/src/backends/glitch.ts)
* [Netlify](https://github.com/superfly/edge/blob/master/src/backends/netlify.ts)

Want to help out? Write a new backend type and open a [pull request](https://github.com/superfly/edge/compare?template=backend_type.md)!

### Middleware

[Middleware](https://github.com/superfly/edge/tree/master/src/middleware) applies logic to requests before they're sent to the backend, and responses before they're sent to users.

* [HTTP -> HTTPS upgrader](https://github.com/superfly/edge/blob/master/src/middleware/https-upgrader.ts)
* [Add response headers](https://github.com/superfly/edge/blob/master/src/middleware/response-headers.ts)
* [HTTP caching](https://github.com/superfly/edge/blob/master/src/middleware/http-cache.ts)

## Development

See [CONTRIBUTING](https://github.com/superfly/edge/blob/master/CONTRIBUTING.md).

## Configuration vs code

The Fly Edge can be run standalone with a yaml based configuration schema. If you prefer to run with a config file, check out the config [README](https://github.com/superfly/edge/blob/master/src/config/README.md).

## Who's using it?

* cars.com: HTTP routing
* glitch.com: custom domain routing
* fontawesome.com: CDN for paid customers
* distractify.com: routing, caching, redirect management
* greenmatters.com: routing, caching, redirect management
* artstorefronts.com: custom domain routing
* kajabi.com: custom domain routing
* posthaven.com: custom domain routing

[![](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/flydotio)
