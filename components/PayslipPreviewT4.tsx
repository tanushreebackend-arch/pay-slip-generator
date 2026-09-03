'use client'

import { resolveDocumentFont, resolveDocumentFontZoom } from '@/lib/documentFonts'
import { numberToIndianWords } from '@/lib/numberToWords'
import { MONTHS } from '@/lib/utils'
import type { LeaveDetailRow } from '@/lib/leaveDetails'
import type { PayslipPreviewProps } from '@/types'

/** A4 at 96dpi; 1 PDF point ≈ 1.334 CSS px (source payslip is 595×842 pt). */
const PAGE_STYLE: React.CSSProperties = {
  width: 794,
  minHeight: 1123,
  height: 1123,
  backgroundColor: '#fff',
  fontSize: 13,
  color: '#000',
  padding: '26px 48px 48px',
  boxSizing: 'border-box',
  overflow: 'hidden',
}

const LABEL: React.CSSProperties = {
  fontSize: 11,
  color: '#858585',
  lineHeight: 1.2,
  marginBottom: 3,
  fontWeight: 400,
}

const VALUE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  color: '#000',
  lineHeight: 1.25,
  wordBreak: 'break-word',
}

const HAIRLINE_BLACK: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #000',
  margin: 0,
  height: 0,
}

const HAIRLINE_GRAY: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #dcdcdc',
  margin: 0,
  height: 0,
}

function fmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDays1(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function fmtDays2(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtLeave(n: number): string {
  if (n === 0) return '0'
  return n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function fmtJoinDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function toPayslipWords(amount: number): string {
  return numberToIndianWords(amount)
    .replace(/ and (.+) Paise Only$/i, ' AND $1 paise only')
    .replace(/ Only$/, ' only')
}

function LineRow({
  label,
  amount,
  boldLabel,
}: {
  label: string
  amount?: number
  boldLabel?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        minHeight: 21,
        padding: '1px 0',
        fontSize: 13,
        lineHeight: 1.35,
      }}
    >
      <span style={{ flex: 1, minWidth: 0, fontWeight: boldLabel ? 700 : 400 }}>{label}</span>
      {amount !== undefined ? (
        <span style={{ flexShrink: 0, fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>{fmt(amount)}</span>
      ) : null}
    </div>
  )
}

function GridCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0, padding: '2px 8px 2px 0' }}>
      <div style={LABEL}>{label}</div>
      <div style={VALUE}>{value || '—'}</div>
    </div>
  )
}

function SummaryBand({
  label,
  amount,
  wordsLabel,
  words,
}: {
  label: string
  amount: number
  wordsLabel: string
  words: string
}) {
  const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '40% 1fr',
    gap: 12,
    backgroundColor: '#f8f8f9',
    padding: '8px 13px',
    fontSize: 13,
    lineHeight: 1.4,
  }
  return (
    <div>
      <div style={row}>
        <div>{label}</div>
        <div>{fmt(amount)}</div>
      </div>
      <div style={{ ...row, padding: '10px 13px', minHeight: 47, alignItems: 'start' }}>
        <div>{wordsLabel}</div>
        <div style={{ fontWeight: 700 }}>{words}</div>
      </div>
    </div>
  )
}

function LeaveDetailsPage({
  rows,
  fontFamily,
}: {
  rows: LeaveDetailRow[]
  fontFamily: string
}) {
  const cell: React.CSSProperties = {
    border: '0.75px solid #d3d3d3',
    padding: '4px 4px',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 1.25,
    fontWeight: 400,
    height: 20,
  }

  return (
    <div
      className="payslip-t4-page payslip-page"
      style={{ ...PAGE_STYLE, fontFamily, padding: '97px 48px 48px' }}
    >
      <div style={{ fontSize: 13, fontWeight: 400, marginBottom: 12, letterSpacing: 0 }}>
        LEAVE DETAILS
      </div>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
        }}
      >
        <colgroup>
          <col style={{ width: '21%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '11%' }} />
        </colgroup>
        <thead>
          <tr>
            {['LEAVE TYPE', 'OPENING', 'ACCRUED', 'CREDIT', 'AVAILED', 'EXPIRED/ENCASHED', 'CLOSING'].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    ...cell,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    height: 19,
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.leaveType}>
              <td style={cell}>{row.leaveType}</td>
              <td style={cell}>{fmtLeave(row.opening)}</td>
              <td style={cell}>{fmtLeave(row.accrued)}</td>
              <td style={cell}>{fmtLeave(row.credit)}</td>
              <td style={cell}>{fmtLeave(row.availed)}</td>
              <td style={cell}>{fmtLeave(row.expiredEncashed)}</td>
              <td style={cell}>{fmtLeave(row.closing)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PayslipPreviewT4({
  employee,
  settings,
  calc,
  month,
  year,
  customDeductions,
  leaveDetails = [],
  documentFontOverride,
}: PayslipPreviewProps) {
  const fontFamily = resolveDocumentFont(documentFontOverride ?? settings.document_font)
  const documentZoom = resolveDocumentFontZoom(settings.document_font_size)
  const pageStyle: React.CSSProperties = { ...PAGE_STYLE, fontFamily }

  if (!employee || !calc) {
    return (
      <div
        id="printable-document"
        style={{
          width: '100%',
          minHeight: 1123,
          zoom: documentZoom,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontFamily,
        }}
      >
        Select an employee to preview payslip
      </div>
    )
  }

  const emp = employee
  const c = calc
  const monthShort = month.slice(0, 3).toUpperCase()
  const netWords = toPayslipWords(c.netPay)

  const earnings: { label: string; amount: number }[] = [
    { label: 'Basic', amount: c.actualBasic },
    { label: 'HRA', amount: c.actualHRA },
    { label: 'Medical Allowance', amount: c.actualMedical },
    { label: 'Conveyance Allowance', amount: c.actualConveyance },
    { label: 'Special Allowance', amount: c.actualSpecial },
  ]
  if (c.finalSettlement > 0) {
    earnings.push({ label: 'Final Settlement', amount: c.finalSettlement })
  }

  const addressLines = (settings.address || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div
      id="printable-document"
      className="payslip-t4-root"
      style={{
        width: 794,
        zoom: documentZoom,
        backgroundColor: '#fff',
      }}
    >
      <div className="payslip-t4-page payslip-page" style={pageStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0, lineHeight: 1.1, marginBottom: 22 }}>
              PAYSLIP {monthShort} {year}
            </div>
            <div style={{ fontSize: 12, fontWeight: 400, lineHeight: 1.3 }}>
              {(settings.company_name || 'Company Name').toUpperCase()}
            </div>
            {addressLines.length > 0 ? (
              <div style={{ fontSize: 10, lineHeight: 1.65, marginTop: 8, maxWidth: 420, fontWeight: 400 }}>
                {addressLines.map((line, i) => (
                  <div key={i}>{line.toUpperCase()}</div>
                ))}
              </div>
            ) : null}
          </div>
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt="Logo"
              crossOrigin="anonymous"
              style={{ width: 120, height: 120, objectFit: 'contain', flexShrink: 0 }}
            />
          ) : null}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, marginTop: 28, marginBottom: 8, letterSpacing: 0.2 }}>
          {emp.name.toUpperCase()}
        </div>
        <hr style={HAIRLINE_BLACK} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            padding: '8px 0 6px',
          }}
        >
          <GridCell label="Employee Number" value={emp.employee_id} />
          <GridCell label="Date Joined" value={fmtJoinDate(emp.joining_date)} />
          <GridCell label="Department" value={emp.department} />
          <GridCell label="Designation" value={emp.designation} />
        </div>
        <hr style={HAIRLINE_GRAY} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            padding: '8px 0 6px',
          }}
        >
          <GridCell label="Payment Mode" value={emp.payment_mode} />
          <GridCell label="UAN" value={emp.uan} />
          <GridCell label="PF Number" value={emp.pf_number} />
          <GridCell label="PAN Number" value={emp.pan_number} />
        </div>
        <hr style={HAIRLINE_BLACK} />

        <div style={{ fontSize: 13, fontWeight: 400, padding: '14px 0 10px' }}>SALARY DETAILS</div>
        <hr style={HAIRLINE_BLACK} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.25fr 1.2fr 1.1fr 0.9fr 1fr',
            padding: '8px 0 6px',
          }}
        >
          <GridCell label="Actual Payable Days" value={fmtDays1(c.effectivePaidDays)} />
          <GridCell label="Total Working Days" value={fmtDays1(c.totalWorkingDays)} />
          <GridCell label="Loss Of Pay Days" value={fmtDays2(c.lopDays)} />
          <GridCell
            label="Days Payable"
            value={Number.isInteger(c.daysPayable) ? String(c.daysPayable) : fmtDays1(c.daysPayable)}
          />
          <GridCell label="Overtime Hours" value="0.0" />
        </div>
        <hr style={HAIRLINE_GRAY} />

        <div style={{ display: 'flex', marginTop: 16, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>EARNINGS</div>
            {earnings.map((e) => (
              <LineRow key={e.label} label={e.label} amount={e.amount} />
            ))}
            <LineRow label="Total Earnings" amount={c.totalEarningsA} boldLabel />
          </div>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              paddingLeft: 16,
              borderLeft: '0.75px solid #d3d3d3',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>PF Deductions</div>
            <LineRow label="PF Employee" amount={c.pfEmployee} />
            <LineRow label="Total PF Deductions" amount={c.totalPfDeductionsB} boldLabel />

            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 14, marginBottom: 10 }}>
              Taxes &amp; other Deductions
            </div>
            <LineRow label="Professional Tax" amount={c.professionalTax} />
            {customDeductions
              .filter((d) => d.label)
              .map((d, i) => (
                <LineRow key={i} label={d.label} amount={Number(d.amount) || 0} />
              ))}
            <LineRow
              label="Total Taxes &amp; Other Deductions"
              amount={c.totalTaxesDeductionsC}
              boldLabel
            />
          </div>
        </div>

        <SummaryBand
          label="Total"
          amount={c.netPay}
          wordsLabel="Total in words"
          words={netWords}
        />

        {c.reimbursements.length > 0 ? (
          <div style={{ marginTop: 16, maxWidth: '50%' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Reimbursements</div>
            {c.reimbursements.map((r, i) => (
              <LineRow key={i} label={r.label} amount={r.amount} />
            ))}
            <LineRow label="Total Reimbursements" amount={c.totalReimbursementsD} boldLabel />
          </div>
        ) : null}

        <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 700 }}>**Note : </span>
          <span style={{ fontStyle: 'italic' }}>
            All amounts displayed in this payslip are in INR
          </span>
        </div>
        <hr style={{ ...HAIRLINE_BLACK, marginTop: 22 }} />
      </div>

      <LeaveDetailsPage rows={leaveDetails} fontFamily={fontFamily} />
    </div>
  )
}
