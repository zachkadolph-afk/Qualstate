import { AgentAnswer, AnswerValue, Claim, CompletedReview, Line } from './types'
import { QUESTIONNAIRES } from './questions'
import { scoreAnswers } from '../lib/scoring'

function aa(
  questionId: string,
  value: AnswerValue,
  confidence: number,
  rationale: string,
  evidence: string[],
): AgentAnswer {
  return { questionId, value, confidence, rationale, evidence }
}

/**
 * Six fully-staged claims ready for a reviewer. Each has a one-pager
 * narrative, fact chips, a file timeline, parties, and a complete
 * AI first-pass with rationale + cited evidence and self-confidence.
 */
export const REVIEW_CLAIMS: Claim[] = [
  {
    id: 'CLM-PR-4471',
    claimNumber: 'PR-2024-4471',
    policyNumber: 'HO3-882-114-09',
    line: 'Property',
    perilType: 'Water Damage — Burst Pipe',
    status: 'Ready for Review',
    dateOfLoss: '2026-04-02',
    dateClosed: '2026-05-19',
    insured: 'Marcus & Lena Whitfield',
    adjuster: 'D. Okafor',
    state: 'TX',
    reserveAmount: 42000,
    paidAmount: 38450,
    severity: 'High',
    summary:
      'A supply line to the second-floor laundry failed overnight while the Whitfields were traveling, releasing water for roughly 9 hours before a neighbor noticed staining and called it in. Water migrated through the laundry floor into the kitchen ceiling, great room, and finished basement below. The insured reported the loss the same morning they were notified (4/2). Adjuster Okafor assigned an emergency mitigation vendor within 4 hours and inspected on 4/4. Cause was confirmed as a sudden/accidental discharge — a covered peril — with no evidence of long-term seepage or maintenance neglect. The estimate was written in Xactimate at $41,180 (dwelling) plus $3,900 contents. ACV was paid at closing with recoverable depreciation held back pending repair completion. The deductible ($2,500) was applied. No subrogation was pursued despite the failed braided-steel supply line being ~6 years old and a possible manufacturing-defect candidate.',
    facts: [
      { label: 'Cause of Loss', value: 'Sudden pipe burst (covered)' },
      { label: 'Mitigation', value: 'Emergency vendor < 4 hrs' },
      { label: 'Estimate Basis', value: 'Xactimate $45,080' },
      { label: 'Deductible', value: '$2,500 applied' },
      { label: 'Depreciation', value: '$4,130 recoverable held' },
      { label: 'Areas Affected', value: 'Laundry, kitchen, great room, basement' },
    ],
    timeline: [
      { date: '2026-04-02', event: 'FNOL received; insured contacted same day' },
      { date: '2026-04-02', event: 'Emergency water mitigation dispatched (3h 40m)' },
      { date: '2026-04-04', event: 'On-site inspection by adjuster; cause confirmed' },
      { date: '2026-04-11', event: 'Xactimate estimate finalized' },
      { date: '2026-04-15', event: 'ACV payment issued; deductible applied' },
      { date: '2026-05-19', event: 'File closed; RCV holdback pending repairs' },
    ],
    parties: [
      { name: 'Marcus & Lena Whitfield', role: 'Insured' },
      { name: 'RapidDry Restoration', role: 'Mitigation vendor' },
      { name: 'D. Okafor', role: 'Field Adjuster' },
    ],
    agentAnswers: [
      aa('contact', 'yes', 0.97, 'FNOL and insured contact occurred the same day (4/2). First-contact letter is in the file.', ['Log 4/2 09:14 — "Spoke w/ insured, confirmed loss details, set expectations."']),
      aa('coverage', 'yes', 0.93, 'HO-3 coverage verified; sudden discharge is covered. Limits and $2,500 deductible documented.', ['Coverage screen capture attached', 'Deductible $2,500 noted on payment sheet']),
      aa('investigation', 'yes', 0.9, 'On-site inspection 4/4 with photos; cause confirmed as sudden/accidental. Source isolated.', ['18 inspection photos', 'Cause narrative dated 4/4']),
      aa('reserving', 'partial', 0.71, 'Initial reserve of $25k was set 4/2 but not raised until 4/12 after the estimate, briefly under-reserved vs. exposure.', ['Reserve history: $25,000 → $42,000 on 4/12']),
      aa('damages', 'yes', 0.88, 'Itemized Xactimate estimate covers all four affected areas; line items reconcile to the scope photos.', ['Estimate PDF, 142 line items']),
      aa('liability', 'yes', 0.86, 'Causation analysis correctly distinguishes covered sudden discharge from excluded long-term seepage.', ['No staining/rot consistent with chronic leak per inspector']),
      aa('recovery', 'no', 0.82, 'A 6-year-old braided supply line failed; subrogation/product-defect referral was warranted but not made.', ['Failed part retained but no subro referral in file']),
      aa('payment', 'yes', 0.91, 'ACV calculated correctly, deductible applied, recoverable depreciation appropriately held back.', ['Payment worksheet: ACV $34,320 net of deductible']),
      aa('compliance', 'yes', 0.9, 'Acknowledgement and status communications meet TX timelines; no fair-practice gaps identified.', ['Status letters 4/2, 4/18']),
      aa('documentation', 'partial', 0.68, 'Notes are generally clear but the rationale for not pursuing subrogation is absent.', ['No close note addressing recovery decision']),
    ],
  },
  {
    id: 'CLM-AU-7732',
    claimNumber: 'AU-2024-7732',
    policyNumber: 'PA-447-220-33',
    line: 'Auto',
    perilType: 'Collision — Intersection',
    status: 'Ready for Review',
    dateOfLoss: '2026-03-18',
    dateClosed: '2026-04-22',
    insured: 'Priya Nadkarni',
    adjuster: 'R. Castellano',
    state: 'CA',
    reserveAmount: 28500,
    paidAmount: 24900,
    severity: 'Moderate',
    summary:
      'Our insured, Ms. Nadkarni, was traveling through a signaled intersection when a third party (Mr. Boone) ran a red light and struck her front passenger quarter. Both vehicles were drivable; a police report was filed assigning fault to Boone. Our insured carried collision coverage and elected to repair through her own carrier with subrogation against the at-fault party. The vehicle, a 2021 crossover, sustained $9,200 in damage — repairable, below total-loss threshold. A rental was provided for 12 days. The adjuster opened subrogation against Boone\'s carrier and recovered the deductible plus repair costs. Liability was clearly documented at 100% adverse. The claim closed cleanly with the deductible reimbursed to the insured upon subrogation recovery.',
    facts: [
      { label: 'Fault', value: '100% third party (red light)' },
      { label: 'Police Report', value: 'On file — cites third party' },
      { label: 'Disposition', value: 'Repair ($9,200)' },
      { label: 'Rental', value: '12 days provided' },
      { label: 'Subrogation', value: 'Opened vs. at-fault carrier' },
      { label: 'Deductible', value: '$500 — reimbursed on recovery' },
    ],
    timeline: [
      { date: '2026-03-18', event: 'FNOL; insured statement taken same day' },
      { date: '2026-03-19', event: 'Police report obtained; liability assessed' },
      { date: '2026-03-21', event: 'Appraisal completed; repair authorized' },
      { date: '2026-03-22', event: 'Rental arranged' },
      { date: '2026-04-02', event: 'Subrogation demand sent to adverse carrier' },
      { date: '2026-04-22', event: 'Recovery received; deductible reimbursed; closed' },
    ],
    parties: [
      { name: 'Priya Nadkarni', role: 'Insured' },
      { name: 'Travis Boone', role: 'Adverse driver (at fault)' },
      { name: 'R. Castellano', role: 'Adjuster' },
    ],
    agentAnswers: [
      aa('contact', 'yes', 0.95, 'Insured statement taken same day as FNOL (3/18); contact documented.', ['Recorded statement 3/18']),
      aa('coverage', 'yes', 0.92, 'Collision coverage verified, $500 deductible, limits adequate.', ['Dec page on file']),
      aa('investigation', 'yes', 0.94, 'Police report obtained, scene/photos and statements collected; investigation complete.', ['Police report #CA-22841', 'Damage photos x12']),
      aa('reserving', 'yes', 0.85, 'Reserve set 3/19 at $12k, appropriate for repairable damage and rental.', ['Reserve note 3/19']),
      aa('damages', 'yes', 0.9, 'Appraisal supports repair at $9,200; below total-loss threshold; estimate reconciles.', ['Appraisal worksheet']),
      aa('liability', 'yes', 0.96, 'Liability correctly assessed at 100% adverse per police report and physical evidence.', ['Police report cites adverse for red-light violation']),
      aa('recovery', 'yes', 0.93, 'Subrogation opened promptly against the at-fault carrier; full recovery obtained.', ['Subro demand 4/2; recovery 4/22']),
      aa('payment', 'partial', 0.64, 'Repair and rental paid correctly, but rental ran 12 days when repair completed in 8 — 4 excess rental days paid.', ['Rental invoices show 12 days; repair order completed day 8']),
      aa('compliance', 'yes', 0.89, 'CA fair-claims timelines met; subrogation handled within statute.', ['Acknowledgement 3/18']),
      aa('documentation', 'yes', 0.87, 'File is well documented with a clear liability and recovery narrative.', ['Closing summary present']),
    ],
  },
  {
    id: 'CLM-CA-9920',
    claimNumber: 'CA-2024-9920',
    policyNumber: 'HO5-771-905-12',
    line: 'Casualty',
    perilType: 'Premises Liability — Slip & Fall',
    status: 'Ready for Review',
    dateOfLoss: '2026-02-09',
    dateClosed: '2026-05-28',
    insured: 'Gregory Helms',
    adjuster: 'S. Whitaker',
    state: 'FL',
    reserveAmount: 65000,
    paidAmount: 47500,
    severity: 'High',
    summary:
      'A guest (claimant Donna Reyes) slipped on an icy walkway at the insured\'s residence during a winter gathering and fractured her wrist, requiring surgery. The claimant retained counsel and presented medical specials of $28,400 plus a wage-loss claim of $6,100. Liability was contested — the insured argued open-and-obvious conditions, while the claimant alleged failure to treat a known hazard. The adjuster evaluated comparative negligence at roughly 70/30 against the insured under FL law, set indemnity and expense reserves, and negotiated a settlement of $47,500 inclusive of a full release. CMS/MSP reporting was triggered given the surgical treatment. The file reflects a reasoned damages evaluation, though the initial reserve appears to have lagged the known surgical exposure and the liability investigation relied heavily on the insured\'s account with limited independent witness development.',
    facts: [
      { label: 'Injury', value: 'Wrist fracture — surgical' },
      { label: 'Medical Specials', value: '$28,400' },
      { label: 'Wage Loss', value: '$6,100 claimed' },
      { label: 'Liability', value: 'Comparative ~70/30 adverse' },
      { label: 'Settlement', value: '$47,500 w/ full release' },
      { label: 'MSP Reporting', value: 'Triggered (Medicare)' },
    ],
    timeline: [
      { date: '2026-02-09', event: 'Loss occurs; reported 2/11' },
      { date: '2026-02-12', event: 'Insured contacted; claimant counsel LOR received' },
      { date: '2026-02-20', event: 'Indemnity reserve set ($30k)' },
      { date: '2026-03-30', event: 'Medical records & specials received' },
      { date: '2026-04-25', event: 'Reserve increased to $65k post-surgery' },
      { date: '2026-05-28', event: 'Settled $47,500; release executed; closed' },
    ],
    parties: [
      { name: 'Gregory Helms', role: 'Insured' },
      { name: 'Donna Reyes', role: 'Claimant' },
      { name: 'Maddox & Pyle LLP', role: 'Claimant counsel' },
      { name: 'S. Whitaker', role: 'Casualty Adjuster' },
    ],
    agentAnswers: [
      aa('contact', 'yes', 0.84, 'Insured contacted 2/12, within standard after the delayed 2/11 report; claimant counsel acknowledged.', ['Contact log 2/12']),
      aa('coverage', 'yes', 0.9, 'Personal liability coverage confirmed; limits and exclusions reviewed.', ['Coverage analysis memo']),
      aa('investigation', 'partial', 0.6, 'Liability facts rely heavily on the insured account; no independent witness statements or scene-condition evidence developed.', ['Only insured statement in file; no witness canvass noted']),
      aa('reserving', 'partial', 0.66, 'Initial $30k reserve lagged the known surgical exposure; not raised to $65k until 4/25, ~2 months after surgery was known.', ['Reserve history shows late increase']),
      aa('damages', 'yes', 0.83, 'Medical specials, wage loss, and general damages evaluated with a documented range supporting the settlement.', ['Damages eval memo with range $40k-$55k']),
      aa('liability', 'yes', 0.79, 'Comparative negligence assessment (~70/30) is reasoned and consistent with FL premises law.', ['Liability evaluation note']),
      aa('recovery', 'na', 0.7, 'No contribution or subrogation targets present; single-tortfeasor premises claim.', ['No third party identified']),
      aa('payment', 'yes', 0.88, 'Settlement negotiated within the documented authority range with a full executed release.', ['Settlement check + release']),
      aa('compliance', 'partial', 0.58, 'MSP reporting triggered but the file does not clearly evidence Section 111 reporting completion.', ['No Section 111 confirmation in file']),
      aa('documentation', 'yes', 0.81, 'Evaluation and resolution rationale are documented in the closing memo.', ['Closing evaluation memo']),
    ],
  },
  {
    id: 'CLM-PR-5108',
    claimNumber: 'PR-2024-5108',
    policyNumber: 'HO3-339-712-44',
    line: 'Property',
    perilType: 'Wind/Hail — Roof',
    status: 'Ready for Review',
    dateOfLoss: '2026-03-27',
    dateClosed: '2026-05-02',
    insured: 'Eleanor Brooks',
    adjuster: 'J. Tran',
    state: 'OK',
    reserveAmount: 18000,
    paidAmount: 0,
    severity: 'Moderate',
    summary:
      'Following a regional hailstorm, the insured reported roof damage to her single-family home. The adjuster ordered a roof inspection that found scattered cosmetic granular loss but concluded the bruising did not meet the functional-damage threshold and was partly attributable to age and prior repairs. The claim was denied with no payment. The insured disputed the finding and obtained a contractor report alleging functional damage and ~40 impact marks per test square. The file contains the carrier inspection but no reinspection or engineer referral was ordered before denial, and the denial letter cites the wear-and-tear exclusion without clearly distinguishing storm-created openings. This is a contested denial worth close calibration.',
    facts: [
      { label: 'Disposition', value: 'Denied — no payment' },
      { label: 'Basis', value: 'Cosmetic / wear & tear' },
      { label: 'Insured Dispute', value: 'Contractor alleges functional damage' },
      { label: 'Engineer Referral', value: 'Not ordered' },
      { label: 'Roof Age', value: '~17 years' },
      { label: 'Test Squares', value: 'Carrier: <8 hits; Contractor: ~40' },
    ],
    timeline: [
      { date: '2026-03-27', event: 'FNOL after regional hail event' },
      { date: '2026-03-30', event: 'Insured contacted; inspection scheduled' },
      { date: '2026-04-08', event: 'Roof inspection — cosmetic finding' },
      { date: '2026-04-15', event: 'Denial letter issued' },
      { date: '2026-04-28', event: 'Insured submits contractor rebuttal' },
      { date: '2026-05-02', event: 'File closed as denied' },
    ],
    parties: [
      { name: 'Eleanor Brooks', role: 'Insured' },
      { name: 'Summit Roofing Co.', role: 'Insured\'s contractor' },
      { name: 'J. Tran', role: 'Field Adjuster' },
    ],
    agentAnswers: [
      aa('contact', 'yes', 0.92, 'Insured contacted 3/30 within standard; inspection scheduled.', ['Contact note 3/30']),
      aa('coverage', 'yes', 0.88, 'HO-3 coverage and wind/hail peril confirmed; exclusions reviewed.', ['Coverage screen']),
      aa('investigation', 'no', 0.74, 'Single inspection with a contested cosmetic finding; no reinspection or engineer referral despite a material dispute and 17-year roof.', ['One inspection report; no engineer referral']),
      aa('reserving', 'partial', 0.62, 'A nominal reserve was held but not meaningfully evaluated given the contested exposure.', ['Reserve $18k static']),
      aa('damages', 'no', 0.69, 'Damage assessment is contested and unsupported by test-square documentation; contractor alleges ~40 hits/square.', ['No test-square photos in carrier report']),
      aa('liability', 'partial', 0.57, 'Causation (storm vs. age) was asserted but not clearly substantiated to support the wear-and-tear exclusion.', ['Denial cites exclusion without storm-opening analysis']),
      aa('recovery', 'na', 0.8, 'No subrogation/salvage applicable to a denied weather claim.', ['N/A']),
      aa('payment', 'na', 0.85, 'No payment issued (denied).', ['N/A']),
      aa('compliance', 'partial', 0.6, 'Denial letter issued but does not fully articulate the basis or the insured\'s appeal rights per OK guidance.', ['Denial letter lacks specificity']),
      aa('documentation', 'partial', 0.61, 'File documents the inspection but lacks rationale addressing the contractor rebuttal.', ['No note addressing rebuttal']),
    ],
  },
  {
    id: 'CLM-AU-8841',
    claimNumber: 'AU-2024-8841',
    policyNumber: 'PA-559-118-77',
    line: 'Auto',
    perilType: 'Total Loss — Comprehensive (Theft)',
    status: 'Ready for Review',
    dateOfLoss: '2026-04-14',
    dateClosed: '2026-05-25',
    insured: 'Daniel Okeke',
    adjuster: 'M. Russo',
    state: 'GA',
    reserveAmount: 31000,
    paidAmount: 29750,
    severity: 'High',
    summary:
      'The insured\'s 2022 sedan was stolen from a commercial parking lot and recovered four days later, stripped and declared a total loss. Comprehensive coverage applied. The adjuster verified the theft via police report, confirmed no exclusions (keys not left in vehicle), and ordered a total-loss valuation. The ACV was set at $30,250 using a market valuation report; the $500 comprehensive deductible was applied, netting $29,750 to the insured/lienholder. A theft SIU referral screen was completed and cleared. Title and lien processing were handled. The valuation appears reasonable, though comparable-vehicle adjustments were lightly documented and the rental coverage limit was reached before the total-loss offer was finalized, leaving the insured a short gap.',
    facts: [
      { label: 'Disposition', value: 'Total loss (theft/strip)' },
      { label: 'ACV', value: '$30,250' },
      { label: 'Deductible', value: '$500 comprehensive' },
      { label: 'Net Paid', value: '$29,750' },
      { label: 'SIU Screen', value: 'Completed — cleared' },
      { label: 'Lienholder', value: 'Yes — joint payment' },
    ],
    timeline: [
      { date: '2026-04-14', event: 'Theft reported; FNOL same day' },
      { date: '2026-04-18', event: 'Vehicle recovered stripped' },
      { date: '2026-04-21', event: 'Total-loss valuation ordered; SIU screen' },
      { date: '2026-04-30', event: 'ACV established; offer presented' },
      { date: '2026-05-25', event: 'Settlement paid; title/lien processed; closed' },
    ],
    parties: [
      { name: 'Daniel Okeke', role: 'Insured' },
      { name: 'Atlas Credit Union', role: 'Lienholder' },
      { name: 'M. Russo', role: 'Total Loss Adjuster' },
    ],
    agentAnswers: [
      aa('contact', 'yes', 0.93, 'FNOL and insured contact same day as theft report (4/14).', ['Contact note 4/14']),
      aa('coverage', 'yes', 0.91, 'Comprehensive coverage and theft peril confirmed; no key-in-vehicle exclusion.', ['Coverage + recorded statement on keys']),
      aa('investigation', 'yes', 0.86, 'Police report obtained, SIU screen completed and cleared, recovery condition documented.', ['Police report', 'SIU referral cleared']),
      aa('reserving', 'yes', 0.84, 'Reserve set near anticipated ACV promptly after the total-loss determination.', ['Reserve $31k 4/21']),
      aa('damages', 'partial', 0.63, 'ACV valuation is reasonable but comparable-vehicle condition/mileage adjustments are lightly documented.', ['Valuation report; thin adjustment notes']),
      aa('liability', 'na', 0.8, 'First-party comprehensive theft; no liability determination required.', ['N/A']),
      aa('recovery', 'partial', 0.59, 'Recovered-vehicle salvage was processed, but no documentation of pursuing the parking facility or theft-ring restitution.', ['Salvage assigned; no other recovery analysis']),
      aa('payment', 'yes', 0.9, 'ACV less deductible paid jointly to insured and lienholder; calculation correct.', ['Payment worksheet; joint check']),
      aa('compliance', 'yes', 0.87, 'GA total-loss notice and title handling completed within timelines.', ['Total loss notice 4/30']),
      aa('documentation', 'partial', 0.64, 'File is mostly complete but does not address the rental-gap or the valuation adjustments.', ['No note on rental limit gap']),
    ],
  },
  {
    id: 'CLM-CA-1077',
    claimNumber: 'CA-2024-1077',
    policyNumber: 'HO5-204-661-31',
    line: 'Casualty',
    perilType: 'Dog Bite — Bodily Injury',
    status: 'Ready for Review',
    dateOfLoss: '2026-01-22',
    dateClosed: '2026-04-30',
    insured: 'Sofia Marquez',
    adjuster: 'B. Feldman',
    state: 'IL',
    reserveAmount: 22000,
    paidAmount: 16800,
    severity: 'Moderate',
    summary:
      'The insured\'s dog bit a delivery driver (claimant) on the insured\'s porch, causing puncture wounds requiring stitches and a course of antibiotics, with no permanent impairment. IL applies strict liability for dog bites, so liability was effectively conceded. The adjuster confirmed personal-liability coverage, evaluated medical specials of $4,200 and general damages, and settled at $16,800 with a release. First contact with the claimant was prompt and empathetic, reserves were set appropriately, and the medical evaluation was well documented. The agent flags a minor gap: the file does not record whether the animal-liability sublimit or any prior-incident underwriting flag was checked, which can affect coverage in some IL policies.',
    facts: [
      { label: 'Liability', value: 'Strict liability (IL dog-bite)' },
      { label: 'Injury', value: 'Puncture wounds, stitches' },
      { label: 'Medical Specials', value: '$4,200' },
      { label: 'Settlement', value: '$16,800 w/ release' },
      { label: 'Sublimit Check', value: 'Not evidenced' },
      { label: 'Permanency', value: 'None' },
    ],
    timeline: [
      { date: '2026-01-22', event: 'Incident; reported 1/23' },
      { date: '2026-01-24', event: 'Claimant and insured contacted' },
      { date: '2026-02-01', event: 'Reserve set $22k; coverage confirmed' },
      { date: '2026-03-15', event: 'Medical records received; evaluation done' },
      { date: '2026-04-30', event: 'Settled $16,800; release; closed' },
    ],
    parties: [
      { name: 'Sofia Marquez', role: 'Insured' },
      { name: 'Kevin Doyle', role: 'Claimant (delivery driver)' },
      { name: 'B. Feldman', role: 'Casualty Adjuster' },
    ],
    agentAnswers: [
      aa('contact', 'yes', 0.94, 'Both claimant and insured contacted promptly (1/24) and documented.', ['Contact log 1/24']),
      aa('coverage', 'partial', 0.62, 'Personal liability confirmed, but no evidence the animal-liability sublimit or prior-incident flag was checked.', ['Coverage memo lacks sublimit note']),
      aa('investigation', 'yes', 0.85, 'Incident facts, medical records, and prior-bite history were gathered and documented.', ['Records request + responses']),
      aa('reserving', 'yes', 0.86, 'Reserve set at $22k consistent with the injury exposure.', ['Reserve note 2/1']),
      aa('damages', 'yes', 0.88, 'Medical specials and general damages evaluated; settlement within the documented range.', ['Damages eval memo']),
      aa('liability', 'yes', 0.92, 'IL strict-liability standard correctly applied; liability conceded.', ['Liability note cites IL statute']),
      aa('recovery', 'na', 0.82, 'No contribution/subrogation targets.', ['N/A']),
      aa('payment', 'yes', 0.89, 'Settlement authorized within range with an executed release.', ['Release + check']),
      aa('compliance', 'yes', 0.85, 'IL timelines met; no MSP trigger (claimant not Medicare-eligible).', ['Acknowledgement 1/24']),
      aa('documentation', 'yes', 0.83, 'File is well documented with a clear evaluation and settlement rationale.', ['Closing memo']),
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Seeded history of completed reviews (for the analytics dashboard) */
/* ------------------------------------------------------------------ */

const REVIEWERS = ['A. Reyes', 'T. Coleman', 'M. Devi', 'K. Park', 'J. Salazar']
const ADJUSTERS = ['D. Okafor', 'R. Castellano', 'S. Whitaker', 'J. Tran', 'M. Russo', 'B. Feldman', 'L. Nguyen', 'P. Adeyemi']
const LINES: Line[] = ['Property', 'Auto', 'Casualty']
const PERILS: Record<Line, string[]> = {
  Property: ['Water Damage', 'Wind/Hail', 'Fire', 'Theft', 'Freeze'],
  Auto: ['Collision', 'Total Loss', 'Comprehensive', 'Glass', 'Rear-End'],
  Casualty: ['Slip & Fall', 'Dog Bite', 'Premises', 'Bodily Injury', 'Product'],
}

// deterministic PRNG so the demo is stable across reloads
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260609)
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]

function makeValues(line: Line, baseQuality: number): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {}
  for (const q of QUESTIONNAIRES[line]) {
    const r = rnd()
    // higher baseQuality => more "yes"
    if (r < baseQuality) out[q.id] = 'yes'
    else if (r < baseQuality + 0.18) out[q.id] = 'partial'
    else out[q.id] = 'no'
  }
  return out
}

export const COMPLETED_REVIEWS: CompletedReview[] = []
export const HISTORY_CLAIMS: Record<string, Claim> = {}

;(function seed() {
  let dayOffset = 86 // start ~3 months back from 2026-06-09
  for (let i = 0; i < 64; i++) {
    const line = pick(LINES)
    const baseQuality = 0.55 + rnd() * 0.38
    const agentValues = makeValues(line, baseQuality)

    // reviewer agrees on most; disagrees on a per-question reliability profile
    const reviewerAnswers = QUESTIONNAIRES[line].map((q) => {
      // some questions are intrinsically harder for the AI -> more disagreement
      const hardness = ['investigation', 'reserving', 'liability', 'compliance', 'recovery'].includes(q.id) ? 0.22 : 0.08
      const disagree = rnd() < hardness
      if (disagree) {
        const corrected: AnswerValue = agentValues[q.id] === 'yes' ? (rnd() < 0.5 ? 'partial' : 'no') : 'yes'
        return { questionId: q.id, decision: 'disagree' as const, correctedValue: corrected, note: 'Reviewer adjusted per file evidence.' }
      }
      return { questionId: q.id, decision: 'agree' as const }
    })

    const finalValues: Record<string, AnswerValue> = { ...agentValues }
    let agree = 0
    for (const r of reviewerAnswers) {
      if (r.decision === 'disagree' && r.correctedValue) finalValues[r.questionId] = r.correctedValue
      else agree++
    }

    const date = new Date(2026, 5, 9)
    date.setDate(date.getDate() - dayOffset)
    dayOffset -= rnd() < 0.6 ? 1 : 2
    if (dayOffset < 0) dayOffset = 0
    const iso = date.toISOString().slice(0, 10)

    const id = `H-${line.slice(0, 2).toUpperCase()}-${1000 + i}`
    const claim: Claim = {
      id,
      claimNumber: `${line.slice(0, 2).toUpperCase()}-2024-${1000 + i}`,
      policyNumber: `POL-${100 + i}`,
      line,
      perilType: pick(PERILS[line]),
      status: 'Completed',
      dateOfLoss: iso,
      dateClosed: iso,
      insured: 'Insured Household',
      adjuster: pick(ADJUSTERS),
      state: pick(['TX', 'CA', 'FL', 'OK', 'GA', 'IL', 'AZ', 'NC']),
      reserveAmount: Math.round((10000 + rnd() * 60000) / 100) * 100,
      paidAmount: Math.round((5000 + rnd() * 50000) / 100) * 100,
      severity: pick(['Low', 'Moderate', 'High', 'Severe'] as const),
      summary: '',
      facts: [],
      timeline: [],
      parties: [],
      agentAnswers: QUESTIONNAIRES[line].map((q) => aa(q.id, agentValues[q.id], 0.6 + rnd() * 0.38, '', [])),
    }
    HISTORY_CLAIMS[id] = claim

    const qualityScore = scoreAnswers(claim, finalValues)
    const agentScore = scoreAnswers(claim, agentValues)
    const calibration = Math.round((agree / reviewerAnswers.length) * 100)

    COMPLETED_REVIEWS.push({
      claimId: id,
      reviewer: pick(REVIEWERS),
      completedAt: iso,
      reviewerAnswers,
      qualityScore,
      agentScore,
      calibration,
    })
  }
})()
