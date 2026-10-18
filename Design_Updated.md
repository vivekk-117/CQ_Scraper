# Design Guidelines — IIT Kharagpur Event Lead Discovery

> Product: an agent-assisted workspace for finding, evaluating, and organizing potential sponsors and college delegations for an IIT Kharagpur event.
>
> Goal: help an event organizer go from a clear search brief to a credible, actionable shortlist with as little friction as possible.
>
> These guidelines are implementation instructions for Antigravity. Prefer a coherent, working product over decorative UI or a large collection of features.

---

## 1. Product principles

1. **Lead work comes first.** The central object is a useful lead, not the AI agent or its logs.
2. **Make the next action obvious.** At any point, users should understand what to do next: define a search, review leads, verify a contact, or export.
3. **Show evidence, not artificial certainty.** Distinguish confirmed facts, inferred details, and unverified information. Never imply that a lead or contact is verified unless the underlying process supports that claim.
4. **Progressive disclosure.** Keep the default screen focused. Put technical activity, detailed evidence, and advanced settings behind clearly named expandable areas.
5. **Use real product content.** Avoid generic SaaS slogans, invented metrics, fake activity, sample organizations presented as real, and filler copy.
6. **Design for organizers.** Assume users may be student organizers who are comfortable with spreadsheets but do not want to understand crawling infrastructure.
7. **Every element must earn its place.** Remove any panel, badge, animation, metric, or button that does not help users find, assess, manage, or export leads.

## 2. Visual direction

Use a **quiet, precise, editorial workspace** aesthetic: professional, legible, restrained, and appropriate for an institutional event. Avoid making the product look like a sci-fi AI control room.

### Theme

- Default to a light, warm-neutral interface unless the existing product already has a strong, deliberate dark theme. Do not implement both themes unless there is a real user need.
- Suggested light tokens:
  - App background: `#F7F8FA`
  - Main surface: `#FFFFFF`
  - Secondary surface: `#F1F3F5`
  - Primary text: `#17202A`
  - Secondary text: `#5F6B76`
  - Muted text: `#77818B`
  - Border: `#E2E6EA`
  - Primary action: `#2457C5`
  - Sponsor category: `#087F8C`
  - Delegation category: `#6B4DB3`
  - Success: `#18794E`
  - Warning / needs review: `#946200`
  - Error: `#B42318`
- Use color semantically and sparingly. Category and status must also have readable text labels; never rely on color alone.
- If retaining dark mode, map these semantic roles to an accessible dark palette rather than simply inverting colors.

### Avoid visual clichés

Do not use by default:
- Large purple/blue gradient hero backgrounds or gradient CTA buttons.
- Glassmorphism, glowing borders, neon accents, or excessive blur.
- A grid of many identical metric cards.
- Decorative blobs, abstract AI illustrations, floating orbs, or stock imagery without a product purpose.
- Emoji as interface icons.
- Constant shimmer, pulsing, bouncing, or animated elements.
- Multiple competing accent colors or shadows on every surface.

A gradient, illustration, or animation is allowed only when it has a clear, product-specific purpose.

## 3. Typography, spacing, and components

- Use one interface sans-serif family, such as Inter or the system UI stack. A second monospace family is reserved for technical logs or raw identifiers, not normal contact details.
- Use a restrained type scale:
  - Page title: 28–32 px, semibold.
  - Section title: 18–20 px, semibold.
  - Card or panel title: 15–16 px, semibold.
  - Body and table text: 14 px minimum where practical.
  - Metadata: 12–13 px; never use muted text for important information.
- Use a consistent 4 px base spacing scale, with 8, 12, 16, 24, and 32 px as common values.
- Standardize control heights: 36 px compact, 40 px standard, 44 px primary touch-friendly controls.
- Use moderate corner radii consistently: 8 px for controls and 10–12 px for larger surfaces. Avoid pill-shaped containers everywhere.
- Use thin, low-contrast borders. Reserve shadows for overlays or elements that genuinely need elevation.
- Prefer whitespace and alignment over extra borders and nested cards.
- Use a consistent icon set (for example, Lucide) with consistent size and stroke. Icons that are not universally recognizable must have text labels or tooltips.

## 4. Information architecture

Keep the main navigation small. Recommended primary destinations:

- **Discovery** — define a search and monitor a running discovery job.
- **Leads** — search, filter, review, and manage the lead list.
- **Exports** — optional, only if export history or multiple destinations justify a separate page. Otherwise keep export in Leads.

Settings should be a small, secondary destination. Do not add pages for features that do not exist or are not needed for the core workflow.

Use the event or workspace name as the main context. Do not fill the navbar with session pills, API health badges, live-sheet links, and other technical indicators. Put system health in a compact status area only when it requires attention.

## 5. Main screen and core workflow

### A. Discovery: one clear starting point

The first screen should answer: “Who do you want to find for this event?”

Include:
- A concise page title such as **Find potential sponsors and delegations**.
- One short explanatory sentence, only if needed.
- A clearly labelled search brief input. Example placeholder: “Find Indian robotics companies that sponsor student events.”
- A simple target selector: **Sponsors**, **College delegations**, or **Both**.
- Optional event-brochure PDF upload, if the product actually extracts useful event context from it. Keep it secondary to the search brief and explain what the file will be used for.
- One primary CTA: **Find leads**.
- A few genuinely useful example queries, shown as optional suggestions rather than a row of decorative chips.

Do not make the user choose between two equally prominent input modes unless both are common and equally important. Do not use grandiose button labels such as “Start Autonomous Discovery & Extraction.”

Only ask for information that changes the search. Put optional constraints such as region, organization type, or desired lead count in a compact **Filters / Advanced options** disclosure. Preserve entered values when users open or close it.

### B. Running discovery: clear progress, low noise

When a job is running, show:
- A plain-language status, such as “Finding relevant organizations” or “Checking contact details.”
- A simple step indicator: **Searching → Reviewing sources → Checking contacts → Ready**.
- A useful progress description based on real events. Do not invent percentages or estimated completion times.
- A live count only when it is based on actual results.
- A clear way to view results already found, if supported.
- A stop/cancel action only if the job can actually be cancelled.

Do not display a terminal by default. Place detailed agent activity in an expandable **Technical activity** or **View details** panel. The normal status should explain what is happening in user language, not expose implementation jargon.

Do not show low-level details such as MX-record checks, LinkedIn “dorks,” retries, HTTP codes, or raw tool calls in the primary workflow. Put relevant failures in a concise, actionable message; retain diagnostic detail for the expandable panel.

### C. Leads: make the results the main event

The leads list should be the most prominent part of the application after discovery. It should help organizers quickly decide who to contact.

Recommended default columns:
1. **Organization**
2. **Type** — Sponsor or College delegation
3. **Location**
4. **Best contact** — person and/or available channel
5. **Evidence / confidence** — concise source or verification status
6. **Next action** — review, open details, or mark for outreach

Do not force all information into a wide six-column table if the viewport is narrow. On small screens, use compact lead rows/cards or allow the table to scroll horizontally within its own container.

Useful controls:
- Search organizations and contacts.
- Filter by type, location, review status, and outreach priority when these fields exist.
- Sort by relevance, confidence, or most recently found, only when the data supports the sort.
- Select leads for bulk export or status updates, if implemented.
- Export to CSV or a connected sheet only when the destination is actually configured and the action works.

Avoid showing every possible filter all the time. Use a compact filter row and a **More filters** disclosure for secondary options.

### D. Lead detail: evidence before assumptions

Open a side panel or detail page when a user selects a lead. Show only fields that are available and useful:

- Organization name and type.
- Why it may be relevant to the event.
- Contact name, role, and contact channel, when found.
- Source links for important claims and contact details.
- Last checked date, if recorded.
- Verification state with a clear explanation.
- A short list of suggested next actions, such as copy contact, open source, mark for outreach, or exclude.

Clearly distinguish:
- **Verified** — confirmed by a defined, successful verification process.
- **Found** — discovered in a source but not independently verified.
- **Inferred** — generated from a pattern or indirect evidence; requires human review.
- **Unavailable** — not found or could not be checked.
- **Needs review** — conflicting, stale, or ambiguous information.

Do not invent a numerical confidence score if the system has no calibrated scoring method. If a score exists, explain what it means and avoid implying statistical certainty.

### E. Export and outreach handoff

Keep export easy to find from the lead list. Before exporting, make it clear what will be included and where the file will go. Confirm success only after the export or sync actually completes. If sync fails, preserve the user's work and offer a clear retry path.

Do not show a permanent “Live Google Sheet” CTA unless a real destination is connected and available. Never imply that a lead has been contacted or that outreach has occurred unless the application records that action.

## 6. Content and microcopy rules

Write like a clear, competent event-operations tool.

Prefer:
- “Find leads”
- “Checking contact details”
- “12 organizations found”
- “Email not verified”
- “Open source”
- “Export selected”
- “Try a broader search”

Avoid:
- “Unleash autonomous intelligence”
- “Revolutionize your sponsorship pipeline”
- “AI-powered next-generation lead extraction”
- Long explanatory paragraphs before the first action
- Repeating the same helper text in headings, cards, tooltips, and empty states
- Fake company names, fabricated contact details, and demo statistics presented as real data

Use sentence case for headings and buttons. Keep labels specific. Error messages should say what happened, what remains safe, and what the user can do next.

## 7. Empty, loading, error, and success states

Every meaningful component needs a deliberate state. Never leave a blank table or a spinner without context.

- **First-use empty state:** “No leads yet. Describe the sponsors or delegations you want to find to get started.” Include the relevant primary action.
- **No matches:** Explain that the current search or filters returned no results. Offer to clear filters or broaden the search.
- **Loading:** Use a small contextual status or skeletons that match the expected content. Do not show skeletons after data is already available.
- **Partial results:** Make it clear that results are still arriving and allow users to inspect available leads if supported.
- **Recoverable failure:** Explain the failed step in plain language and provide Retry when retry is safe.
- **Verification unavailable:** Keep the lead, label the limitation, and avoid marking it verified.
- **Success:** Confirm the actual outcome briefly, such as “CSV exported” or “Sheet updated.”
- **Empty contact fields:** Show “No contact found” or omit optional fields; never insert invented placeholders that look like data.

Use illustrations only if they add meaning. Text, a modest icon, and a clear action are usually enough.

## 8. Accessibility and responsive behavior

- Meet WCAG 2.2 AA contrast targets where applicable: normal text contrast of at least 4.5:1, and 3:1 for large text and meaningful UI boundaries.
- Provide visible keyboard focus states and full keyboard access for navigation, dialogs, menus, filters, tables, and upload controls.
- Associate inputs with persistent labels. Do not rely on placeholder text as the only label.
- Use semantic headings, buttons, links, tables, and form controls.
- Announce important job-status changes accessibly without repeatedly interrupting users with every log event.
- Respect reduced-motion preferences. Motion should communicate state, not decorate the interface.
- Ensure error states are not communicated through color alone.
- Prevent page-level horizontal overflow. Wide tables may scroll inside their own region and must remain usable with keyboard and touch.
- At narrow widths, prioritize the search brief, job status, lead name, category, and primary action. Move secondary metadata into details.

## 9. Motion and feedback

- Use short, restrained transitions for hover, focus, disclosure, and state changes.
- Use a progress indicator only when there is real work in progress.
- Do not animate every card, badge, or icon on page load.
- Do not use shimmer gradients for primary buttons.
- Avoid auto-scrolling technical logs by default. If logs are open, provide a clear pause/resume or follow-latest control when auto-follow is implemented.
- Make destructive or irreversible actions explicit and confirm them when appropriate.

## 10. Data integrity and trust

This is a lead research tool; misleading data is worse than a plain interface.

- Show source URLs or source names for meaningful claims wherever possible.
- Make the difference between discovered, inferred, and verified information visible.
- Never fabricate metrics, organizations, contacts, verification outcomes, timestamps, progress percentages, or system health.
- If the agent cannot verify a fact, say so plainly.
- Do not display raw JSON or stack traces in normal UI. Provide a short human-readable message and keep technical details available for troubleshooting.
- Do not claim Google Sheets, email, CRM, or other integrations are connected until they are configured and tested.
- Treat contact data responsibly. Show only information relevant to legitimate event sponsorship or delegation outreach and respect applicable site terms and privacy requirements.

## 11. Implementation guardrails for Antigravity

Before adding a component, answer: **What user task does this support?** If there is no clear answer, do not add it.

- Reuse the existing project stack and component library unless there is a concrete reason to change them.
- Build shared tokens and reusable components rather than styling each page independently.
- Do not add dependencies for decorative effects that can be achieved simply.
- Do not replace a functioning workflow with a visual mockup or fake data.
- Do not add controls that do nothing. Hide unsupported actions or clearly mark them as unavailable.
- Preserve existing working functionality unless a change is necessary and explicitly justified.
- Prefer one strong primary action per view. Secondary actions should be visually quieter.
- Avoid nested cards inside cards, duplicate status indicators, repeated headings, and redundant navigation.
- Keep the layout content-led. Do not force every screen into a symmetrical grid or give every section the same visual weight.

## 12. Acceptance checklist

Before considering the UI complete, inspect the running application at desktop and mobile sizes and verify:

### Visual quality
- [ ] The page has one obvious primary action and a clear information hierarchy.
- [ ] The interface feels specific to lead discovery for an event, not interchangeable with any AI dashboard.
- [ ] There are no gratuitous gradients, glows, decorative animations, or repetitive metric-card grids.
- [ ] Typography, spacing, borders, radii, and button heights are consistent.
- [ ] Important content is readable without relying on tiny or low-contrast text.

### Usability
- [ ] A first-time user can start a search without reading a long explanation.
- [ ] Search, filtering, lead review, and export are understandable and functional.
- [ ] Technical logs are secondary and optional.
- [ ] Empty, loading, partial-result, error, and success states are handled.
- [ ] Every visible control performs its advertised action.

### Trust and accessibility
- [ ] Discovered, inferred, and verified data are clearly distinguished.
- [ ] Sources can be inspected where available.
- [ ] No fabricated lead data or unsupported metrics are shown as real.
- [ ] Keyboard focus, labels, contrast, reduced motion, and responsive layouts have been checked.

### Final quality loop
1. Run the app and inspect the actual rendered UI, not just the code.
2. Identify the three biggest usability or visual problems.
3. Fix the highest-impact problem first.
4. Re-check desktop, narrow mobile, keyboard focus, empty state, and a real or representative results state.
5. Repeat until the acceptance checklist passes or a concrete blocker is documented.

---

## 13. Design references

Use these references as principles, not as instructions to copy another product's appearance:

- OpenAI, *Designing delightful frontends*: https://developers.openai.com/blog/designing-delightful-frontends-with-gpt-5-4
- Nielsen Norman Group, *Progressive Disclosure*: https://www.nngroup.com/articles/progressive-disclosure/
- Nielsen Norman Group, *Designing Empty States in Complex Applications*: https://www.nngroup.com/articles/empty-state-interface-design/
- InterfaceKit, *What makes a website look AI-generated?*: https://blog.interfacekit.io/what-makes-a-website-look-ai-generated

The most important rule: **make the lead workflow excellent before making the agent look impressive.**
