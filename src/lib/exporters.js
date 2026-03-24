import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} from 'docx'
import { fmtCOP, fmtNum } from './helpers'

// ── Paleta (familia Office — dark navy + steel blue, misma familia) ─────────
const DARK  = [23,  54,  93 ]   // #17365D  navy profundo — bandas y th
const GRP   = [79, 129, 189]    // #4F81BD  azul acento   — filas de grupo
const BORD  = [149,179, 215]    // #95B3D7  azul suave    — bordes tabla
const WHITE = [255, 255, 255]
const TEXT  = [30,  30,  30 ]   // texto principal
const SUB   = [110, 110, 110]   // texto secundario
const ROW_A = [235, 241, 249]   // #EBF1F9  azul muy claro — fila alterna

// ── Helpers ──────────────────────────────────────────────────────────────────
const filename = (d, ext) =>
  `Acta_No${d.numero}_${(d.contratista || 'acta').replace(/\s+/g, '_')}.${ext}`

const fmtFecha = (str) => {
  if (!str) return '—'
  const [y, m, dd] = str.split('-')
  return `${parseInt(dd, 10)}/${parseInt(m, 10).toString().padStart(2, '0')}/${y}`
}

const fmtVal = (n) => {
  if (!n && n !== 0) return '—'
  return Math.round(n).toLocaleString('es-CO')
}

// ─────────────────────────────────────────────────────────────────────────────
//  PDF
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPDF(d) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W   = doc.internal.pageSize.getWidth()
  const mg  = 10
  const uw  = W - mg * 2

  // ── A. HEADER ──────────────────────────────────────────────────────────────
  const BAND_H   = 5      // altura de cada banda azul
  const contentH = 36     // zona de contenido (7 líneas de datos)
  const hdrH     = BAND_H * 2 + contentH  // 46 mm
  const hdrY     = 10
  const cy       = hdrY + BAND_H   // inicio área de contenido

  // Dos zonas: izquierda 60% (datos) | derecha 40% (logo)
  const infoW = uw * 0.60
  const logoW = uw - infoW
  const logoX = mg + infoW

  // ── Bandas rellenas ───────────────────────────────────────────────────────
  doc.setFillColor(...DARK)
  doc.rect(mg, hdrY,          uw, BAND_H, 'F')   // superior
  doc.rect(mg, cy + contentH, uw, BAND_H, 'F')   // inferior

  // ── Borde exterior ────────────────────────────────────────────────────────
  doc.setDrawColor(...DARK); doc.setLineWidth(0.4)
  doc.rect(mg, hdrY, uw, hdrH)

  // ── Zona izquierda: datos contratista + ACTIVIDAD al fondo ────────────────
  const lx = mg + 5
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK)
  doc.text((d.contratista || '—').toUpperCase(), lx, cy + 6)

  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
  doc.text(`NIT: ${d.nit_c || '—'}`,      lx, cy + 11)
  doc.text(`Fecha: ${fmtFecha(d.fecha)}`,  lx, cy + 16)

  const actaLabel = `N° de Acta: ${d.numero}${d.contrato ? '  (' + d.contrato + ')' : ''}`
  doc.text(actaLabel,                      lx, cy + 21)

  doc.setFont('helvetica', 'bold')
  doc.text(`Cliente: ${(d.cliente || '—').toUpperCase()}`, lx, cy + 26)
  doc.setFont('helvetica', 'normal')
  doc.text(`NIT: ${d.nit_cl || '—'}`,      lx, cy + 30)

  // ACTIVIDAD al fondo, con pequeña separación visual
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...DARK)
  doc.text(`ACTIVIDAD: ${(d.tipo || 'OBRA CIVIL').toUpperCase()}`, lx, cy + contentH - 3)

  // ── Zona derecha: logo ────────────────────────────────────────────────────
  if (d.logo) {
    try {
      const ext = d.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      const pad = 4
      doc.addImage(d.logo, ext,
        logoX + pad, cy + pad,
        logoW - pad * 2, contentH - pad * 2,
        undefined, 'FAST')
    } catch {}
  } else {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK)
    doc.text(d.contratista || '—', logoX + logoW / 2, cy + contentH / 2 + 2,
      { align: 'center', maxWidth: logoW - 6 })
  }

  // ── B. TABLA DE ACTIVIDADES ────────────────────────────────────────────────
  let y = hdrY + hdrH + 5
  let groupNum = 0
  const rows = []

  d.grupos.forEach((g) => {
    groupNum++
    rows.push([{
      content: `${groupNum}.0     ${(g.nombre || 'Sin nombre').toUpperCase()}`,
      colSpan: 6,
      styles: {
        fontStyle:   'bold',
        fontSize:    8,
        fillColor:   GRP,
        textColor:   WHITE,
        cellPadding: { top: 2.5, bottom: 2.5, left: 5, right: 3 },
        lineColor:   GRP,
        lineWidth:   0.2,
      },
    }])

    g.acts.filter(a => a.desc).forEach((a, ai) => {
      const vt   = Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0))
      const fill = ai % 2 === 0 ? WHITE : ROW_A
      rows.push([
        { content: a.item || '',                             styles: { halign: 'center', fillColor: fill } },
        { content: a.desc || '',                             styles: { halign: 'left',   fillColor: fill } },
        { content: a.und  || '',                             styles: { halign: 'center', fillColor: fill } },
        { content: fmtNum(a.cant),                           styles: { halign: 'right',  fillColor: fill } },
        { content: a.vunit ? `$ ${fmtVal(a.vunit)}` : '—',  styles: { halign: 'right',  fillColor: fill } },
        { content: vt > 0  ? `$ ${fmtVal(vt)}`      : '—',  styles: { halign: 'right',  fillColor: fill } },
      ])
    })
  })

  autoTable(doc, {
    startY:  y,
    head:    [['Item', 'Descripción', 'UND', 'Cantidad', 'Precio Unitario', 'Precio Gral.']],
    body:    rows,
    margin:  { left: mg, right: mg },
    styles: {
      fontSize:    8,
      cellPadding: { top: 2, bottom: 2, left: 5, right: 2.5 },
      lineColor:   BORD,
      lineWidth:   0.2,
      textColor:   TEXT,
      font:        'helvetica',
    },
    headStyles: {
      fillColor:   DARK,
      textColor:   WHITE,
      fontStyle:   'bold',
      fontSize:    8,
      halign:      'center',
      cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
      lineColor:   DARK,
      lineWidth:   0.2,
    },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { cellWidth: 14 },
      3: { cellWidth: 20 },
      4: { cellWidth: 32 },
      5: { cellWidth: 32 },
    },
    tableLineColor: BORD,
    tableLineWidth: 0.2,
  })

  y = doc.lastAutoTable.finalY + 6

  // ── C. TOTALES (alineados a la derecha) ────────────────────────────────────
  const T    = d.totals
  const aiu  = d.aiu
  const blkW = 95
  const tx   = W - mg - blkW
  const c1   = blkW * 0.54
  const rh   = 7

  const totLines = [
    { lbl: 'Total Bruto',                             val: T.bruto, bold: false },
    { lbl: `ADMINISTRACION ${aiu.admin      || 10}%`, val: T.admV,  bold: false },
    { lbl: `IMPREVISTOS ${aiu.imprevistos   || 3}%`,  val: T.impV,  bold: false },
    { lbl: `UTILIDAD ${aiu.utilidad         || 10}%`, val: T.utiV,  bold: false },
    { lbl: `IVA ${d.iva                     || 19}%`, val: T.ivaV,  bold: false },
    { lbl: 'TOTAL',                                   val: T.total, bold: true  },
  ]

  totLines.forEach(({ lbl, val, bold }, i) => {
    const ry   = y + i * rh
    const fill = bold ? DARK : (i % 2 === 0 ? WHITE : ROW_A)
    const tc   = bold ? WHITE : TEXT

    doc.setFillColor(...fill)
    doc.rect(tx, ry, blkW, rh, 'F')

    doc.setDrawColor(...BORD); doc.setLineWidth(0.2)
    doc.rect(tx, ry, blkW, rh)
    doc.line(tx + c1, ry, tx + c1, ry + rh)

    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...tc)
    doc.text(lbl, tx + c1 - 2, ry + rh * 0.68, { align: 'right' })
    doc.text(fmtVal(val), tx + blkW - 2, ry + rh * 0.68, { align: 'right' })
  })

  // Observaciones
  if (d.observaciones) {
    const obsW = tx - mg - 4
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...SUB)
    doc.text('Observaciones:', mg, y + 4)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
    doc.text(doc.splitTextToSize(d.observaciones, obsW), mg, y + 9)
  }

  // ── D. FIRMAS ──────────────────────────────────────────────────────────────
  const SIGN_BAND = 5
  const signContH = 22
  let fy = y + totLines.length * rh + 14
  if (fy + SIGN_BAND * 2 + signContH > 272) { doc.addPage(); fy = 20 }

  // Banda superior
  doc.setFillColor(...DARK)
  doc.rect(mg, fy, uw, SIGN_BAND, 'F')

  // Líneas y nombres
  const sigW  = uw * 0.36
  const sigLX = mg + uw * 0.06
  const sigRX = W - mg - uw * 0.06 - sigW
  const lineY = fy + SIGN_BAND + 13
  const nameY = fy + SIGN_BAND + 17
  const lblY  = fy + SIGN_BAND + 21

  doc.setDrawColor(...BORD); doc.setLineWidth(0.3)
  doc.line(sigLX,        lineY, sigLX + sigW,        lineY)
  doc.line(sigRX,        lineY, sigRX + sigW,        lineY)

  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK)
  doc.text(d.director    || '—', sigLX + sigW / 2, nameY, { align: 'center', maxWidth: sigW })
  doc.text(d.contratista || '—', sigRX + sigW / 2, nameY, { align: 'center', maxWidth: sigW })

  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...SUB)
  doc.text('RECIBE',      sigLX + sigW / 2, lblY, { align: 'center' })
  doc.text('CONTRATISTA', sigRX + sigW / 2, lblY, { align: 'center' })

  // Banda inferior
  doc.setFillColor(...DARK)
  doc.rect(mg, fy + SIGN_BAND + signContH, uw, SIGN_BAND, 'F')

  // ── E. FOOTER ─────────────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    const pH = doc.internal.pageSize.getHeight()
    doc.setDrawColor(180, 200, 220); doc.setLineWidth(0.2)
    doc.line(mg, pH - 9, W - mg, pH - 9)
    doc.setFontSize(6.5); doc.setTextColor(150, 170, 190); doc.setFont('helvetica', 'normal')
    doc.text(`Acta No. ${d.numero}  ·  ${d.contratista || ''}  ·  ${d.cliente || ''}`, mg, pH - 5)
    doc.text(`${p} / ${pages}`, W - mg, pH - 5, { align: 'right' })
  }

  doc.save(filename(d, 'pdf'))
}

// ─────────────────────────────────────────────────────────────────────────────
//  WORD
// ─────────────────────────────────────────────────────────────────────────────
export async function exportWord(d) {
  const pgW     = 11906
  const margins = { top: 700, right: 700, bottom: 700, left: 700 }
  const cW      = pgW - margins.left - margins.right

  const bdrDark = { style: BorderStyle.SINGLE, size: 4, color: '17365D' }
  const bdrThin = { style: BorderStyle.SINGLE, size: 1, color: '95B3D7' }
  const borders = { top: bdrThin, bottom: bdrThin, left: bdrThin, right: bdrThin }

  const sp = (b = 0, a = 80) => new Paragraph({ spacing: { before: b, after: a } })

  const leftW  = Math.floor(cW * 0.60)
  const rightW = cW - leftW

  function infoCell() {
    const actaLabel = `N° de Acta: ${d.numero}${d.contrato ? '  (' + d.contrato + ')' : ''}`
    return new TableCell({
      width: { size: leftW, type: WidthType.DXA },
      borders: { top: bdrDark, bottom: bdrDark, left: bdrDark, right: bdrThin },
      margins: { top: 100, bottom: 80, left: 120, right: 80 },
      children: [
        new Paragraph({ children: [new TextRun({ text: (d.contratista||'—').toUpperCase(), bold: true, size: 26, font: 'Arial', color: '17365D' })] }),
        new Paragraph({ children: [new TextRun({ text: `NIT: ${d.nit_c||'—'}`, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: `Fecha: ${fmtFecha(d.fecha)}`, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: actaLabel, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: `Cliente: ${(d.cliente||'—').toUpperCase()}`, bold: true, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: `NIT: ${d.nit_cl||'—'}`, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: `ACTIVIDAD: ${(d.tipo||'OBRA CIVIL').toUpperCase()}`, bold: true, size: 16, font: 'Arial', color: '17365D' })] }),
      ],
    })
  }

  function logoCell() {
    return new TableCell({
      width: { size: rightW, type: WidthType.DXA },
      borders: { top: bdrDark, bottom: bdrDark, left: bdrThin, right: bdrDark },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: (d.contratista||'').toUpperCase(), bold: true, size: 22, font: 'Arial', color: '17365D' })],
      })],
    })
  }

  const headerTable = new Table({
    width: { size: cW, type: WidthType.DXA }, columnWidths: [leftW, rightW],
    rows: [new TableRow({ children: [infoCell(), logoCell()] })],
  })

  const actCols = [700, 4200, 680, 900, 1250, 1250]

  function hdrCell(txt, w) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: bdrDark, bottom: bdrDark, left: bdrThin, right: bdrThin },
      shading: { type: ShadingType.CLEAR, fill: '17365D' },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: txt, bold: true, color: 'FFFFFF', size: 16, font: 'Arial' })] })],
    })
  }

  const actRows = [new TableRow({ children: [
    hdrCell('Item', actCols[0]), hdrCell('Descripción', actCols[1]),
    hdrCell('UND',  actCols[2]), hdrCell('Cantidad',    actCols[3]),
    hdrCell('Precio Unitario', actCols[4]), hdrCell('Precio Gral.', actCols[5]),
  ], tableHeader: true })]

  let gNum = 0
  d.grupos.forEach((g) => {
    gNum++
    actRows.push(new TableRow({ children: [new TableCell({
      columnSpan: 6,
      borders: { top: bdrThin, bottom: bdrThin, left: bdrDark, right: bdrDark },
      shading: { type: ShadingType.CLEAR, fill: '4F81BD' },
      margins: { top: 60, bottom: 60, left: 120, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: `${gNum}.0     ${(g.nombre||'Sin nombre').toUpperCase()}`, bold: true, size: 17, color: 'FFFFFF', font: 'Arial' })] })],
    })] }))

    g.acts.filter(a => a.desc).forEach((a, ai) => {
      const vt   = Math.round((parseFloat(a.cant)||0) * (parseFloat(a.vunit)||0))
      const fill = ai % 2 === 0 ? 'FFFFFF' : 'EBF1F9'

      function dCell(txt, align = AlignmentType.LEFT) {
        return new TableCell({
          borders, shading: { type: ShadingType.CLEAR, fill },
          margins: { top: 60, bottom: 60, left: 80, right: 80 },
          children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(txt||''), size: 16, font: 'Arial' })] })],
        })
      }

      actRows.push(new TableRow({ children: [
        dCell(a.item||'',                              AlignmentType.CENTER),
        dCell(a.desc||'',                              AlignmentType.LEFT),
        dCell(a.und||'',                               AlignmentType.CENTER),
        dCell(fmtNum(a.cant),                          AlignmentType.RIGHT),
        dCell(a.vunit ? `$ ${fmtVal(a.vunit)}` : '—', AlignmentType.RIGHT),
        dCell(vt > 0 ? `$ ${fmtVal(vt)}` : '—',       AlignmentType.RIGHT),
      ] }))
    })
  })

  const actTable = new Table({ width: { size: cW, type: WidthType.DXA }, columnWidths: actCols, rows: actRows })

  const T = d.totals; const aiu = d.aiu
  const tW = Math.floor(cW * 0.50); const lW = Math.floor(tW * 0.54); const vW = tW - lW

  const totLines = [
    { lbl: 'Total Bruto',                             val: fmtVal(T.bruto), bold: false },
    { lbl: `ADMINISTRACION ${aiu.admin      || 10}%`, val: fmtVal(T.admV), bold: false },
    { lbl: `IMPREVISTOS ${aiu.imprevistos   || 3}%`,  val: fmtVal(T.impV), bold: false },
    { lbl: `UTILIDAD ${aiu.utilidad         || 10}%`, val: fmtVal(T.utiV), bold: false },
    { lbl: `IVA ${d.iva                     || 19}%`, val: fmtVal(T.ivaV), bold: false },
    { lbl: 'TOTAL',                                   val: fmtVal(T.total),bold: true  },
  ]

  const totRows = totLines.map(({ lbl, val, bold }) => new TableRow({ children: [
    new TableCell({
      width: { size: lW, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: bold ? '17365D' : 'EBF1F9' },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: lbl, bold: true, size: bold ? 18 : 16, color: bold ? 'FFFFFF' : '1E1E1E', font: 'Arial' })] })],
    }),
    new TableCell({
      width: { size: vW, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: bold ? '17365D' : 'FFFFFF' },
      margins: { top: 80, bottom: 80, left: 80, right: 100 },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: val, bold: true, size: bold ? 18 : 16, color: bold ? 'FFFFFF' : '1E1E1E', font: 'Arial' })] })],
    }),
  ] }))

  const totTable = new Table({ width: { size: tW, type: WidthType.DXA }, columnWidths: [lW, vW], rows: totRows })

  const firmaPar = new Paragraph({
    spacing: { before: 400, after: 0 },
    children: [
      new TextRun({ text: `RECIBE: ${d.director||'—'}`, size: 17, font: 'Arial' }),
      new TextRun({ text: `          ` }),
      new TextRun({ text: `CONTRATISTA: ${d.contratista||'—'}`, size: 17, font: 'Arial' }),
    ],
  })

  const obsChildren = d.observaciones ? [
    sp(100, 40),
    new Paragraph({ children: [new TextRun({ text: 'Observaciones:', bold: true, size: 16, font: 'Arial', color: '95B3D7' })] }),
    new Paragraph({ children: [new TextRun({ text: d.observaciones, size: 16, font: 'Arial' })], spacing: { before: 40, after: 60 } }),
  ] : []

  const docx = new Document({
    sections: [{
      properties: { page: { size: { width: pgW, height: 16838 }, margin: margins } },
      children: [headerTable, sp(0, 0), actTable, sp(0, 80), totTable, ...obsChildren, firmaPar],
    }],
  })

  const blob = await Packer.toBlob(docx)
  saveAs(blob, filename(d, 'docx'))
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXCEL
// ─────────────────────────────────────────────────────────────────────────────
export async function exportExcel(d) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Actafy'
  const ws   = wb.addWorksheet(`ACTA ${d.numero}`)

  // Sin cuadrícula visible
  ws.views = [{ showGridLines: false }]

  // ── Paleta ─────────────────────────────────────────────────────────────────
  const DARK  = '17365D'   // navy profundo
  const GRP_C = '4F81BD'   // azul acento
  const WHITE = 'FFFFFF'
  const LIGHT = 'EBF1F9'   // azul muy claro — filas alternas
  const BORD  = '95B3D7'   // azul suave — bordes

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const bdM  = () => ({ style: 'medium', color: { argb: DARK } })
  const bdT  = () => ({ style: 'thin',   color: { argb: BORD } })
  const bAll = () => ({ top: bdT(), bottom: bdT(), left: bdT(), right: bdT() })
  const fnt  = (bold = false, color = '1E1E1E', size = 9) =>
    ({ name: 'Arial', size, bold, color: { argb: color } })
  const bg   = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb } })
  const aln  = (h = 'left', v = 'middle') => ({ horizontal: h, vertical: v })

  // ── Anchos de columna ───────────────────────────────────────────────────────
  ws.columns = [
    { width: 8  },   // A  Item
    { width: 40 },   // B  Descripción
    { width: 9  },   // C  UND
    { width: 12 },   // D  Cantidad
    { width: 22 },   // E  Precio Unitario
    { width: 22 },   // F  Precio Gral.
  ]

  // ── A. HEADER ───────────────────────────────────────────────────────────────
  // Función auxiliar: fila de banda full-width
  const addBand = () => {
    const r  = ws.addRow(['', '', '', '', '', ''])
    const rn = ws.rowCount
    r.height = 6
    ws.mergeCells(`A${rn}:F${rn}`)
    ws.getCell(`A${rn}`).fill = bg(DARK)
  }

  addBand()   // banda superior

  // 7 filas de contenido: A:D = info, E:F = logo
  const hdrData = [
    { txt: (d.contratista || '—').toUpperCase(), bold: true,  size: 12, h: 20 },
    { txt: `NIT: ${d.nit_c || '—'}`,             bold: false, size: 9,  h: 13 },
    { txt: `Fecha: ${fmtFecha(d.fecha)}`,         bold: false, size: 9,  h: 13 },
    { txt: `N° de Acta: ${d.numero}${d.contrato ? '  (' + d.contrato + ')' : ''}`,
                                                  bold: false, size: 9,  h: 13 },
    { txt: `Cliente: ${(d.cliente || '—').toUpperCase()}`, bold: true, size: 9, h: 13 },
    { txt: `NIT: ${d.nit_cl || '—'}`,             bold: false, size: 9,  h: 13 },
    { txt: `ACTIVIDAD: ${(d.tipo || 'OBRA CIVIL').toUpperCase()}`,
                                                  bold: true,  size: 9,  h: 14 },
  ]

  const hdrStartRow = ws.rowCount + 1   // primera fila de contenido (1-indexed)

  hdrData.forEach(({ txt, bold, size, h }, i) => {
    const row = ws.addRow(['', '', '', '', '', ''])
    const rn  = ws.rowCount
    row.height = h

    ws.mergeCells(`A${rn}:D${rn}`)   // info zone
    ws.mergeCells(`E${rn}:F${rn}`)   // logo zone

    const isFirst = i === 0
    const isLast  = i === hdrData.length - 1

    // Celda de info
    const cA = ws.getCell(`A${rn}`)
    cA.value     = txt
    cA.font      = fnt(bold, DARK, size)
    cA.alignment = { ...aln('left'), indent: 1 }
    cA.border    = {
      left:   bdM(),
      right:  bdT(),
      top:    isFirst ? bdM() : undefined,
      bottom: isLast  ? bdM() : undefined,
    }

    // Celda de logo (sin contenido — la imagen se superpone)
    const cE = ws.getCell(`E${rn}`)
    cE.border = {
      left:   bdT(),
      right:  bdM(),
      top:    isFirst ? bdM() : undefined,
      bottom: isLast  ? bdM() : undefined,
    }
  })

  const hdrEndRow = ws.rowCount   // última fila de contenido (1-indexed)

  addBand()   // banda inferior

  // Logo como imagen superpuesta en zona E:F
  if (d.logo) {
    try {
      const b64   = d.logo.includes(',') ? d.logo.split(',')[1] : d.logo
      const ext   = d.logo.startsWith('data:image/png') ? 'png' : 'jpeg'
      const imgId = wb.addImage({ base64: b64, extension: ext })
      ws.addImage(imgId, {
        tl: { col: 4, row: hdrStartRow - 1 },   // E, fila inicio (0-indexed)
        br: { col: 6, row: hdrEndRow },           // tras F, fila fin (0-indexed)
        editAs: 'oneCell',
      })
    } catch {}
  }

  ws.addRow([])   // separador

  // ── B. ENCABEZADO TABLA ─────────────────────────────────────────────────────
  const thRow = ws.addRow(['Item', 'Descripción', 'UND', 'Cantidad', 'Precio Unitario', 'Precio Gral.'])
  thRow.height = 20
  thRow.eachCell((cell) => {
    cell.fill      = bg(DARK)
    cell.font      = fnt(true, WHITE)
    cell.border    = bAll()
    cell.alignment = aln('center')
  })

  // ── C. ACTIVIDADES ──────────────────────────────────────────────────────────
  let gNum = 0; let alt = false

  d.grupos.forEach((g) => {
    gNum++
    const gRow = ws.addRow([`${gNum}.0  ${(g.nombre || '').toUpperCase()}`, '', '', '', '', ''])
    const gRn  = ws.rowCount
    ws.mergeCells(`A${gRn}:F${gRn}`)
    gRow.height = 18
    const gCell = ws.getCell(`A${gRn}`)
    gCell.fill      = bg(GRP_C)
    gCell.font      = fnt(true, WHITE)
    gCell.border    = bAll()
    gCell.alignment = { ...aln('left'), indent: 1 }
    alt = false

    g.acts.filter(a => a.desc).forEach((a) => {
      const vt    = Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0))
      const rowBg = alt ? LIGHT : WHITE
      const row   = ws.addRow([
        a.item || '', a.desc || '', a.und || '',
        parseFloat(a.cant)  || 0,
        parseFloat(a.vunit) || 0,
        vt,
      ])
      row.height = 16
      row.eachCell({ includeEmpty: true }, (cell, ci) => {
        cell.fill   = bg(rowBg)
        cell.font   = fnt()
        cell.border = bAll()
        if      (ci === 1 || ci === 3) cell.alignment = aln('center')
        else if (ci === 4)             { cell.alignment = aln('right'); cell.numFmt = '#,##0.00' }
        else if (ci === 5 || ci === 6) { cell.alignment = aln('right'); cell.numFmt = '#,##0' }
        else                           cell.alignment = aln('left')
      })
      alt = !alt
    })
  })

  ws.addRow([])   // separador

  // ── D. TOTALES (columnas E-F) ────────────────────────────────────────────────
  const T = d.totals; const aiu = d.aiu
  const totLines = [
    { lbl: 'Total Bruto',                          val: T.bruto, bold: false },
    { lbl: `ADMINISTRACION ${aiu.admin    || 10}%`, val: T.admV, bold: false },
    { lbl: `IMPREVISTOS ${aiu.imprevistos || 3}%`,  val: T.impV, bold: false },
    { lbl: `UTILIDAD ${aiu.utilidad       || 10}%`, val: T.utiV, bold: false },
    { lbl: `IVA ${d.iva                   || 19}%`, val: T.ivaV, bold: false },
    { lbl: 'TOTAL',                                 val: T.total,bold: true  },
  ]

  totLines.forEach(({ lbl, val, bold }, i) => {
    const rowBg = bold ? DARK : (i % 2 === 0 ? WHITE : LIGHT)
    const color  = bold ? WHITE : '1E1E1E'
    const row    = ws.addRow(['', '', '', '', lbl, val])
    const rn     = ws.rowCount
    row.height   = 18
    ws.mergeCells(`A${rn}:D${rn}`)

    const cL = ws.getCell(`E${rn}`)
    const cV = ws.getCell(`F${rn}`)
    cL.fill      = bg(rowBg);    cV.fill      = bg(rowBg)
    cL.font      = fnt(true, color)
    cV.font      = fnt(true, color)
    cL.border    = bAll();       cV.border    = bAll()
    cL.alignment = aln('right'); cV.alignment = aln('right')
    cV.numFmt    = '#,##0'
  })

  // ── E. FIRMAS ────────────────────────────────────────────────────────────────
  ws.addRow([])   // espacio

  // Banda superior firmas
  addBand()
  const sbtRn = ws.rowCount
  // (addBand ya creó la fila; asignamos altura correcta)
  ws.getRow(sbtRn).height = 8

  // Fila con los nombres (borde inferior = línea de firma)
  const sigRow = ws.addRow(['', '', '', '', '', ''])
  const sigRn  = ws.rowCount
  sigRow.height = 30
  ws.mergeCells(`A${sigRn}:C${sigRn}`)   // nombre izquierdo
  ws.mergeCells(`D${sigRn}:F${sigRn}`)   // nombre derecho

  const sA = ws.getCell(`A${sigRn}`)
  const sD = ws.getCell(`D${sigRn}`)
  sA.value     = d.director    || '—'
  sD.value     = d.contratista || '—'
  sA.font      = fnt(true, DARK, 9)
  sD.font      = fnt(true, DARK, 9)
  sA.alignment = aln('center', 'bottom')
  sD.alignment = aln('center', 'bottom')
  sA.border    = { bottom: bdM() }
  sD.border    = { bottom: bdM() }

  // Etiquetas de cargo
  const lblRow = ws.addRow(['', '', '', '', '', ''])
  const lblRn  = ws.rowCount
  lblRow.height = 14
  ws.mergeCells(`A${lblRn}:C${lblRn}`)
  ws.mergeCells(`D${lblRn}:F${lblRn}`)
  const lA = ws.getCell(`A${lblRn}`)
  const lD = ws.getCell(`D${lblRn}`)
  lA.value     = 'RECIBE'
  lD.value     = 'CONTRATISTA'
  lA.font      = fnt(false, '506070', 8)
  lD.font      = fnt(false, '506070', 8)
  lA.alignment = aln('center')
  lD.alignment = aln('center')

  // Banda inferior firmas
  addBand()
  ws.getRow(ws.rowCount).height = 8

  // ── GUARDAR ──────────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename(d, 'xlsx'))
}
