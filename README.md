# Sauer Tracker 2

Global server and player stats tracking for Cube 2: Sauerbraten.

This is the second iteration of [sauertracker.net](http://sauertracker.net/). It has many improvements over the original Tracker.

Written in ECMAScript 6, the new version of JavaScript, and transpiled to ECMAScript 5 using Babel.
nde
Powered by NodeJS, Pug (Jade), Sass, PostgreSQL, and Redis.

## Important

The build process in this branch is broken. It was migrated from Gulp to
Webpack, but the front-end JS could not be ported. A new front-end is being
worked on, but in the meantime, this branch provides you with a precompiled set
of assets that works.

## Requirements

**Node.js** (tested on v6.10.3)  
**PostgreSQL** (tested on v9.4.12)  
**Redis** (tested on v4.0.6)

## Configuration

There are 2 configuration files: _config.json_ and _vars.json_.  
_config.json_ contains server-side only options, whereas _vars.json_ is shared between the client and the server.  
An example configuration is included in _config.default.json_. You must rename it to _config.json_ before proceeding.  
You will also need an (empty) PostgreSQL database. You can configure the connection URL in _config.json_.  
To learn more, read the [configuration file's wiki page](https://github.com/AngrySnout/SauerTracker/wiki/Configuration-file).

## Installation

```bash
# Clone the repository
git clone https://github.com/AngrySnout/SauerTracker
cd SauerTracker
# Install the dependencies
npm install
# Build the Tracker
npm run-script build
```

### Upgrade

```bash
# Pull the repository
git pull origin master
# Update the dependencies
npm install
# Rebuild the Tracker
npm run-script build
```

### Running

```bash
# Start it using forever, so it restarts automatically when it crashes
npm start
# Manually restart it
npm restart
# Or shut it down
npm stop
```

## Docker

```bash
# Clone the repository
git clone https://github.com/AngrySnout/SauerTracker
cd SauerTracker
# Start SauerTracker
docker-compose up -d
```

### Importing an Old Database

```bash
# If you don't have a dump file already, create one using
pg_dump SauerTracker > dump.sql
# Then put this file in the root directory, edit docker-compose.yml and uncomment the line
# - ./dump.sql:/docker-entrypoint-initdb.d/init.sql:ro
# Start only the database
docker-compose up postgres
# Wait for the import to finish then press CTRL+C to shut it down, recomment the line, and
# start SauerTracker
docker-compose up -d
```

## Development

For development it is easier to have _Gulp_ and _Knex_ installed globally. This can be achieved with:

```bash
npm install gulp -g
npm install knex -g
```

### The Tracker

Then you simply run

```bash
gulp
```

in the root directory, which watches all files for changes and build them accordingly.

To run the Tracker, run

```bash
node index.js
```

in the root directory.

The Tracker has he following file tree:

- _assets_ \* _api/v2/schemas_ - Contains all JSON schemas for API v2. \* _fonts_, _images_ - Static files that don't frequently change. \* _js_ - Browser-side transpiled JavaScript files. \* _styles_ - CSS style files.
- _build_ - Where all transpiled server-side JavaScript files reside.
- _migrations_ - Database migrations.
- _src_ - The core of the tracker. This directory contains all server-side JavaScript code.
- _test_ - Tests for the _src_ directory.
- _website_ \* _js_ - Client-side JavaScript files. \* _styles_ - Sass styles. \* _views_ - Webite views, written in Pug.
- _tracker.default.json_ - Default configuration file.
- _vars.json_ - Various variables used by the Tracker.
- _..._

### The database

The Tracker uses [Knex](http://knexjs.org) for building queries and handling database interaction. If you wish to make changes to the database schema, you have to create a new migration using:

```bash
knex migrate:make migration_name
```

This will create a new file in _/migrations_, in which you should put all changes to the schema ([more about migrations](http://knexjs.org/#Migrations)). When you're done run:

```bash
knex migrate:latest
```

## Documentation

You can use [ESDoc](https://esdoc.org/) to generate documentation. The Tracker's documentation is poor, but should give you an overview of some of the functionality. To generate the docs run the following commands:

```bash
npm install esdoc -g
esdoc -c esdoc.json
```

This will create the docs in the _/esdoc_ directory.

## FAQ

**What is the point of having Redis as a requirement?**  
The Tracker uses Redis for persistent cache storage. By delegating caching responsibilities to Redis, restarts and crashes have little effect on the performance of the Tracker.

## License

GNU General Public License v3.0
