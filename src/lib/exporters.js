import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} from 'docx'
import { fmtCOP, fmtNum } from './helpers'

const AZUL     = [27, 58, 92]
const AZUL2    = [37, 99, 166]
const VERDE    = [26, 107, 53]
const GRIS     = [244, 247, 251]

// ── shared filename ───────────────────────────────────────────────────────────
const filename = (d, ext) =>
  `Acta_No${d.numero}_${(d.contratista || 'acta').replace(/\s+/g, '_')}.${ext}`

// ─────────────────────────────────────────────────────────────────────────────
//  PDF
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPDF(d) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(...AZUL)
  doc.rect(14, 12, W - 28, 20, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text('ACTA DE OBRA', W / 2, 22, { align: 'center' })
  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal')
  doc.text('Documento de cobro por actividades ejecutadas', W / 2, 27, { align: 'center' })

  // Acta badge
  doc.setFillColor(...AZUL2)
  doc.roundedRect(W - 44, 13, 28, 8, 2, 2, 'F')
  doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text(`Acta No. ${d.numero}`, W - 30, 18.2, { align: 'center' })

  let y = 38

  function secHeader(title, yy) {
    doc.setFillColor(...AZUL)
    doc.rect(14, yy, W - 28, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8); doc.setFont('helvetica', 'bold')
    doc.text(title, 16, yy + 4.8)
    doc.setTextColor(0, 0, 0)
    return yy + 9
  }

  function infoBox(pairs, yy, cols = 2) {
    const colW = (W - 28) / cols
    pairs.forEach((p, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = 14 + col * colW
      const ry = yy + row * 12
      doc.setFillColor(...GRIS)
      doc.rect(x, ry, colW - 1, 12, 'F')
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
      doc.text(p[0], x + 2, ry + 4.5)
      doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20)
      doc.text(String(p[1] || '—'), x + 2, ry + 9.5)
    })
    return yy + Math.ceil(pairs.length / cols) * 12 + 3
  }

  // Logo
  if (d.logo) {
    try {
      const ext = d.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      doc.addImage(d.logo, ext, 14, 12, 30, 20)
    } catch {}
  }

  y = secHeader('1. INFORMACIÓN GENERAL DEL ACTA', y)
  y = infoBox([['Número de Acta', d.numero], ['Fecha', d.fecha], ['No. Contrato', d.contrato || '—']], y, 3) + 2
  y = infoBox([['Período ejecutado', d.periodo || '—'], ['Obra / Proyecto', d.obra || '—']], y, 2) + 2

  y = secHeader('2. CONTRATANTE / CLIENTE', y)
  y = infoBox([['Empresa / Razón social', d.cliente], ['NIT', d.nit_cl]], y, 2)
  y = infoBox([['Director de obra', d.director], ['Cargo', d.cargo || 'Director de Obra'], ['Teléfono', d.tel_cl || '—']], y, 3) + 2

  y = secHeader('3. CONTRATISTA', y)
  y = infoBox([['Empresa / Razón social', d.contratista], ['NIT', d.nit_c]], y, 2)
  y = infoBox([['Representante', d.representante || '—'], ['Teléfono', d.tel_c || '—'], ['Tipo de actividad', d.tipo || 'Obra civil']], y, 3) + 2

  y = secHeader('4. RELACIÓN DE ACTIVIDADES EJECUTADAS', y)
  y += 2

  // Build rows
  const rows = []
  d.grupos.forEach((g) => {
    rows.push([{
      content: g.nombre || 'Sin nombre',
      colSpan: 6,
      styles: { fontStyle: 'bold', fillColor: [235, 244, 250], textColor: AZUL, fontSize: 8 },
    }])
    g.acts.filter(a => a.desc).forEach((a) => {
      const vt = Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0))
      rows.push([a.item, a.desc, a.und, fmtNum(a.cant), fmtCOP(a.vunit), fmtCOP(vt)])
    })
  })

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Descripción de la actividad', 'Und', 'Cantidad', 'V. Unitario', 'V. Total']],
    body: rows,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2.5, lineColor: [203, 213, 224], lineWidth: 0.2 },
    headStyles: { fillColor: AZUL, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: GRIS },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
    },
  })

  y = doc.lastAutoTable.finalY + 4
  if (y > 248) { doc.addPage(); y = 18 }

  // Totals
  const T = d.totals; const aiu = d.aiu
  const totRows = [
    ['Total Bruto', T.bruto],
    [`Administración ${aiu.admin || 10}%`, T.admV],
    [`Imprevistos ${aiu.imprevistos || 3}%`, T.impV],
    [`Utilidad ${aiu.utilidad || 10}%`, T.utiV],
    [`IVA ${d.iva || 19}% (sobre AIU)`, T.ivaV],
  ]
  const tx = W - 82
  doc.setFontSize(7.5)
  totRows.forEach((r, i) => {
    doc.setFillColor(i % 2 === 0 ? 244 : 249, i % 2 === 0 ? 247 : 251, 251)
    doc.rect(tx, y + i * 8, 68, 8, 'F')
    doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal')
    doc.text(r[0], tx + 2, y + i * 8 + 5.2)
    doc.setTextColor(20, 20, 20)
    doc.text(fmtCOP(r[1]), tx + 66, y + i * 8 + 5.2, { align: 'right' })
  })
  const ty = y + totRows.length * 8
  doc.setFillColor(234, 244, 238)
  doc.rect(tx, ty, 68, 11, 'F')
  doc.setDrawColor(...VERDE); doc.setLineWidth(0.7)
  doc.rect(tx, ty, 68, 11, 'S')
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...VERDE)
  doc.text('TOTAL FINAL', tx + 2, ty + 7)
  doc.text(fmtCOP(T.total), tx + 66, ty + 7, { align: 'right' })

  // Observaciones
  if (d.observaciones) {
    const ox = 14; const ow = W - 28 - 72
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80)
    doc.text('Observaciones:', ox, ty + 2)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(20, 20, 20)
    const lines = doc.splitTextToSize(d.observaciones, ow - 4)
    doc.text(lines, ox, ty + 7)
  }

  // Firmas
  let fy = ty + 24
  if (fy > 255) { doc.addPage(); fy = 20 }
  doc.setDrawColor(...AZUL); doc.setLineWidth(0.5)
  doc.line(14, fy + 16, 74, fy + 16)
  doc.line(W - 74, fy + 16, W - 14, fy + 16)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40)
  doc.text(d.contratista || '—', 44, fy + 21, { align: 'center' })
  doc.text(d.director || '—', W - 44, fy + 21, { align: 'center' })
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...AZUL2)
  doc.text('CONTRATISTA', 44, fy + 25.5, { align: 'center' })
  doc.text('DIRECTOR DE OBRA', W - 44, fy + 25.5, { align: 'center' })

  // Footer all pages
  const pages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    doc.setFontSize(7); doc.setTextColor(150, 150, 150); doc.setFont('helvetica', 'normal')
    doc.text(
      `Acta No. ${d.numero} · ${d.contratista} · ${d.cliente}`,
      14, doc.internal.pageSize.getHeight() - 7
    )
    doc.text(
      `Pág. ${p} / ${pages}`,
      W - 14, doc.internal.pageSize.getHeight() - 7,
      { align: 'right' }
    )
  }

  doc.save(filename(d, 'pdf'))
}

// ─────────────────────────────────────────────────────────────────────────────
//  WORD
// ─────────────────────────────────────────────────────────────────────────────
export async function exportWord(d) {
  const A = '#1B3A5C'; const A2 = '#2563A6'; const VE = '#1A6B35'
  const GR = '#F4F7FB'; const GB = '#EBF4FF'; const GV = '#EAF4EE'
  const pgW = 11906
  const margins = { top: 1200, right: 1200, bottom: 1200, left: 1200 }
  const cW = pgW - margins.left - margins.right

  const bdr = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E0' }
  const borders = { top: bdr, bottom: bdr, left: bdr, right: bdr }

  function hdr(text) {
    return new Paragraph({
      children: [new TextRun({ text, bold: true, color: 'FFFFFF', size: 22, font: 'Arial' })],
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.CLEAR, fill: '1B3A5C' },
      spacing: { before: 100, after: 100 },
    })
  }

  function infoTbl(pairs) {
    const cw = Math.floor(cW / pairs.length)
    return new Table({
      width: { size: cW, type: WidthType.DXA },
      columnWidths: pairs.map(() => cw),
      rows: [
        new TableRow({ children: pairs.map(([lbl]) => new TableCell({
          width: { size: cw, type: WidthType.DXA }, borders,
          shading: { type: ShadingType.CLEAR, fill: 'F4F7FB' },
          margins: { top: 60, bottom: 30, left: 120, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: lbl, bold: true, size: 14, color: '555555', font: 'Arial' })] })],
        })) }),
        new TableRow({ children: pairs.map(([, val]) => new TableCell({
          width: { size: cw, type: WidthType.DXA }, borders,
          shading: { type: ShadingType.CLEAR, fill: 'FFFFFF' },
          margins: { top: 30, bottom: 80, left: 120, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: String(val || '—'), size: 17, font: 'Arial' })] })],
        })) }),
      ],
    })
  }

  function cell(txt, align = AlignmentType.CENTER, w = 700, fill = 'FFFFFF') {
    return new TableCell({
      width: { size: w, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(txt), size: 16, font: 'Arial' })] })],
    })
  }

  function hdrCell(txt, w) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: '1B3A5C' },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: txt, bold: true, color: 'FFFFFF', size: 16, font: 'Arial' })] })],
    })
  }

  const sp = () => new Paragraph({ spacing: { before: 0, after: 100 } })

  // Activity rows
  const actRows = []
  actRows.push(new TableRow({ children: [hdrCell('Item', 700), hdrCell('Descripción de la actividad', 4300), hdrCell('Und', 700), hdrCell('Cant.', 900), hdrCell('V. Unitario', 1200), hdrCell('V. Total', 1200)], tableHeader: true }))

  d.grupos.forEach((g, gi) => {
    actRows.push(new TableRow({ children: [new TableCell({
      columnSpan: 6, borders,
      shading: { type: ShadingType.CLEAR, fill: 'EBF4FF' },
      margins: { top: 60, bottom: 60, left: 120, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: g.nombre || `Grupo ${gi + 1}`, bold: true, size: 17, color: '1B3A5C', font: 'Arial' })] })],
    })] }))
    g.acts.filter(a => a.desc).forEach((a, ai) => {
      const vt = Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0))
      const fill = ai % 2 === 0 ? 'FFFFFF' : 'F4F7FB'
      actRows.push(new TableRow({ children: [
        cell(a.item, AlignmentType.CENTER, 700, fill),
        cell(a.desc, AlignmentType.LEFT, 4300, fill),
        cell(a.und, AlignmentType.CENTER, 700, fill),
        cell(fmtNum(a.cant), AlignmentType.RIGHT, 900, fill),
        cell(fmtCOP(a.vunit), AlignmentType.RIGHT, 1200, fill),
        cell(fmtCOP(vt), AlignmentType.RIGHT, 1200, fill),
      ] }))
    })
  })

  // Totals table
  const T = d.totals; const aiu = d.aiu
  const totW = Math.floor(cW * 0.52)
  const totLines = [
    [`Total Bruto`, fmtCOP(T.bruto), false],
    [`Administración ${aiu.admin || 10}%`, fmtCOP(T.admV), false],
    [`Imprevistos ${aiu.imprevistos || 3}%`, fmtCOP(T.impV), false],
    [`Utilidad ${aiu.utilidad || 10}%`, fmtCOP(T.utiV), false],
    [`IVA ${d.iva || 19}% (sobre AIU)`, fmtCOP(T.ivaV), false],
    ['TOTAL FINAL', fmtCOP(T.total), true],
  ]
  const totRows = totLines.map(([l, v, bold]) => new TableRow({ children: [
    new TableCell({
      width: { size: Math.floor(totW * 0.55), type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: bold ? 'EAF4EE' : 'F4F7FB' },
      margins: { top: 80, bottom: 80, left: 120, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: l, bold, size: bold ? 19 : 16, color: bold ? '1B3A5C' : '555555', font: 'Arial' })] })],
    }),
    new TableCell({
      width: { size: Math.floor(totW * 0.45), type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: bold ? 'EAF4EE' : 'F4F7FB' },
      margins: { top: 80, bottom: 80, left: 80, right: 120 },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: v, bold, size: bold ? 20 : 16, color: bold ? '1A6B35' : '111111', font: 'Arial' })] })],
    }),
  ] }))

  // Signature row
  const sigW = Math.floor((cW - 600) / 2)
  function sigCell(name, role) {
    return new TableCell({
      width: { size: sigW, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 8, color: '1B3A5C' } },
      margins: { top: 700, bottom: 80, left: 80, right: 80 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: name, size: 17, font: 'Arial' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: role, bold: true, size: 16, color: '2563A6', font: 'Arial' })] }),
      ],
    })
  }
  function spacerCell() {
    return new TableCell({
      width: { size: 600, type: WidthType.DXA },
      borders: { top: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE } },
      children: [sp()],
    })
  }

  const docx = new Document({
    sections: [{
      properties: { page: { size: { width: pgW, height: 16838 }, margin: margins } },
      children: [
        hdr('ACTA DE OBRA'),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 160 }, children: [new TextRun({ text: 'Documento de cobro por actividades ejecutadas', size: 17, color: '2563A6', font: 'Arial' })] }),
        hdr('1. INFORMACIÓN GENERAL DEL ACTA'), sp(),
        infoTbl([['Número de Acta', d.numero], ['Fecha', d.fecha], ['No. Contrato', d.contrato || '—']]), sp(),
        infoTbl([['Período ejecutado', d.periodo || '—'], ['Obra / Proyecto', d.obra || '—']]), sp(),
        hdr('2. CONTRATANTE / CLIENTE'), sp(),
        infoTbl([['Empresa / Razón social', d.cliente], ['NIT', d.nit_cl]]), sp(),
        infoTbl([['Director de obra', d.director], ['Cargo', d.cargo || 'Director de Obra'], ['Teléfono', d.tel_cl || '—']]), sp(),
        hdr('3. CONTRATISTA'), sp(),
        infoTbl([['Empresa / Razón social', d.contratista], ['NIT', d.nit_c]]), sp(),
        infoTbl([['Representante', d.representante || '—'], ['Teléfono', d.tel_c || '—'], ['Tipo de actividad', d.tipo || 'Obra civil']]), sp(),
        hdr('4. RELACIÓN DE ACTIVIDADES EJECUTADAS'), sp(),
        new Table({ width: { size: cW, type: WidthType.DXA }, columnWidths: [700, 4300, 700, 900, 1200, 1200], rows: actRows }), sp(),
        new Table({ width: { size: totW, type: WidthType.DXA }, columnWidths: [Math.floor(totW * 0.55), Math.floor(totW * 0.45)], rows: totRows }), sp(),
        ...(d.observaciones ? [
          hdr('5. OBSERVACIONES'), sp(),
          new Paragraph({ children: [new TextRun({ text: d.observaciones, size: 17, font: 'Arial' })], spacing: { before: 60, after: 60 } }),
          sp(),
        ] : []),
        hdr('6. APROBACIÓN Y FIRMAS'), sp(), sp(), sp(),
        new Table({
          width: { size: cW, type: WidthType.DXA },
          columnWidths: [sigW, 600, sigW],
          rows: [new TableRow({ children: [sigCell(d.contratista || '—', 'CONTRATISTA'), spacerCell(), sigCell(d.director || '—', 'DIRECTOR DE OBRA')] })],
        }),
      ],
    }],
  })

  const blob = await Packer.toBlob(docx)
  saveAs(blob, filename(d, 'docx'))
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXCEL
// ─────────────────────────────────────────────────────────────────────────────
export function exportExcel(d) {
  const rows = []
  rows.push([d.contratista, '', '', '', '', ''])
  rows.push([`NIT: ${d.nit_c}`, '', '', '', '', ''])
  rows.push([`Fecha: ${d.fecha}`, '', '', '', '', ''])
  rows.push([`Nº de Acta: ${d.numero}`, '', '', '', '', ''])
  rows.push([`Cliente: ${d.cliente}`, '', `ACTIVIDAD: ${d.tipo || 'Obra Civil'}`, '', '', ''])
  rows.push([`NIT: ${d.nit_cl}`, '', '', '', '', ''])
  rows.push(['Item', 'Descripción', 'UND', 'Cantidad', 'Precio Unitario', 'Precio Gral.'])

  d.grupos.forEach((g) => {
    rows.push([g.nombre, '', '', '', '', ''])
    g.acts.filter(a => a.desc).forEach((a) => {
      rows.push([a.item, a.desc, a.und, parseFloat(a.cant) || 0, parseFloat(a.vunit) || 0,
        Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0))])
    })
    rows.push(['', '', '', '', '', ''])
  })

  const T = d.totals; const aiu = d.aiu
  rows.push(['', '', '', '', 'Total Bruto', T.bruto])
  rows.push(['', '', '', '', `Administración ${aiu.admin || 10}%`, T.admV])
  rows.push(['', '', '', '', `Imprevistos ${aiu.imprevistos || 3}%`, T.impV])
  rows.push(['', '', '', '', `Utilidad ${aiu.utilidad || 10}%`, T.utiV])
  rows.push(['', '', '', '', `IVA ${d.iva || 19}%`, T.ivaV])
  rows.push(['', '', '', '', 'TOTAL', T.total])
  rows.push(['', '', '', '', '', ''])
  rows.push([`RECIBE: ${d.director}`, '', '', `CONTRATISTA: ${d.contratista}`, '', ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 8 }, { wch: 52 }, { wch: 8 }, { wch: 10 }, { wch: 20 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `ACTA #${d.numero}`)
  XLSX.writeFile(wb, filename(d, 'xlsx'))
}
