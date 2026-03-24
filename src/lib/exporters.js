import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, AlignmentType, ShadingType,
} from 'docx'
import { fmtCOP, fmtNum } from './helpers'

// ── Paleta ─────────────────────────────────────────────────────────────────
const DARK   = [20,  30,  50 ]   // Fondo header tabla y grupos
const BORD   = [80,  90, 110 ]   // Bordes tabla
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
  const M = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
             'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${parseInt(dd, 10)}/${parseInt(m, 10).toString().padStart(2,'0')}/${y}`
}

// Formato numérico colombiano sin símbolo $
const fmtVal = (n) => {
  if (!n && n !== 0) return '—'
  return Math.round(n).toLocaleString('es-CO')
}

// ─────────────────────────────────────────────────────────────────────────────
//  PDF  —  réplica exacta del formato Leobani
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPDF(d) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W   = doc.internal.pageSize.getWidth()
  const mg  = 10
  const uw  = W - mg * 2

  // ── A. HEADER ──────────────────────────────────────────────────────────────
  const hdrH  = 38        // altura total del recuadro de cabecera
  const hdrY  = 10
  const leftW = uw * 0.60 // 60% info contratista / 40% logo
  const logoX = mg + leftW
  const logoW = uw - leftW

  // Borde exterior del header
  doc.setDrawColor(...DARK); doc.setLineWidth(0.4)
  doc.rect(mg, hdrY, uw, hdrH)

  // Divisor vertical entre info y logo
  doc.line(logoX, hdrY, logoX, hdrY + hdrH)

  // ── Columna izquierda: datos del contratista + cliente ────────────────────
  const lx = mg + 3
  doc.setTextColor(...DARK)
  doc.setFontSize(13); doc.setFont('helvetica', 'bold')
  doc.text((d.contratista || '—').toUpperCase(), lx, hdrY + 7)

  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
  doc.text(`NIT: ${d.nit_c || '—'}`,           lx, hdrY + 13)
  doc.text(`Fecha: ${fmtFecha(d.fecha)}`,       lx, hdrY + 18)

  // N° acta + contrato
  const actaLabel = `N° de Acta: ${d.numero}${d.contrato ? '  (' + d.contrato + ')' : ''}`
  doc.text(actaLabel,                           lx, hdrY + 23)

  doc.setFont('helvetica', 'bold')
  doc.text(`Cliente: ${(d.cliente || '—').toUpperCase()}`, lx, hdrY + 29)
  doc.setFont('helvetica', 'normal')
  doc.text(`NIT: ${d.nit_cl || '—'}`,           lx, hdrY + 34)

  // ── Columna derecha: logo ─────────────────────────────────────────────────
  if (d.logo) {
    try {
      const ext = d.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      // Centrar logo en el área derecha con padding
      const pad  = 3
      doc.addImage(d.logo, ext, logoX + pad, hdrY + pad, logoW - pad * 2, hdrH - pad * 2, undefined, 'FAST')
    } catch {}
  } else {
    // Sin logo: mostrar nombre centrado
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK)
    doc.text(d.contratista || '—', logoX + logoW / 2, hdrY + hdrH / 2 + 2, { align: 'center', maxWidth: logoW - 4 })
  }

  // ── B. LÍNEA ACTIVIDAD ─────────────────────────────────────────────────────
  let y = hdrY + hdrH + 5
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DARK)
  doc.text(`ACTIVIDAD: ${(d.tipo || 'OBRA CIVIL').toUpperCase()}`, mg, y)
  y += 6

  // ── C. TABLA DE ACTIVIDADES ────────────────────────────────────────────────
  let groupNum = 0
  const rows = []

  d.grupos.forEach((g) => {
    groupNum++
    // Fila de grupo: número + nombre en mayúsculas
    rows.push([{
      content: `${groupNum}.0     ${(g.nombre || 'Sin nombre').toUpperCase()}`,
      colSpan: 6,
      styles: {
        fontStyle:   'bold',
        fontSize:    8,
        fillColor:   DARK,
        textColor:   WHITE,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 3 },
        lineColor:   DARK,
        lineWidth:   0.2,
      },
    }])

    g.acts.filter(a => a.desc).forEach((a, ai) => {
      const vt   = Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0))
      const fill = ai % 2 === 0 ? WHITE : ROW_A
      rows.push([
        { content: a.item || '',           styles: { halign: 'center',  fillColor: fill } },
        { content: a.desc || '',           styles: { halign: 'left',    fillColor: fill } },
        { content: a.und  || '',           styles: { halign: 'center',  fillColor: fill } },
        { content: fmtNum(a.cant),         styles: { halign: 'right',   fillColor: fill } },
        { content: a.vunit ? `$ ${fmtVal(a.vunit)}` : '—', styles: { halign: 'right', fillColor: fill } },
        { content: vt > 0 ? `$ ${fmtVal(vt)}` : '—',      styles: { halign: 'right', fillColor: fill } },
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
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
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
      cellPadding: { top: 3.5, bottom: 3.5, left: 2, right: 2 },
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
    // Sin bordes exteriores raros — usamos los de la tabla
    tableLineColor: BORD,
    tableLineWidth: 0.2,
  })

  y = doc.lastAutoTable.finalY + 6

  // ── D. TOTALES (tabla alineada a la derecha) ───────────────────────────────
  const T    = d.totals
  const aiu  = d.aiu
  const blkW = 95
  const tx   = W - mg - blkW
  const c1   = blkW * 0.54   // ancho columna etiqueta
  const c2   = blkW - c1     // ancho columna valor
  const rh   = 7.5

  const totLines = [
    { lbl: 'Total Bruto',                                 val: T.bruto,  bold: false },
    { lbl: `ADMINISTRACION ${aiu.admin       || 10}%`,    val: T.admV,   bold: false },
    { lbl: `IMPREVISTOS ${aiu.imprevistos    || 3}%`,     val: T.impV,   bold: false },
    { lbl: `UTILIDAD ${aiu.utilidad          || 10}%`,    val: T.utiV,   bold: false },
    { lbl: `IVA ${d.iva                      || 19}%`,    val: T.ivaV,   bold: false },
    { lbl: 'TOTAL',                                       val: T.total,  bold: true  },
  ]

  totLines.forEach(({ lbl, val, bold }, i) => {
    const ry   = y + i * rh
    const fill = bold ? DARK : (i % 2 === 0 ? WHITE : ROW_A)
    const tc   = bold ? WHITE : TEXT

    doc.setFillColor(...fill)
    doc.rect(tx, ry, blkW, rh, 'F')

    // Bordes
    doc.setDrawColor(...BORD); doc.setLineWidth(0.2)
    doc.rect(tx, ry, blkW, rh)
    doc.line(tx + c1, ry, tx + c1, ry + rh) // divisor vertical

    // Texto etiqueta
    doc.setFontSize(7.5)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...tc)
    doc.text(lbl, tx + c1 - 2, ry + rh * 0.68, { align: 'right' })

    // Texto valor
    doc.setFont('helvetica', 'bold')
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

  // ── E. FIRMAS ──────────────────────────────────────────────────────────────
  let fy = y + totLines.length * rh + 12
  if (fy > 270) { doc.addPage(); fy = 20 }

  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...TEXT)
  doc.text(`RECIBE: ${d.director || '—'}`, mg, fy)
  doc.text(`CONTRATISTA: ${d.contratista || '—'}`, W - mg, fy, { align: 'right' })

  // ── F. FOOTER discreto ────────────────────────────────────────────────────
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
    const actaLabel = `N° de Acta: ${d.numero}${d.contrato ? '  ('+d.contrato+')' : ''}`
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
    // Fila de grupo
    actRows.push(new TableRow({ children: [new TableCell({
      columnSpan: 6,
      borders: { top: bdrThin, bottom: bdrThin, left: bdrDark, right: bdrDark },
      shading: { type: ShadingType.CLEAR, fill: '141E32' },
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
    { lbl: 'Total Bruto',                                 val: fmtVal(T.bruto),  bold: false },
    { lbl: `ADMINISTRACION ${aiu.admin       || 10}%`,    val: fmtVal(T.admV),   bold: false },
    { lbl: `IMPREVISTOS ${aiu.imprevistos    || 3}%`,     val: fmtVal(T.impV),   bold: false },
    { lbl: `UTILIDAD ${aiu.utilidad          || 10}%`,    val: fmtVal(T.utiV),   bold: false },
    { lbl: `IVA ${d.iva                      || 19}%`,    val: fmtVal(T.ivaV),   bold: false },
    { lbl: 'TOTAL',                                       val: fmtVal(T.total),  bold: true  },
  ]

  const totRows = totLines.map(({ lbl, val, bold }) => new TableRow({ children: [
    new TableCell({
      width: { size: lW, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: bold ? '141E32' : 'F5F6F8' },
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: lbl, bold, size: bold ? 18 : 16, color: bold ? 'FFFFFF' : '141414', font: 'Arial' })] })],
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
//  EXCEL  —  mismo formato original
// ─────────────────────────────────────────────────────────────────────────────
export function exportExcel(d) {
  const rows = []
  rows.push([(d.contratista||'').toUpperCase(), '', '', '', '', ''])
  rows.push([`NIT: ${d.nit_c||''}`, '', '', '', '', ''])
  rows.push([`Fecha: ${fmtFecha(d.fecha)}`, '', '', '', '', ''])
  rows.push([`N° de Acta: ${d.numero}${d.contrato ? ' ('+d.contrato+')' : ''}`, '', '', '', '', ''])
  rows.push([`Cliente: ${(d.cliente||'').toUpperCase()}`, '', `ACTIVIDAD: ${(d.tipo||'OBRA CIVIL').toUpperCase()}`, '', '', ''])
  rows.push([`NIT: ${d.nit_cl||''}`, '', '', '', '', ''])
  rows.push([''])
  rows.push(['Item', 'Descripción', 'UND', 'Cantidad', 'Precio Unitario', 'Precio Gral.'])

  let gNum = 0
  d.grupos.forEach((g) => {
    gNum++
    rows.push([`${gNum}.0  ${(g.nombre||'').toUpperCase()}`, '', '', '', '', ''])
    g.acts.filter(a => a.desc).forEach((a) => {
      const vt = Math.round((parseFloat(a.cant)||0) * (parseFloat(a.vunit)||0))
      rows.push([a.item, a.desc, a.und, parseFloat(a.cant)||0, parseFloat(a.vunit)||0, vt])
    })
    rows.push([''])
  })

  const T = d.totals; const aiu = d.aiu
  rows.push(['', '', '', '', 'Total Bruto',                          T.bruto])
  rows.push(['', '', '', '', `ADMINISTRACION ${aiu.admin||10}%`,    T.admV ])
  rows.push(['', '', '', '', `IMPREVISTOS ${aiu.imprevistos||3}%`,  T.impV ])
  rows.push(['', '', '', '', `UTILIDAD ${aiu.utilidad||10}%`,       T.utiV ])
  rows.push(['', '', '', '', `IVA ${d.iva||19}%`,                   T.ivaV ])
  rows.push(['', '', '', '', 'TOTAL',                                T.total])
  rows.push([''])
  rows.push([`RECIBE: ${d.director||''}`, '', '', `CONTRATISTA: ${d.contratista||''}`, '', ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 8 }, { wch: 52 }, { wch: 8 }, { wch: 10 }, { wch: 22 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `ACTA #${d.numero}`)
  XLSX.writeFile(wb, filename(d, 'xlsx'))
}
