# TimeCalendar

## Development setup

### Docker

To start working on TimeCalendar, you must first [install Docker](https://docs.docker.com/get-docker/).

Once Docker is installed, start the MySQL server in background:

```bash
docker-compose up -d
```

You should have access to phpMyAdmin here: http://localhost:3310/

### Node.js

TimeCalendar is written in JavaScript and runs with Node.js. [Install Node.js](https://nodejs.org/en/) on your environment (current version v16).

Once Node.js is installed, install yarn and npm dependencies:

```bash
corepack enable
yarn
```

### Init your environment

Copy the file `.env.sample` to a new file named `.env`.

### Firebase

TimeCalendar uses Firebase to send push notifications and save application settings. You can either use the private development Firebase account or create your own.

**Create your own service account key**

On the [Firebase Console](https://console.firebase.google.com/), create your own application. Go into your Project settings > Your apps and create a web application. Then, go in the Service accounts tab, and click on "Generate new private key", it will download a file. Copy it into `config/serviceAccountKey.json`.

You also need to create a Firestore Database. In the left bar, click on Firestore Database, then on "Create database". Select "Start in test mode", then "Next". Select any region for the Firestore location (you can select the nearest, eur3), then click on "Enable".

### Start the server

To start the server, run the following command:

```bash
yarn dev
```

## Tests

To run tests:

```bash
yarn test
```

## Migrations

Create a migration

```
yarn typeorm migration:generate -n MigrationName
```

Run migrations


```
yarn typeorm migration:run
```
