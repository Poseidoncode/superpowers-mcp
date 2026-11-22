# Planning-Handoff Review

Read this when the spec is written and committed, before the User Review Gate.

**Planning-Handoff Review:**
This is the spec self-review. Before asking for review, set the conversation
aside and temporarily act as a
fresh planning agent whose only inputs are the finished spec and the repository.
Begin mapping how you would turn the spec into an implementation plan, but do not
write that plan. Trace each affected entry point through the relevant components
and state transitions. Note each point where planning would require you to
rediscover design intent or invent a binding decision rather than choose an
implementation detail. Include placeholders, internal contradictions, scope
problems, and ambiguous requirements in this assessment; they are handoff seams,
not a separate review stage.

Rate the spec's planning-handoff readiness from 0.0–9.9 and explain what
prevents the next higher rating using repository and artifact evidence:
0 = reject; 2 = major redesign; 4 = substantial design rescue; 6 = usable but
planning must reconstruct a binding decision; 8 = handoff-ready with only
planning-owned choices; 9.9 = rare exemplary ceiling, never perfection. The
rating prompts the assessment; it does not decide whether the artifact improves.

Translate every design-owned reason preventing the next higher rating into a
burden ledger before editing. One burden is one independent binding decision or
piece of design reconstruction the planning agent must resolve before it can
specify implementation work. Record planning-owned choices separately rather
than counting them as burdens. For each burden, state the repository or artifact
evidence, what the planner would have to invent, and its weight:

- **minor (1):** a localized clarification or reconstruction;
- **major (2):** an unresolved binding decision or cross-component design
  uncertainty. Record contradictions and departures from the approved design
  separately; they are not ordinary tradeable burdens.

After the initial rating and ledger, take exactly one branch:

- If the rating is below 9.0 **or** the ledger contains any burden, preserve the
  initial draft, return to the spec-writer role, and make one bounded improvement
  pass targeting the evidence-based reasons preventing 9.0 and the named
  burdens. Do not resolve a purely planning-owned choice merely to raise the
  rating.
- Only if the rating is at least 9.0 **and** the burden ledger is empty, make no
  edit.

The bounded pass is the only review-driven editing phase after the first
complete draft. It may clarify, reconcile, and complete the spec using the
approved design, stated requirements, and repository evidence; preserve the
binding decisions already approved in the conversation. When an improvement
would require a new or changed binding design decision, leave it as a burden
instead of choosing it.

After the pass, close editing and reassess both versions read-only. Trace every
concept changed by the pass through the whole spec, including the state model,
entry points, failure/recovery rules, and acceptance criteria. Give a fresh
rating, build the final burden ledger from scratch, and compare it with the
initial ledger. Include burdens that moved or appeared elsewhere. Check
separately for a newly introduced major burden, contradiction, departure from
approved design, or scope change. More specific wording is not automatically an
improvement.

Select the revised draft only when its total weighted burden is lower and it
introduces no new major burden, contradiction, or design departure. New minor
burdens are permitted only when the total burden still falls. Otherwise restore
the preserved initial draft. Restoring the original is the only spec mutation
permitted after reassessment: do not fix the revised draft or begin another
pass. Present the selected spec through the normal user review handoff, and
commit the selected draft — with any changes the user requests afterwards — so
that handoff always points at a committed revision.
Keep the ratings, burden ledgers, and comparison in your private review; do not
add them to the spec or require them as a separate handoff artifact.
If the original was restored, mention briefly that the tentative revision was
rejected and the original retained; do not add a separate review artifact.

Accept, restore, and report based on burden—not whether the rating rose. The
review never grants permission to begin planning. Do not produce task sequencing,
invoke `writing-plans`, or repeat the pass.
