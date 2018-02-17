# Sauer Tracker 2
Global server and player stats tracking for Cube 2: Sauerbraten.

This is the second iteration of [sauertracker.net](http://sauertracker.net/). It has many improvements over the original Tracker.   

Written in ECMAScript 6, the new version of JavaScript, and transpiled to ECMAScript 5 using Babel.  

Powered by NodeJS, Pug (Jade), Sass, PostgreSQL, and Redis.

## Requirements

**Node.js** (tested on v6.10.3)  
**PostgreSQL** (tested on v9.4.12)  
**Redis** (tested on v4.0.6)

## Configuration
There are 2 configuration files: *tracker.json* and *vars.json*.   
*tracker.json* contains server-side only options, whereas *vars.json* is shared between the client and the server.   
An example configuration is included in *tracker.default.json*. You must rename it to *tracker.json* before proceeding.   
You will also need an (empty) PostgreSQL database. You can configure the connection URL in *tracker.json*.   
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

## Development
For development it is easier to have *Gulp* and *Knex* installed globally. This can be achieved with:
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

* *assets*
	* *api/v2/schemas* - Contains all JSON schemas for API v2.
	* *fonts*, *images* - Static files that don't frequently change.
	* *js* - Browser-side transpiled JavaScript files.
	* *styles* - CSS style files.
* *build* - Where all transpiled server-side JavaScript files reside.
* *migrations* - Database migrations.
* *src* - The core of the tracker. This directory contains all server-side JavaScript code.
* *test* - Tests for the *src* directory.
* *website*
	* *js* - Client-side JavaScript files.
	* *styles* - Sass styles.
	* *views* - Webite views, written in Pug.
* *tracker.default.json* - Default configuration file.
* *vars.json* - Various variables used by the Tracker.
* *...*

### The database

The Tracker uses [Knex](http://knexjs.org) for building queries and handling database interaction. If you wish to make changes to the database schema, you have to create a new migration using:
```bash
knex migrate:make migration_name
```
This will create a new file in */migrations*, in which you should put all changes to the schema ([more about migrations](http://knexjs.org/#Migrations)). When you're done run:
```bash
knex migrate:latest
```

## Documentation
You can use [ESDoc](https://esdoc.org/) to generate documentation. The Tracker's documentation is poor, but should give you an overview of some of the functionality. To generate the docs run the following commands:
```bash
npm install esdoc -g
esdoc -c esdoc.json
```
This will create the docs in the */esdoc* directory.

## FAQ

**What is the point of having Redis as a requirement?**  
The Tracker uses Redis for persistent cache storage. By delegating caching responsibilities to Redis, restarts and crashes have little effect on the performance of the Tracker.

## License
GNU General Public License v3.0
