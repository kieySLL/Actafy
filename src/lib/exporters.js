import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import ExcelJS from 'exceljs'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} from 'docx'
import { fmtCOP, fmtNum } from './helpers'

// ── Paleta ─────────────────────────────────────────────────────────────────
const DARK   = [20,  30,  50 ]   // Navy oscuro — bandas y encabezados
const GRP    = [47,  84,  150]   // Azul medio — filas de grupo (75% más claro)
const BORD   = [80,  90,  110]   // Bordes tabla
const WHITE  = [255, 255, 255]
const TEXT   = [20,  20,  20 ]   // Texto principal
const SUB    = [90,  90,  90 ]   // Texto secundario
const ROW_A  = [245, 246, 248]   // Fila alterna muy suave

// ── Helpers ─────────────────────────────────────────────────────────────────
const filename = (d, ext) =>
  `Acta_No${d.numero}_${(d.contratista || 'acta').replace(/\s+/g, '_')}.${ext}`

const fmtFecha = (str) => {
  if (!str) return '—'
  const [y, m, dd] = str.split('-')
  return `${parseInt(dd, 10)}/${parseInt(m, 10).toString().padStart(2, '0')}/${y}`
}

// Formato numérico colombiano sin símbolo $
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
  const BAND_H   = 4           // altura de cada banda azul (superior e inferior)
  const contentH = 32          // altura zona de contenido
  const hdrH     = BAND_H * 2 + contentH   // 40 mm total
  const hdrY     = 10

  // Zonas horizontales (sin divisor vertical entre info y logo)
  const infoW  = uw * 0.44    // izquierda: datos contratista
  const actW   = uw * 0.18    // centro: ACTIVIDAD
  const logoW  = uw - infoW - actW   // derecha: logo
  const actX   = mg + infoW
  const logoX  = mg + infoW + actW
  const cy     = hdrY + BAND_H   // inicio del área de contenido

  // Bandas rellenas (primero para que el borde quede encima)
  doc.setFillColor(...DARK)
  doc.rect(mg, hdrY,            uw, BAND_H, 'F')   // banda superior
  doc.rect(mg, cy + contentH,   uw, BAND_H, 'F')   // banda inferior

  // Borde exterior del header
  doc.setDrawColor(...DARK); doc.setLineWidth(0.4)
  doc.rect(mg, hdrY, uw, hdrH)

  // Divisores verticales sutiles entre las 3 zonas
  doc.setDrawColor(...BORD); doc.setLineWidth(0.2)
  doc.line(actX,  cy, actX,  cy + contentH)
  doc.line(logoX, cy, logoX, cy + contentH)

  // ── Zona izquierda: datos del contratista ─────────────────────────────────
  const lx = mg + 6   // 6 mm de padding desde el borde izquierdo
  doc.setTextColor(...DARK)
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
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

  // ── Zona central: ACTIVIDAD ───────────────────────────────────────────────
  const acxC = actX + actW / 2
  const acyC = cy + contentH / 2
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK)
  doc.text('ACTIVIDAD:', acxC, acyC - 3, { align: 'center' })
  doc.setFontSize(8)
  doc.text((d.tipo || 'OBRA CIVIL').toUpperCase(), acxC, acyC + 3,
    { align: 'center', maxWidth: actW - 4 })

  // ── Zona derecha: logo ────────────────────────────────────────────────────
  if (d.logo) {
    try {
      const ext = d.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      const pad = 3
      doc.addImage(d.logo, ext, logoX + pad, cy + pad,
        logoW - pad * 2, contentH - pad * 2, undefined, 'FAST')
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
    // Fila de grupo: azul medio con texto blanco
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
        { content: a.item || '',                              styles: { halign: 'center', fillColor: fill } },
        { content: a.desc || '',                              styles: { halign: 'left',   fillColor: fill } },
        { content: a.und  || '',                              styles: { halign: 'center', fillColor: fill } },
        { content: fmtNum(a.cant),                            styles: { halign: 'right',  fillColor: fill } },
        { content: a.vunit ? `$ ${fmtVal(a.vunit)}` : '—',   styles: { halign: 'right',  fillColor: fill } },
        { content: vt > 0  ? `$ ${fmtVal(vt)}`      : '—',   styles: { halign: 'right',  fillColor: fill } },
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

  // ── C. TOTALES (derecha) ───────────────────────────────────────────────────
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

    // Etiqueta — siempre en negrita
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...tc)
    doc.text(lbl, tx + c1 - 2, ry + rh * 0.68, { align: 'right' })

    // Valor
    doc.text(fmtVal(val), tx + blkW - 2, ry + rh * 0.68, { align: 'right' })
  })

  // Observaciones a la izquierda de los totales
  if (d.observaciones) {
    const obsW = tx - mg - 4
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...SUB)
    doc.text('Observaciones:', mg, y + 4)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
    const lines = doc.splitTextToSize(d.observaciones, obsW)
    doc.text(lines, mg, y + 9)
  }

  // ── D. FIRMAS ──────────────────────────────────────────────────────────────
  const SIGN_BAND = 4
  const signContH = 22
  const sigTotalH = SIGN_BAND * 2 + signContH

  let fy = y + totLines.length * rh + 14
  if (fy + sigTotalH > 272) { doc.addPage(); fy = 20 }

  // Banda superior
  doc.setFillColor(...DARK)
  doc.rect(mg, fy, uw, SIGN_BAND, 'F')

  // Áreas de firma
  const sigW  = uw * 0.36
  const sigLX = mg + uw * 0.06
  const sigRX = W - mg - uw * 0.06 - sigW
  const lineY = fy + SIGN_BAND + 13
  const nameY = fy + SIGN_BAND + 17
  const lblY  = fy + SIGN_BAND + 21

  // Líneas de firma
  doc.setDrawColor(...BORD); doc.setLineWidth(0.3)
  doc.line(sigLX, lineY, sigLX + sigW, lineY)
  doc.line(sigRX, lineY, sigRX + sigW, lineY)

  // Nombres
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK)
  doc.text(d.director    || '—', sigLX + sigW / 2, nameY,
    { align: 'center', maxWidth: sigW })
  doc.text(d.contratista || '—', sigRX + sigW / 2, nameY,
    { align: 'center', maxWidth: sigW })

  // Etiquetas de cargo
  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...SUB)
  doc.text('RECIBE',      sigLX + sigW / 2, lblY, { align: 'center' })
  doc.text('CONTRATISTA', sigRX + sigW / 2, lblY, { align: 'center' })

  // Banda inferior
  doc.setFillColor(...DARK)
  doc.rect(mg, fy + SIGN_BAND + signContH, uw, SIGN_BAND, 'F')

  // ── E. FOOTER discreto ────────────────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    const pH = doc.internal.pageSize.getHeight()
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2)
    doc.line(mg, pH - 9, W - mg, pH - 9)
    doc.setFontSize(6.5); doc.setTextColor(160, 160, 160); doc.setFont('helvetica', 'normal')
    doc.text(`Acta No. ${d.numero}  ·  ${d.contratista || ''}  ·  ${d.cliente || ''}`, mg, pH - 5)
    doc.text(`${p} / ${pages}`, W - mg, pH - 5, { align: 'right' })
  }

  doc.save(filename(d, 'pdf'))
}

// ─────────────────────────────────────────────────────────────────────────────
//  WORD  —  mismo diseño
// ─────────────────────────────────────────────────────────────────────────────
export async function exportWord(d) {
  const pgW     = 11906
  const margins = { top: 700, right: 700, bottom: 700, left: 700 }
  const cW      = pgW - margins.left - margins.right

  const bdrDark = { style: BorderStyle.SINGLE, size: 4, color: '141E32' }
  const bdrThin = { style: BorderStyle.SINGLE, size: 1, color: '505A6E' }
  const noBdr   = { style: BorderStyle.NONE }
  const borders = { top: bdrThin, bottom: bdrThin, left: bdrThin, right: bdrThin }

  const sp = (b = 0, a = 80) => new Paragraph({ spacing: { before: b, after: a } })

  // ── Header: info izquierda + logo derecha ────────────────────────────────
  const leftW  = Math.floor(cW * 0.60)
  const rightW = cW - leftW

  function infoCell() {
    const actaLabel = `N° de Acta: ${d.numero}${d.contrato ? '  (' + d.contrato + ')' : ''}`
    return new TableCell({
      width: { size: leftW, type: WidthType.DXA },
      borders: { top: bdrDark, bottom: bdrDark, left: bdrDark, right: bdrThin },
      margins: { top: 100, bottom: 80, left: 120, right: 80 },
      children: [
        new Paragraph({ children: [new TextRun({ text: (d.contratista||'—').toUpperCase(), bold: true, size: 26, font: 'Arial', color: '141E32' })] }),
        new Paragraph({ children: [new TextRun({ text: `NIT: ${d.nit_c||'—'}`, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: `Fecha: ${fmtFecha(d.fecha)}`, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: actaLabel, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: `Cliente: ${(d.cliente||'—').toUpperCase()}`, bold: true, size: 16, font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: `NIT: ${d.nit_cl||'—'}`, size: 16, font: 'Arial' })] }),
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
        children: [new TextRun({ text: (d.contratista||'').toUpperCase(), bold: true, size: 22, font: 'Arial', color: '141E32' })],
      })],
    })
  }

  const headerTable = new Table({
    width: { size: cW, type: WidthType.DXA }, columnWidths: [leftW, rightW],
    rows: [new TableRow({ children: [infoCell(), logoCell()] })],
  })

  // ── Actividad ────────────────────────────────────────────────────────────
  const actividadPar = new Paragraph({
    spacing: { before: 120, after: 80 },
    children: [new TextRun({ text: `ACTIVIDAD: ${(d.tipo||'OBRA CIVIL').toUpperCase()}`, bold: true, size: 18, font: 'Arial', color: '141E32' })],
  })

  // ── Tabla actividades ────────────────────────────────────────────────────
  const actCols = [700, 4200, 680, 900, 1250, 1250]

  function hdrCell(txt, w) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA },
      borders: { top: bdrDark, bottom: bdrDark, left: bdrThin, right: bdrThin },
      shading: { type: ShadingType.CLEAR, fill: '141E32' },
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
      shading: { type: ShadingType.CLEAR, fill: '2F5496' },   // azul medio
      margins: { top: 60, bottom: 60, left: 120, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: `${gNum}.0     ${(g.nombre||'Sin nombre').toUpperCase()}`, bold: true, size: 17, color: 'FFFFFF', font: 'Arial' })] })],
    })] }))

    g.acts.filter(a => a.desc).forEach((a, ai) => {
      const vt   = Math.round((parseFloat(a.cant)||0) * (parseFloat(a.vunit)||0))
      const fill = ai % 2 === 0 ? 'FFFFFF' : 'F5F6F8'

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

  // ── Totales ──────────────────────────────────────────────────────────────
  const T   = d.totals; const aiu = d.aiu
  const tW  = Math.floor(cW * 0.50)
  const lW  = Math.floor(tW * 0.54)
  const vW  = tW - lW

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
      shading: { type: ShadingType.CLEAR, fill: bold ? '141E32' : 'F5F6F8' },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: lbl, bold: true, size: bold ? 18 : 16, color: bold ? 'FFFFFF' : '141414', font: 'Arial' })] })],
    }),
    new TableCell({
      width: { size: vW, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: bold ? '141E32' : 'FFFFFF' },
      margins: { top: 80, bottom: 80, left: 80, right: 100 },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: val, bold: true, size: bold ? 18 : 16, color: bold ? 'FFFFFF' : '141414', font: 'Arial' })] })],
    }),
  ] }))

  const totTable = new Table({ width: { size: tW, type: WidthType.DXA }, columnWidths: [lW, vW], rows: totRows })

  // ── Firmas ───────────────────────────────────────────────────────────────
  const firmaPar = new Paragraph({
    spacing: { before: 400, after: 0 },
    children: [
      new TextRun({ text: `RECIBE: ${d.director||'—'}`, size: 17, font: 'Arial' }),
      new TextRun({ text: `          ` }),
      new TextRun({ text: `CONTRATISTA: ${d.contratista||'—'}`, size: 17, font: 'Arial' }),
    ],
  })

  // ── Observaciones ─────────────────────────────────────────────────────
  const obsChildren = d.observaciones ? [
    sp(100, 40),
    new Paragraph({ children: [new TextRun({ text: 'Observaciones:', bold: true, size: 16, font: 'Arial', color: '505A6E' })] }),
    new Paragraph({ children: [new TextRun({ text: d.observaciones, size: 16, font: 'Arial' })], spacing: { before: 40, after: 60 } }),
  ] : []

  const docx = new Document({
    sections: [{
      properties: { page: { size: { width: pgW, height: 16838 }, margin: margins } },
      children: [
        headerTable, sp(0, 0),
        actividadPar,
        actTable, sp(0, 80),
        totTable,
        ...obsChildren,
        firmaPar,
      ],
    }],
  })

  const blob = await Packer.toBlob(docx)
  saveAs(blob, filename(d, 'docx'))
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXCEL  —  formato profesional idéntico al PDF (ExcelJS)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportExcel(d) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Actafy'
  const ws   = wb.addWorksheet(`ACTA ${d.numero}`)

  // Sin cuadrícula visible
  ws.views = [{ showGridLines: false }]

  // ── Paleta ─────────────────────────────────────────────────────────────
  const DARK  = '141E32'
  const GRP_C = '2F5496'   // Azul medio — grupos
  const WHITE = 'FFFFFF'
  const LIGHT = 'F5F6F8'
  const BORD  = '50596E'

  // ── Helpers ─────────────────────────────────────────────────────────────
  const bdM  = () => ({ style: 'medium', color: { argb: DARK } })
  const bdT  = () => ({ style: 'thin',   color: { argb: BORD } })
  const bAll = () => ({ top: bdT(), bottom: bdT(), left: bdT(), right: bdT() })
  const fnt  = (bold = false, color = '141414', size = 9) =>
    ({ name: 'Arial', size, bold, color: { argb: color } })
  const bg   = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb } })
  const aln  = (h = 'left', v = 'middle') => ({ horizontal: h, vertical: v })

  // ── Anchos de columna ────────────────────────────────────────────────────
  // 3 zonas header: A:B (info), C:D (actividad), E:F (logo)
  // Tabla: A(item) B(desc) C(und) D(cant) E(precio) F(total)
  ws.columns = [
    { width: 8  },   // A
    { width: 38 },   // B
    { width: 10 },   // C
    { width: 12 },   // D
    { width: 22 },   // E
    { width: 22 },   // F
  ]

  // ── A. HEADER ──────────────────────────────────────────────────────────────
  // Banda superior
  const addFullBand = () => {
    const r  = ws.addRow(['', '', '', '', '', ''])
    const rn = ws.rowCount
    r.height = 6
    ws.mergeCells(`A${rn}:F${rn}`)
    ws.getCell(`A${rn}`).fill = bg(DARK)
  }

  addFullBand()   // ← banda superior

  // 6 filas de contenido
  const hdrRows = [
    { info: (d.contratista || '—').toUpperCase(), bold: true,  size: 12, h: 22 },
    { info: `NIT: ${d.nit_c || '—'}`,              bold: false, size: 9,  h: 14 },
    { info: `Fecha: ${fmtFecha(d.fecha)}`,          bold: false, size: 9,  h: 14 },
    { info: `N° de Acta: ${d.numero}${d.contrato ? '  (' + d.contrato + ')' : ''}`,
                                                    bold: false, size: 9,  h: 14 },
    { info: `Cliente: ${(d.cliente || '—').toUpperCase()}`, bold: true, size: 9, h: 14 },
    { info: `NIT: ${d.nit_cl || '—'}`,              bold: false, size: 9,  h: 14 },
  ]

  const hdrContentStartRow = ws.rowCount + 1   // 1-indexed, primera fila de contenido

  hdrRows.forEach(({ info, bold, size, h }, i) => {
    const row = ws.addRow(['', '', '', '', '', ''])
    const rn  = ws.rowCount
    row.height = h

    ws.mergeCells(`A${rn}:B${rn}`)   // zona info
    ws.mergeCells(`C${rn}:D${rn}`)   // zona actividad
    ws.mergeCells(`E${rn}:F${rn}`)   // zona logo

    const isFirst = i === 0
    const isLast  = i === hdrRows.length - 1

    // Celda info (izquierda)
    const cA = ws.getCell(`A${rn}`)
    cA.value     = info
    cA.font      = fnt(bold, DARK, size)
    cA.alignment = { ...aln('left'), indent: 1 }
    cA.border    = {
      left:   bdM(),
      right:  bdT(),
      top:    isFirst ? bdM() : undefined,
      bottom: isLast  ? bdM() : undefined,
    }

    // Celda actividad (centro) — solo en fila 3 (índice 2)
    const cC = ws.getCell(`C${rn}`)
    cC.border = {
      left:   bdT(),
      right:  bdT(),
      top:    isFirst ? bdM() : undefined,
      bottom: isLast  ? bdM() : undefined,
    }
    if (i === 2) {
      cC.value     = `ACTIVIDAD: ${(d.tipo || 'OBRA CIVIL').toUpperCase()}`
      cC.font      = fnt(true, DARK, 8)
      cC.alignment = aln('center')
    }

    // Celda logo (derecha) — sin contenido; la imagen se superpone
    const cE = ws.getCell(`E${rn}`)
    cE.border = {
      left:   bdT(),
      right:  bdM(),
      top:    isFirst ? bdM() : undefined,
      bottom: isLast  ? bdM() : undefined,
    }
  })

  const hdrContentEndRow = ws.rowCount   // 1-indexed, última fila de contenido

  addFullBand()   // ← banda inferior

  // Logo como imagen superpuesta sobre zona derecha
  if (d.logo) {
    try {
      const b64   = d.logo.includes(',') ? d.logo.split(',')[1] : d.logo
      const ext   = d.logo.startsWith('data:image/png') ? 'png' : 'jpeg'
      const imgId = wb.addImage({ base64: b64, extension: ext })
      ws.addImage(imgId, {
        tl: { col: 4, row: hdrContentStartRow - 1 },   // col E (0-indexed=4), fila inicio
        br: { col: 6, row: hdrContentEndRow },           // col tras F (0-indexed=6), fila fin
        editAs: 'oneCell',
      })
    } catch {}
  }

  ws.addRow([])   // separador

  // ── B. ENCABEZADO DE TABLA ───────────────────────────────────────────────
  const thRow = ws.addRow(['Item', 'Descripción', 'UND', 'Cantidad', 'Precio Unitario', 'Precio Gral.'])
  thRow.height = 20
  thRow.eachCell((cell) => {
    cell.fill      = bg(DARK)
    cell.font      = fnt(true, WHITE)
    cell.border    = bAll()
    cell.alignment = aln('center')
  })

  // ── C. ACTIVIDADES ───────────────────────────────────────────────────────
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
        if (ci === 1 || ci === 3)      cell.alignment = aln('center')
        else if (ci === 4)             { cell.alignment = aln('right'); cell.numFmt = '#,##0.00' }
        else if (ci === 5 || ci === 6) { cell.alignment = aln('right'); cell.numFmt = '#,##0' }
        else                           cell.alignment = aln('left')
      })
      alt = !alt
    })
  })

  ws.addRow([])   // separador

  // ── D. TOTALES (columnas E-F) ────────────────────────────────────────────
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
    const color  = bold ? WHITE : '141414'
    const row    = ws.addRow(['', '', '', '', lbl, val])
    const rn     = ws.rowCount
    row.height   = 18
    ws.mergeCells(`A${rn}:D${rn}`)

    const cL = ws.getCell(`E${rn}`)
    const cV = ws.getCell(`F${rn}`)
    cL.fill      = bg(rowBg);   cV.fill      = bg(rowBg)
    cL.font      = fnt(true, color)   // etiqueta siempre en negrita
    cV.font      = fnt(true, color)
    cL.border    = bAll();      cV.border    = bAll()
    cL.alignment = aln('right'); cV.alignment = aln('right')
    cV.numFmt    = '#,##0'
  })

  // ── E. FIRMAS ────────────────────────────────────────────────────────────
  ws.addRow([])

  // Banda superior de firmas
  const sigBandTop = ws.addRow(['', '', '', '', '', ''])
  const sbtRn = ws.rowCount
  ws.mergeCells(`A${sbtRn}:F${sbtRn}`)
  sigBandTop.height = 8
  ws.getCell(`A${sbtRn}`).fill = bg(DARK)

  // Nombres con línea inferior (simulan línea de firma)
  const sigRow = ws.addRow([d.director || '—', '', '', '', d.contratista || '—', ''])
  const sigRn  = ws.rowCount
  ws.mergeCells(`A${sigRn}:D${sigRn}`)
  ws.mergeCells(`E${sigRn}:F${sigRn}`)
  sigRow.height = 28
  const sA = sigRow.getCell(1)
  const sE = sigRow.getCell(5)
  sA.font      = fnt(true, DARK, 9)
  sA.alignment = aln('center', 'bottom')
  sA.border    = { bottom: { style: 'medium', color: { argb: DARK } } }
  sE.font      = fnt(true, DARK, 9)
  sE.alignment = aln('center', 'bottom')
  sE.border    = { bottom: { style: 'medium', color: { argb: DARK } } }

  // Etiquetas de cargo
  const lblRow = ws.addRow(['RECIBE', '', '', '', 'CONTRATISTA', ''])
  const lblRn  = ws.rowCount
  ws.mergeCells(`A${lblRn}:D${lblRn}`)
  ws.mergeCells(`E${lblRn}:F${lblRn}`)
  lblRow.height = 14
  const lA = lblRow.getCell(1)
  const lE = lblRow.getCell(5)
  lA.font      = fnt(false, '505050', 8)
  lA.alignment = aln('center')
  lE.font      = fnt(false, '505050', 8)
  lE.alignment = aln('center')

  // Banda inferior de firmas
  const sigBandBot = ws.addRow(['', '', '', '', '', ''])
  const sbbRn = ws.rowCount
  ws.mergeCells(`A${sbbRn}:F${sbbRn}`)
  sigBandBot.height = 8
  ws.getCell(`A${sbbRn}`).fill = bg(DARK)

  // ── GUARDAR ──────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename(d, 'xlsx'))
}
