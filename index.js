"use strict";
var asc_1 = require("assemblyscript/cli/asc");
function init(modules) {
    var ts = modules.typescript;
    function create(info) {
        var proxy = Object.create(null);
        var _loop_1 = function (k) {
            var x = info.languageService[k];
            proxy[k] = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return x.apply(info.languageService, args);
            };
        };
        for (var _i = 0, _a = Object.keys(info.languageService); _i < _a.length; _i++) {
            var k = _a[_i];
            _loop_1(k);
        }
        proxy.getSemanticDiagnostics = function (fileName) {
            var diagnostics = [];
            var root = info.project.getCurrentDirectory();
            var entry = fileName.replace(root + "/", "");
            try {
                var reportDiagnostic = function (d) {
                    diagnostics.push({
                        category: 1,
                        code: d.code,
                        file: info.project.getSourceFile(info.project.projectService.toPath(fileName)),
                        start: d.range.start,
                        length: d.range.end - d.range.start,
                        messageText: d.message
                    });
                };
                asc_1.main(["--runtime", "stub", entry], {
                    stdout: asc_1.createMemoryStream(),
                    stderr: asc_1.createMemoryStream(),
                    reportDiagnostic: reportDiagnostic,
                    readFile: function (fileName, baseDir) {
                        if (fileName.endsWith("asconfig.json"))
                            return null;
                        var path = baseDir.startsWith("/")
                            ? baseDir
                            : root + "/" + baseDir;
                        return info.project.readFile(path + "/" + fileName) || null;
                    },
                    writeFile: function () { }
                }, function (err) {
                    info.project.log("ERROR: " + err.message);
                    return 1;
                });
            }
            catch (_a) { }
            return diagnostics;
        };
        return proxy;
    }
    return { create: create };
}
module.exports = init;
