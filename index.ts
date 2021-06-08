import { createMemoryStream, main } from "assemblyscript/cli/asc";
import { DiagnosticMessage } from "assemblyscript";
import { Diagnostic } from "typescript";

function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    const proxy: ts.LanguageService = Object.create(null);
    for (let k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      const x = info.languageService[k];
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
    }

    proxy.getSemanticDiagnostics = (fileName: string) => {
      const diagnostics: Diagnostic[] = [];
      const root = info.project.getCurrentDirectory();
      const entry = fileName.replace(`${root}/`, "");

      try {
        const reportDiagnostic = (d: DiagnosticMessage) => {
          diagnostics.push({
            category: 1,
            code: d.code,
            file: info.project.getSourceFile(
              info.project.projectService.toPath(fileName)
            ),
            start: d.range.start,
            length: d.range.end - d.range.start,
            messageText: d.message,
          });
        };
        main(
          ["--runtime", "stub", entry],
          {
            stdout: createMemoryStream(),
            stderr: createMemoryStream(),
            reportDiagnostic,
            readFile(fileName, baseDir) {
              if (fileName.endsWith("asconfig.json")) return null;

              const path = baseDir.startsWith("/")
                ? baseDir
                : `${root}/${baseDir}`;
              return info.project.readFile(`${path}/${fileName}`) || null;
            },
            writeFile() {},
          },
          (err) => {
            info.project.log(`ERROR: ${err.message}`);
            return 1;
          }
        );
      } catch {}

      return diagnostics;
    };

    return proxy;
  }

  return { create };
}

export = init;
