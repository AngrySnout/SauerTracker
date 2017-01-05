"use strict";

var through = require("through");
var pug = require("pug");

module.exports = function (fileName, options) {
    if (!/\.pug$/i.test(fileName)) {
        return through();
    }

    options.runtimePath = options.runtimePath === undefined ? "pug-runtime" : options.runtimePath;

    var inputString = "";
    return through(
        function (chunk) {
            inputString += chunk;
        },
        function () {
            var self = this;

            options.filename = fileName;

            var result;
            try {
                result = pug.compileClientWithDependenciesTracked(inputString, options);
            } catch (e) {
                self.emit("error", e);
                return;
            }

            result.dependencies.forEach(function (dep) {
                self.emit("file", dep);
            });

            var moduleBody = "var pug = require(\"" + options.runtimePath + "\");\n\n" +
                             "module.exports = " + result.body + ";";

            self.queue(moduleBody);
            self.queue(null);
        }
    );
};

