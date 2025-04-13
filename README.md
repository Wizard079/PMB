# Cricket Fever

Persistent Message Broker (like NATS) using an efficient scalable architecture, consisting of a Pub/Sub Model, which directs the messages "Published" to the Clients who have "Subscribed" to the specific message topic. 


## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `admin-app`: a React.js app
- `user-app`: another React.js app
- `broker-app`: a Node.js app
- `ws-server`: a Node.js app
- `@repo/ui`: a stub React component library
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Database Setup
Create a `dev.db` file in `packages/db/prisma`, and then edit the datasource url in `schema.prisma` with the absolute path of your file.


### Develop

To develop all apps and packages, run the following command:

```
npm install
npx turbo db:generate
npx turbo db:migrate
npm run dev
```
