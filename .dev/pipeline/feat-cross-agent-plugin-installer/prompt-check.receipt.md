# prompt-check receipt

overall: pass

| check | state | command | summary |
| --- | --- | --- | --- |
| retired-marker | pass | - | prompt does not carry a retired contract marker |
| status-heading | pass | - | requires `## Status` |
| current-task-anchor | pass | - | requires `Current Task:` |
| tasks-heading | pass | - | requires `## Tasks` |
| unchecked-task-anchor | pass | - | requires at least one `- [ ] T-NN` task line |
| imported-from-shape | pass | - | imported-from line absent - not required |
| test-results-heading | pass | - | requires `## Test Results` |
| review-results-heading | pass | - | requires `## Review Results` |
| review-subsection-architecture | pass | - | requires `### Architecture Review` |
| review-subsection-business | pass | - | requires `### Business Review` |
| review-subsection-design | pass | - | requires `### Design Review` |
| review-subsection-engineering | pass | - | requires `### Engineering Review` |
| equivalence-receipt | pass | - | equivalence-verdict is EQUIVALENT and prompt-hash matches the live prompt body |
