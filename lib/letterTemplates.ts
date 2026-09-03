export const DEFAULT_RELIEVING_LETTER_BODY = `This is to inform you that your resignation has been accepted and you are hereby relieved from your duties as {designation} at {company}, effective {last_working_date}.

We acknowledge your association with us from {joining_date} to {last_working_date}. During your tenure, your professionalism, dedication, and contributions have been sincerely valued by the organization.

We wish you the very best in your future endeavors and hope you achieve great success in your career ahead.`

export const DEFAULT_EXPERIENCE_LETTER_BODY = `This is to certify that {employee_name} (Employee ID: {employee_id}) has successfully completed an internship at {company} from {joining_date} to {last_working_date}, serving as {designation} in the {department} department.

During this period, {employee_name} demonstrated excellent dedication, a strong work ethic, and made meaningful contributions to the team. We were impressed by their skills and commitment.

We wish {employee_name} all the best for their future and are confident they will excel in their career ahead.`

export type LetterPlaceholders = {
  employee_name: string
  employee_id: string
  designation: string
  department: string
  company: string
  joining_date: string
  last_working_date: string
}

export function fillLetterTemplate(body: string, values: LetterPlaceholders): string {
  return body.replace(
    /\{(employee_name|employee_id|designation|department|company|joining_date|last_working_date)\}/g,
    (_, key: keyof LetterPlaceholders) => values[key] || '—'
  )
}

export function letterBodyParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
