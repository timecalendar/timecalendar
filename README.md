# TimeCalendar

## Development setup

### Docker

To start working on TimeCalendar, you must first [install Docker](https://docs.docker.com/get-docker/).

Once Docker is installed, start the dev-env services (Postgres, Redis, and an
nginx TLS proxy) in the background. The compose file lives in `server/`:

```bash
cd server && docker compose up -d
```

### Node.js

TimeCalendar is written in TypeScript and runs with Node.js. [Install Node.js](https://nodejs.org/en/) on your environment.

Once Node.js is installed, install npm dependencies:

```bash
npm install
```

### Init your environment

Copy the file `server/.env.sample` to a new file named `server/.env`. In
development most values already have sensible defaults (see
`server/src/config/environments/development.ts`), so this file only needs
`NODE_ENV=development`.

### Firebase

TimeCalendar uses Firebase to send push notifications and save application settings. You can either use the private development Firebase account or create your own.

**Create your own service account key**

On the [Firebase Console](https://console.firebase.google.com/), create your own application. Go into your Project settings > Your apps and create a web application. Then, go in the Service accounts tab, and click on "Generate new private key", it will download a file. Copy it into `server/config/serviceAccountKey.json`.

You also need to create a Firestore Database. In the left bar, click on Firestore Database, then on "Create database". Select "Start in test mode", then "Next". Select any region for the Firestore location (you can select the nearest, eur3), then click on "Enable".

### Start the server

To start the server, run the following command:

```bash
cd server && npm run dev
```

## Mobile app

The Flutter mobile app lives in [`app/`](./app). To run it against this local
dev env (e.g. on an iOS simulator), first run `npm run setup` to wire up the
`/etc/hosts` entries, `web/.env.local`, and the simulator's trusted dev cert,
then follow the [app README](./app/README.md). The app talks to the API server
started above on `:3005`.

## Tests

To run tests:

```bash
npm run test
```

## Migrations

Run all commands in the `server` folder.

Migrations do not run automatically in development (`RUN_MIGRATIONS=false`), so
run them manually after starting the Docker stack and before starting the server.

**Create a migration**

```
npm run db:generate
```

**Run migrations**

```
npm run db:migrate
```

## Seed data

The dev database starts empty (the schools list is empty until seeded). Load the
fixture data (schools, school groups) from the `server` folder:

```
npm run db:seed
```

Use `npm run db:init` to drop the database, re-run migrations, and reseed from
scratch.
