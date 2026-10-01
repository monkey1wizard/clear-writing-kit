# planning-check receipt

overall: pass

| check | state | command | summary |
| --- | --- | --- | --- |
| open-questions-cleared | pass | - | Open Questions is `None` |
| required-sections | pass | - | all required planning sections are present |
| approval-shape | pass | - | four ordered Approval fields conform to grammar and closed sets |
| arch-review-clear | pass | - | ARCH_REVIEW clear marker present (standalone line) |
| arch-review-consistency | pass | - | Architect review token `clear` and ARCH_REVIEW marker agree |
| naming-gate | pass | - | 0 violation(s) across 0 file(s) |
| plan-language | pass | - | planLanguage=zh-TW; 31/178 prose lines pure-English (<= 30% ok) |
| simplified-term | pass | - | planLanguage=zh-TW; no high-risk simplified-Chinese characters in prose |
| localized-metadata | pass | - | localized metadata + draft/source hashes match |
| machine-anchor-parity | pass | - | 182 machine-anchored items match localized <-> draft |
