import { Line, Question } from './types'

/**
 * Each line of business shares the same 10-point calibration spine
 * (Contact, Coverage, Investigation, Reserving, Damages, Liability,
 * Recovery, Payment, Compliance, Documentation) but the wording is
 * tailored to the line — property talks houses, auto talks vehicles.
 */
export const QUESTIONNAIRES: Record<Line, Question[]> = {
  Property: [
    { id: 'contact', label: 'Contact', category: 'Customer', weight: 1, prompt: 'Was timely first contact (within 1 business day) made with the insured and documented?' },
    { id: 'coverage', label: 'Coverage', category: 'Technical', weight: 1.5, prompt: 'Was coverage confirmed against the dwelling policy, including endorsements, deductibles, and applicable limits?' },
    { id: 'investigation', label: 'Investigation', category: 'Technical', weight: 1.5, prompt: 'Was the cause of loss properly investigated (inspection, photos, cause & origin) and documented?' },
    { id: 'reserving', label: 'Reserving', category: 'Financial', weight: 1, prompt: 'Were reserves established promptly and adjusted to reflect the full exposure of the dwelling and contents?' },
    { id: 'damages', label: 'Scope/Damages', category: 'Technical', weight: 1.5, prompt: 'Was the scope of damage to the dwelling accurately assessed and supported by an itemized estimate (e.g., Xactimate)?' },
    { id: 'liability', label: 'Causation', category: 'Technical', weight: 1, prompt: 'Was the covered vs. non-covered causation (wear & tear, flood, maintenance) correctly determined?' },
    { id: 'recovery', label: 'Subrogation', category: 'Financial', weight: 1, prompt: 'Were subrogation or salvage opportunities identified, documented, and pursued where applicable?' },
    { id: 'payment', label: 'Payment', category: 'Financial', weight: 1, prompt: 'Were payments (ACV/RCV, depreciation, deductible) calculated correctly and issued timely?' },
    { id: 'compliance', label: 'Compliance', category: 'Regulatory', weight: 1.5, prompt: 'Were all statutory and fair-claims-practice requirements met (acknowledgements, status letters, state timelines)?' },
    { id: 'documentation', label: 'File Notes', category: 'Process', weight: 1, prompt: 'Is the file documentation complete, with a clear action plan and rationale for the resolution?' },
  ],
  Auto: [
    { id: 'contact', label: 'Contact', category: 'Customer', weight: 1, prompt: 'Was timely first contact (within 1 business day) made with the insured/claimant and documented?' },
    { id: 'coverage', label: 'Coverage', category: 'Technical', weight: 1.5, prompt: 'Was coverage confirmed against the auto policy, including collision/comprehensive, limits, and deductibles?' },
    { id: 'investigation', label: 'Investigation', category: 'Technical', weight: 1.5, prompt: 'Was the accident properly investigated (recorded statements, police report, scene/photos) and documented?' },
    { id: 'reserving', label: 'Reserving', category: 'Financial', weight: 1, prompt: 'Were reserves established promptly and adjusted to reflect vehicle damage and any injury exposure?' },
    { id: 'damages', label: 'Vehicle Damage', category: 'Technical', weight: 1.5, prompt: 'Was the vehicle damage accurately appraised (repair vs. total loss) and supported by an estimate?' },
    { id: 'liability', label: 'Liability', category: 'Technical', weight: 1.5, prompt: 'Was the liability decision (fault apportionment, negligence) correctly determined and documented?' },
    { id: 'recovery', label: 'Subrogation', category: 'Financial', weight: 1, prompt: 'Were subrogation opportunities against the at-fault party identified and pursued where applicable?' },
    { id: 'payment', label: 'Payment', category: 'Financial', weight: 1, prompt: 'Were payments (repair, total loss valuation, rental, deductible) calculated correctly and issued timely?' },
    { id: 'compliance', label: 'Compliance', category: 'Regulatory', weight: 1.5, prompt: 'Were all statutory and fair-claims-practice requirements met (total-loss notices, state timelines)?' },
    { id: 'documentation', label: 'File Notes', category: 'Process', weight: 1, prompt: 'Is the file documentation complete, with a clear action plan and rationale for the resolution?' },
  ],
  Casualty: [
    { id: 'contact', label: 'Contact', category: 'Customer', weight: 1, prompt: 'Was timely first contact made with the insured and claimant, and documented?' },
    { id: 'coverage', label: 'Coverage', category: 'Technical', weight: 1.5, prompt: 'Was coverage confirmed against the liability policy, including applicable limits and exclusions?' },
    { id: 'investigation', label: 'Investigation', category: 'Technical', weight: 1.5, prompt: 'Was the incident properly investigated (liability facts, witnesses, medical records) and documented?' },
    { id: 'reserving', label: 'Reserving', category: 'Financial', weight: 1.5, prompt: 'Were indemnity and expense reserves established promptly and supported by exposure analysis?' },
    { id: 'damages', label: 'Damages Eval', category: 'Technical', weight: 1.5, prompt: 'Were the claimant damages (medical specials, lost wages, general damages) properly evaluated?' },
    { id: 'liability', label: 'Liability', category: 'Technical', weight: 1.5, prompt: 'Was the liability/negligence assessment correctly determined and documented?' },
    { id: 'recovery', label: 'Contribution', category: 'Financial', weight: 1, prompt: 'Were contribution, indemnification, or subrogation opportunities identified where applicable?' },
    { id: 'payment', label: 'Settlement', category: 'Financial', weight: 1, prompt: 'Was the settlement negotiated and authorized within range, with proper releases obtained?' },
    { id: 'compliance', label: 'Compliance', category: 'Regulatory', weight: 1.5, prompt: 'Were all statutory and fair-claims-practice requirements met (CMS/MSP reporting, timelines)?' },
    { id: 'documentation', label: 'File Notes', category: 'Process', weight: 1, prompt: 'Is the file documentation complete, with a clear evaluation and resolution rationale?' },
  ],
}

export const ANSWER_LABEL: Record<string, string> = {
  yes: 'Met',
  partial: 'Partially Met',
  no: 'Not Met',
  na: 'N/A',
}

/** points contributed toward the quality score by answer value */
export const ANSWER_POINTS: Record<string, number> = {
  yes: 1,
  partial: 0.5,
  no: 0,
  na: 1, // N/A items are excluded from the denominator instead
}
