#!/usr/bin/env bun

import { $ } from "bun";
import { readdirSync } from "node:fs";
import path from "node:path";
const [basePath] = process.argv.slice(2);

$.nothrow();

const absoluteFolderPath =
  !basePath || basePath.startsWith(".")
    ? path.join(process.cwd(), basePath || ".")
    : basePath;

const folderPaths = readdirSync(absoluteFolderPath, { withFileTypes: true })
  .filter((x) => x.isDirectory())
  .map((x) => path.join(absoluteFolderPath, x.name));

await Promise.all(
  folderPaths.map(async (p) => {
    const result:
      | {
          SUM:
            | { nFiles: number; blank: number; comment: number; code: number }
            | undefined;
        }
      | undefined =
      await $`cloc ${p} --exclude-dir node_modules,build,out,.next,.venv --include-ext ts,tsx,js,jsx,md,json,sh,toml,py,sql,txt --json`.json();

    if (!result) {
      return;
    }

    const sum = result.SUM;
    if (!sum) {
      return;
    }
    const { blank, code, comment, nFiles } = sum;

    const totalLines = blank + code + comment;
    const comments = `${totalLines} LOC over ${nFiles} files`;
    console.log(p, comments);
    await $`osascript -e 'on run {f, c}' -e 'tell app "Finder" to set comment of (POSIX file f as alias) to c' -e end "${p}" "${comments}"`.quiet();
  }),
);
