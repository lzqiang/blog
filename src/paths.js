import path from "node:path";

export function hrefFrom(fromOutputPath, toOutputPath) {
  const fromDirectory = path.posix.dirname(fromOutputPath);
  const relative = path.posix.relative(fromDirectory, toOutputPath);
  return relative || path.posix.basename(toOutputPath);
}
