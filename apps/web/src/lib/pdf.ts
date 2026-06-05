import { jsPDF } from 'jspdf'

/** Render a title + body text to a paginated A4 PDF and trigger a download. */
export function downloadTextPdf(title: string, text: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const width = pageW - margin * 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(doc.splitTextToSize(title, width), margin, margin)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  // Strip simple markdown markers for a clean PDF.
  const clean = text.replace(/^#+\s*/gm, '').replace(/\*\*/g, '')
  const lines = doc.splitTextToSize(clean, width)
  let y = margin + 28
  for (const line of lines) {
    if (y > pageH - margin) {
      doc.addPage()
      y = margin
    }
    doc.text(line, margin, y)
    y += 15
  }
  doc.save(`${title.replace(/[^\w\s-]/g, '').trim() || 'document'}.pdf`)
}
