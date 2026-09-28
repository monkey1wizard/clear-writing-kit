const fs = require("node:fs");
const path = require("node:path");
const profile = require("./profile.cjs");
let failures = 0;
for (const language of ["en-US", "zh-TW", "ja-JP"]) {
  for (const genre of ["document", "conversation"]) {
    const file = path.join(__dirname, "profiles", language + "." + genre + ".json");
    const expected = JSON.stringify(profile(language, genre), null, 2) + "\n";
    if (process.argv.includes("--check")) {
      if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== expected) {
        console.error("missing or stale profile: " + file);
        failures++;
      }
    } else fs.writeFileSync(file, expected);
  }
}
process.exitCode = failures ? 1 : 0;
