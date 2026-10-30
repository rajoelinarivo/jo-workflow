// before-edit: blocks edits to secrets and to files generated from .harness/.
import fs from "node:fs";

const input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
const files = input.files || [];

const SECRETS = [/(^|\/)\.env(\.[\w.-]+)?$/, /(^|\/)secrets\//, /\.(pem|key|p12|pfx)$/, /(^|\/)id_(rsa|ed25519)$/];
const ALLOWED_SECRETS = [/\.env\.(example|sample|template)$/];

let generated = {};
try {
  generated = JSON.parse(fs.readFileSync(".harness/lock.json", "utf8")).files || {};
} catch {}

for (const f of files) {
  if (SECRETS.some((re) => re.test(f)) && !ALLOWED_SECRETS.some((re) => re.test(f))) {
    process.stderr.write(`Blocked by protect-files: ${f} holds secrets. Ask the user to change it.`);
    process.exit(2);
  }
  if (f === ".harness/lock.json") {
    process.stderr.write("Blocked by protect-files: .harness/lock.json is maintained by `jo-workflow sync`.");
    process.exit(2);
  }
  if (f in generated) {
    process.stderr.write(
      `Blocked by protect-files: ${f} is generated from .harness/. Edit the source in .harness/ (skills/, agents/, memory/, hooks/, loops/ or harness.json), then run \`jo-workflow sync\`.`
    );
    process.exit(2);
  }
}
