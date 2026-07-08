'use client'

interface DocumentPreviewFrameProps {
  children: React.ReactNode
  pages?: number
  /** When true, preview height follows document content instead of a fixed A4 slot */
  fitContent?: boolean
}

const SCALE = 0.75
const DOC_WIDTH = 794
const DOC_HEIGHT = 1123

export default function DocumentPreviewFrame({
  children,
  pages = 1,
  fitContent = false,
}: DocumentPreviewFrameProps) {
  const viewportMinH = fitContent ? undefined : DOC_HEIGHT * SCALE * pages

  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[2px] text-text-muted print:hidden">
        PREVIEW
      </p>
      <div className="overflow-visible rounded-xl border border-border bg-white pb-2 print:border-0 print:rounded-none print:bg-white print:p-0 print:shadow-none">
        <div
          className="print-viewport-reset"
          style={{
            width: fitContent ? undefined : DOC_WIDTH * SCALE,
            ...(viewportMinH != null ? { minHeight: viewportMinH } : {}),
            overflow: 'visible',
          }}
        >
          <div
            className="print-scale-reset"
            style={
              fitContent
                ? {
                    // zoom shrinks the layout box (unlike transform), so no empty gap below
                    zoom: SCALE,
                    width: DOC_WIDTH,
                    maxWidth: '100%',
                  }
                : {
                    transform: `scale(${SCALE})`,
                    transformOrigin: 'top left',
                    width: DOC_WIDTH,
                    paddingBottom: 56,
                  }
            }
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
