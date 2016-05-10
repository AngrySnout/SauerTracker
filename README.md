# Sauer Tracker 2
Global server and player stats tracking for Cube 2: Sauerbraten.

This is the second iteration of [sauertracker.net](http://sauertracker.net/). It has many improvements over the original Tracker.   

Written in ECMAScript 6, the new version of JavaScript, and transpiled to ECMAScript 5 using Babel.  

Powered by NodeJS, Jade, Sass, and PostgreSQL.

## Configuration
There are 2 config files: *tracker.json* and *vars.json*.   
*tracker.json* contains server-side only options, whereas *vars.json* is shared between the client and the server.   
An example configuration is included in *tracker.default.json*. You must rename it to *tracker.json* before proceeding.   
You will also need an (empty) PostgreSQL database. You can configure the connection URL in *tracker.json*.   
To learn more, read the [configuration file's wiki page](https://github.com/AngrySnout/SauerTracker/wiki/Configuration-file).


## Installation
```bash
# Clone the repository
git clone https://github.com/AngrySnout/SauerTracker
cd SauerTracker
# Then install the dependencies
npm install
# Build the Tracker
npm run-script build
# And start it
npm start
# This starts it using forever, so it restarts automatically when it crashes.
# You can manually restart it
npm restart
# Or shut it down
npm stop
```   

## Upgrade
```bash
# Pull the repository
git pull origin master
# Update the dependencies
npm install
# Rebuild the Tracker
npm run-script build
```   

## Running
```bash
# Start it using forever, so it restarts automatically when it crashes
npm start
# Manually restart it
npm restart
# Or shut it down
npm stop
```   

## Development
The Tracker is split into 2 parts; the tracker, and the website, each of which has its own *package.json* file.    
For development it is easier to have *Gulp* and *Knex* installed globally. This can be achieved with:
```bash
npm install gulp -g
npm install knex -g
```   

#### The tracker

The tracker source is in the *src* directory. It is written in ES6 and requires transpilation to ES5. You can run `gulp` from the main directory, which will watch the *src* directory for any changes and automatically update the *build* directory.

To run the Tracker for testing, from the parent directory run `node main.js`.

#### The website

The website source is placed in the *website/src* directory. All scripts are transpiled and then bundled using Browserify. You can run `gulp` from inside the *website* directory and it will watch the SCSS and ES6 files, compile/bundle them accordingly, and place them in *website/build*.

Note that for production you should always use `npm run-script build`, which will additionally remove source maps and minify files (this only applies to the website, the tracker will still have source maps).

#### The database

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

## License
GNU General Public License v3.0
