import noZeroWidthSpaces from "textlint-rule-no-zero-width-spaces";
import prosePunctuation from "textlint-rule-prose-punctuation";
import writeGood from "textlint-rule-write-good";
import jaDocumentStyle from "textlint-rule-ja-document-style";
import jaTechnicalWriting from "textlint-rule-preset-ja-technical-writing";

export const ruleModules: Record<string, any> = {
  "no-zero-width-spaces": noZeroWidthSpaces,
  "prose-punctuation": prosePunctuation,
  "write-good": writeGood,
  "ja-document-style": jaDocumentStyle,
  "preset-ja-technical-writing": jaTechnicalWriting
};
