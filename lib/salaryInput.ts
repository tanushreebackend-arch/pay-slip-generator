export function resolveMonthlyGross(body: {
  annual_ctc?: unknown
  gross_salary?: unknown
}): number | null {
  if (body.annual_ctc !== undefined && body.annual_ctc !== null && body.annual_ctc !== '') {
    const annual = parseFloat(String(body.annual_ctc))
    if (Number.isNaN(annual) || annual < 0) return null
    return parseFloat((annual / 12).toFixed(2))
  }
  if (body.gross_salary !== undefined && body.gross_salary !== null && body.gross_salary !== '') {
    const monthly = parseFloat(String(body.gross_salary))
    if (Number.isNaN(monthly) || monthly < 0) return null
    return parseFloat(monthly.toFixed(2))
  }
  return null
}
