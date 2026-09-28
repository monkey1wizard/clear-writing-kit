// The CLI and MCP server load the same explicit locale and genre profile.
module.exports = function profile(language, genre) {
  if (!["en-US", "zh-TW", "ja-JP"].includes(language) || !["document", "conversation"].includes(genre)) {
    throw new Error("Unknown language or genre");
  }
  const rules = {
    "no-zero-width-spaces": true,
    "prose-punctuation": true
  };
  if (language === "en-US") {
    rules["write-good"] = {
      severity: "warning", passive: false, illusion: false, so: false,
      thereIs: false, weasel: false, adverb: false, tooWordy: true, cliches: true
    };
  }
  if (language === "ja-JP") {
    if (genre === "document") rules["ja-document-style"] = true;
    rules["preset-ja-technical-writing"] = {
      "sentence-length": { max: 100, severity: "warning" },
      "max-ten": { max: 3, severity: "warning" },
      "max-comma": { max: 3, severity: "warning" },
      "max-kanji-continuous-len": { max: 6, severity: "warning" },
      "no-mix-dearu-desumasu": {
        preferInHeader: "である",
        preferInBody: genre === "document" ? "である" : "ですます",
        preferInList: genre === "document" ? "である" : "ですます",
        strict: true
      }
    };
  }
  return { rules };
};
