# Cloudflare Worker API

Hey there! 👋 Welcome to the Cloudflare Worker API, this repository is a collection of fast and secure APIs. With Cloudflare Workers, our APIs are supercharged to deliver speedy responses no matter where our users are in the world.

base template started from [hono-open-api-starter](https://github.com/w3cj/hono-node-deployment-examples/tree/main/cloudflare-example)

## Important Notice

- This open-source version is provided as-is, without any guarantee of future updates or maintenance
- Future versions of this API service may transition to a closed-source, commercial product
- The author reserves the right to discontinue or limit the open-source version at any time
- Features and functionality in future commercial versions may differ from this open-source release

## Features

- Edge-computed API endpoints optimized for native applications
- Built with Cloudflare Workers for optimal performance
- Database integration using Drizzle ORM
- TypeScript support for type safety and better developer experience

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- [pnpm package manager](https://pnpm.io/installation)
- [Cloudflare account](https://www.cloudflare.com/)
- [Kinde account](https://kinde.com/)
- [OpenAI account](https://platform.openai.com/docs/overview)
- [Deepgram account](https://deepgram.com/)
- [Turso account](https://turso.tech/)
- Turso CLI installed (`npm install -g turso`)
- Wrangler CLI installed (`npm install -g wrangler`)

### Installation

1. Clone the repository w/o the git history: `npx degit monsieurBoutte/jeff-ai-be-cf your-project-name`
2. Install dependencies: `pnpm install`
3. Create a `.env` file and via: `cp .env.sample .env`
4. Create a `.dev.vars` file and via: `cp .env.sample .dev.vars`
5. Run the dev database: `pnpm dev:db`
6. In another terminal, run the dev server: `pnpm dev`
