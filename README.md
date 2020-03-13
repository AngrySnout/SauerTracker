# Sauer Tracker 2 (Tomatenquark branch)

Global server and player stats tracking for Cube 2: Tomatenquark.

This is the second iteration of [sauertracker.net](http://sauertracker.net/). It
has many improvements over the original Tracker.

Powered by NodeJS, Webpack, Pug, Sass, PostgreSQL, and Redis.

## Important

The build process in this branch is broken. It was migrated from Gulp to
Webpack, but the front-end JS could not be ported. A new front-end is being
worked on, but in the meantime, this branch provides you with a precompiled set
of assets that works.

## Requirements

**Node.js** (tested on v13.9)  
**PostgreSQL** (tested on 12.2)  
**Redis** (tested on 5.0)

## Configuration

Server configuration is passed through environment variables. The following
variables are supported (and their default values):

```
PORT: 8080
BALANCE_PORT: 36581
DATABASE_URL: 'postgres://localhost:5432'
REDIS_URL: 'redis://localhost:6379'
BASE_ELO: 1200
MASTER_PORT: 28787
MASTER_HOST: master.tomatenquark.org
```

Shared configuration, which includes known clans and mode definitions, is found
in _vars.json_.

## Running via Docker

You can run the Tracker via Docker using Docker Compose with the following
command:

```bash
docker-compose up -d
```

Configuration can be changed in _docker-compose.yml_ under
`services.tracker.environment`.

[Learn more about Docker](https://docs.docker.com/)  
[Learn more about Docker Compose](https://docs.docker.com/compose/)

## Development

```bash
# Clone the repository
git clone https://github.com/AngrySnout/SauerTracker
cd SauerTracker
# Checkout the tomatenquark branch
git checkout tomatenquark
# Install the dependencies
yarn install
# Build the Tracker
yarn buildDev
# Set environment variables
export DATABASE_URL=postgres://user:password@localhost:5432/database
export REDIS_URL=redis://localhost
# Migrate the database
yarn migrate
# Start the Tracker
yarn start
```

## FAQ

**What is the point of having Redis as a requirement?**  
The Tracker uses Redis for persistent cache storage. By delegating caching responsibilities to Redis, restarts and crashes have little effect on the performance of the Tracker.

## License

GNU General Public License v3.0
