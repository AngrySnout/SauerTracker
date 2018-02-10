
/* global module */

// eslint-disable-next-line import/no-extraneous-dependencies
const through = require('through');
const pug = require('pug');

module.exports = function (fileName, options) {
	if (!/\.pug$/i.test(fileName)) {
		return through();
	}

	options.runtimePath = options.runtimePath === undefined ? 'pug-runtime' : options.runtimePath;

	let inputString = '';
	return through(
		(chunk) => {
			inputString += chunk;
		},
		function () {
			const self = this;

			options.filename = fileName;
			options.compileDebug = false;

			let result;
			try {
				result = pug.compileClientWithDependenciesTracked(inputString, options);
			} catch (e) {
				self.emit('error', e);
				return;
			}

			result.dependencies.forEach((dep) => {
				self.emit('file', dep);
			});

			const moduleBody = `var pug = require('${options.runtimePath}');\n\n` +
							`module.exports = template;${result.body};`;

			self.queue(moduleBody);
			self.queue(null);
		},
	);
};
