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
const N      = [22,  45,  75 ]   // Navy: texto oscuro y headers
const N_MED  = [42,  82, 132 ]   // Navy medio: acento secundario
const N_L    = [236, 242, 250]   // Navy muy claro: fondo grupo tabla
const GR_L   = [248, 249, 251]   // Gris claro: fila alterna
const GR_M   = [210, 218, 228]   // Gris medio: bordes suaves
const VE     = [22,  101, 52 ]   // Verde: solo TOTAL FINAL
const TX     = [22,  30,  46 ]   // Texto principal
const SUB    = [108, 118, 134]   // Texto subtítulo/etiqueta
const WHITE  = [255, 255, 255]

// ── Helpers ─────────────────────────────────────────────────────────────────
const filename = (d, ext) =>
  `Acta_No${d.numero}_${(d.contratista || 'acta').replace(/\s+/g, '_')}.${ext}`

const fmtFecha = (str) => {
  if (!str) return '—'
  const [y, m, dd] = str.split('-')
  const M = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
             'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  return `${parseInt(dd, 10)} de ${M[parseInt(m, 10) - 1] || ''} de ${y}`
}

// ─────────────────────────────────────────────────────────────────────────────
//  PDF  —  documento de obra colombiano: letterhead + diseño corporativo
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPDF(d) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W  = doc.internal.pageSize.getWidth()   // 210 mm
  const mg = 14
  const uw = W - mg * 2

  // ── A. LETTERHEAD (zona blanca con logo y datos del contratista) ──────────
  const LH = 26   // altura zona letterhead
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, W, LH, 'F')

  // Barra de acento izquierda (4 mm) — marca corporativa
  doc.setFillColor(...N)
  doc.rect(0, 0, 4, LH, 'F')

  // Logo: cuadrado 22×22 mm, alineado a la barra izquierda
  if (d.logo) {
    try {
      const ext = d.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG'
      doc.addImage(d.logo, ext, 7, 2, 22, 22)
    } catch {}
  }

  // Nombre de la empresa contratista
  const nameX = d.logo ? 33 : 9
  doc.setTextColor(...TX)
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text(d.contratista || '—', nameX, 10, { maxWidth: W / 2 - nameX })

  // NIT y representante debajo del nombre
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...SUB)
  doc.text(`NIT: ${d.nit_c || '—'}`, nameX, 16)
  if (d.representante) doc.text(d.representante, nameX, 21)

  // Fecha y ciudad en la esquina superior derecha
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...SUB)
  doc.text(fmtFecha(d.fecha), W - mg, 11, { align: 'right' })
  if (d.ciudad) doc.text(d.ciudad, W - mg, 17, { align: 'right' })

  // Línea divisoria suave entre letterhead y título
  doc.setDrawColor(...GR_M); doc.setLineWidth(0.3)
  doc.line(mg, LH, W - mg, LH)

  // ── B. BANDA DE TÍTULO (navy sólido) ──────────────────────────────────────
  const TH = 11  // altura banda título
  doc.setFillColor(...N)
  doc.rect(0, LH, W, TH, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold')
  doc.text('ACTA DE OBRA', mg + 2, LH + 7.5)

  // Número resaltado a la derecha
  doc.setFontSize(10.5); doc.setFont('helvetica', 'bold')
  doc.text(`No. ${d.numero}`, W - mg, LH + 7.5, { align: 'right' })

  // ── C. FRANJA DE META (Obra | Contrato | Periodo) ─────────────────────────
  const metaY = LH + TH + 1
  const metaH = 11
  const metaItems = [
    ['OBRA / PROYECTO', d.obra     || '—'],
    ['NO. CONTRATO',    d.contrato || '—'],
    ['PERIODO',         d.periodo  || '—'],
  ]
  const mW = uw / metaItems.length

  metaItems.forEach(([lbl, val], i) => {
    const x = mg + i * mW
    // Separador vertical entre celdas
    if (i > 0) {
      doc.setDrawColor(...GR_M); doc.setLineWidth(0.2)
      doc.line(x, metaY, x, metaY + metaH)
    }
    doc.setFillColor(...GR_L)
    doc.rect(x, metaY, mW - (i < metaItems.length - 1 ? 0 : 0), metaH, 'F')
    doc.setFontSize(5.8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...SUB)
    doc.text(lbl, x + 3, metaY + 4)
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...TX)
    doc.text(String(val), x + 3, metaY + 9.5, { maxWidth: mW - 6 })
  })
  // Borde exterior de la franja
  doc.setDrawColor(...GR_M); doc.setLineWidth(0.25)
  doc.rect(mg, metaY, uw, metaH)

  // ── D. PARTES DEL CONTRATO ────────────────────────────────────────────────
  let y = metaY + metaH + 4
  const halfW = uw / 2

  // Micro-etiqueta de sección
  doc.setFontSize(5.8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...SUB)
  doc.text('PARTES DEL CONTRATO', mg, y + 0.5)
  doc.setDrawColor(...GR_M); doc.setLineWidth(0.15)
  doc.line(mg + 38, y, mg + uw, y)
  y += 3.5

  // Encabezados de columna (navy)
  doc.setFillColor(...N)
  doc.rect(mg,           y, halfW - 0.5, 6.5, 'F')
  doc.rect(mg + halfW,   y, halfW,       6.5, 'F')
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
  doc.text('CONTRATANTE', mg + halfW / 2 - 0.3,  y + 4.5, { align: 'center' })
  doc.text('CONTRATISTA', mg + halfW + halfW / 2, y + 4.5, { align: 'center' })
  y += 6.5

  // Filas de datos
  const leftD  = [d.cliente || '—', `NIT: ${d.nit_cl || '—'}`, `Dir. de Obra: ${d.director || '—'}`]
  const rightD = [d.contratista || '—', `NIT: ${d.nit_c || '—'}`, `Rep. Legal: ${d.representante || '—'}`]
  const boldR  = [true, false, false]
  const rh     = 5.8

  leftD.forEach((txt, i) => {
    const ry   = y + i * rh
    const fill = i % 2 === 0 ? WHITE : [250, 251, 253]
    doc.setFillColor(...fill)
    doc.rect(mg,         ry, halfW - 0.5, rh, 'F')
    doc.rect(mg + halfW, ry, halfW,       rh, 'F')
    // Divisor vertical
    doc.setDrawColor(...GR_M); doc.setLineWidth(0.15)
    doc.line(mg + halfW, ry, mg + halfW, ry + rh)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', boldR[i] ? 'bold' : 'normal')
    doc.setTextColor(...TX)
    doc.text(txt,       mg + 3,         ry + 4)
    doc.text(rightD[i], mg + halfW + 3, ry + 4)
  })
  // Borde exterior partes
  doc.setDrawColor(...GR_M); doc.setLineWidth(0.25)
  doc.rect(mg, y, uw, leftD.length * rh)

  y += leftD.length * rh + 5

  // ── E. TABLA DE ACTIVIDADES ───────────────────────────────────────────────
  doc.setFontSize(5.8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...SUB)
  doc.text('RELACIÓN DE ACTIVIDADES EJECUTADAS', mg, y + 0.5)
  doc.setDrawColor(...GR_M); doc.setLineWidth(0.15)
  doc.line(mg + 67, y, mg + uw, y)
  y += 4

  const rows = []
  d.grupos.forEach((g) => {
    rows.push([{
      content: g.nombre || 'Sin nombre',
      colSpan: 6,
      styles: {
        fontStyle: 'bold', fontSize: 7.5,
        fillColor: N_L, textColor: N,
        cellPadding: { top: 3, bottom: 3, left: 4, right: 3 },
      },
    }])
    g.acts.filter(a => a.desc).forEach((a) => {
      const vt = Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0))
      rows.push([a.item, a.desc, a.und, fmtNum(a.cant), fmtCOP(a.vunit), fmtCOP(vt)])
    })
  })

  autoTable(doc, {
    startY: y,
    head: [['Ítem', 'Descripción de la actividad', 'Und', 'Cantidad', 'V. Unitario', 'V. Total']],
    body: rows,
    margin: { left: mg, right: mg },
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      lineColor: GR_M,
      lineWidth: 0.15,
      textColor: TX,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: N_MED,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 2.5, right: 2.5 },
    },
    alternateRowStyles: { fillColor: GR_L },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 13, halign: 'center' },
      3: { cellWidth: 19, halign: 'right' },
      4: { cellWidth: 29, halign: 'right' },
      5: { cellWidth: 29, halign: 'right' },
    },
  })

  y = doc.lastAutoTable.finalY + 5

  // ── F. RESUMEN FINANCIERO ─────────────────────────────────────────────────
  const T    = d.totals
  const aiu  = d.aiu
  const blkW = 78
  const tx2  = W - mg - blkW
  const rowH = 7

  // Micro-etiqueta
  doc.setFontSize(5.8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...SUB)
  doc.text('RESUMEN FINANCIERO', tx2, y - 1)

  const totLines = [
    { lbl: 'Subtotal actividades',                    val: T.bruto },
    { lbl: `Administración ${aiu.admin       || 10}%`, val: T.admV  },
    { lbl: `Imprevistos ${aiu.imprevistos    || 3}%`,  val: T.impV  },
    { lbl: `Utilidad ${aiu.utilidad          || 10}%`, val: T.utiV  },
    { lbl: `IVA ${d.iva || 19}% sobre AIU`,            val: T.ivaV  },
  ]

  totLines.forEach(({ lbl, val }, i) => {
    const ry = y + i * rowH
    doc.setFillColor(i % 2 === 0 ? 248 : 243, i % 2 === 0 ? 250 : 247, i % 2 === 0 ? 253 : 251)
    doc.rect(tx2, ry, blkW, rowH, 'F')
    doc.setDrawColor(...GR_M); doc.setLineWidth(0.1)
    doc.line(tx2, ry + rowH, tx2 + blkW, ry + rowH)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...SUB)
    doc.text(lbl, tx2 + 3, ry + 4.8)
    doc.setTextColor(...TX); doc.setFont('helvetica', 'bold')
    doc.text(fmtCOP(val), tx2 + blkW - 3, ry + 4.8, { align: 'right' })
  })

  // Fila TOTAL FINAL
  const tyF  = y + totLines.length * rowH
  const totH = 10
  doc.setFillColor(...VE)
  doc.rect(tx2, tyF, blkW, totH, 'F')
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...WHITE)
  doc.text('TOTAL FINAL',   tx2 + 3,         tyF + 6.8)
  doc.text(fmtCOP(T.total), tx2 + blkW - 3,  tyF + 6.8, { align: 'right' })

  // Borde exterior bloque totales
  doc.setDrawColor(...GR_M); doc.setLineWidth(0.2)
  doc.rect(tx2, y, blkW, totLines.length * rowH)

  // Observaciones (columna izquierda, junto a totales)
  if (d.observaciones) {
    const obsW = tx2 - mg - 5
    doc.setFontSize(5.8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...SUB)
    doc.text('OBSERVACIONES', mg, y - 1)
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...TX)
    const lines = doc.splitTextToSize(d.observaciones, obsW)
    doc.text(lines, mg, y + 5)
  }

  // ── G. FIRMAS ─────────────────────────────────────────────────────────────
  let fy = tyF + totH + 14
  if (fy > 262) { doc.addPage(); fy = 20 }

  const sigW  = 72
  const sigH  = 18
  const lxS   = mg + 6
  const rxS   = W - mg - 6 - sigW

  // Cajas de firma (fondo muy sutil)
  doc.setFillColor(...GR_L)
  doc.rect(lxS, fy,  sigW, sigH, 'F')
  doc.rect(rxS, fy,  sigW, sigH, 'F')

  // Borde alrededor de las cajas
  doc.setDrawColor(...GR_M); doc.setLineWidth(0.2)
  doc.rect(lxS, fy, sigW, sigH)
  doc.rect(rxS, fy, sigW, sigH)

  // Línea de firma (navy)
  doc.setDrawColor(...N); doc.setLineWidth(0.5)
  doc.line(lxS + 6, fy + 12, lxS + sigW - 6, fy + 12)
  doc.line(rxS + 6, fy + 12, rxS + sigW - 6, fy + 12)

  // Nombre (encima de la línea, pequeño)
  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...SUB)
  doc.text(d.contratista || '—', lxS + sigW / 2, fy + 5,  { align: 'center', maxWidth: sigW - 12 })
  doc.text(d.director    || '—', rxS + sigW / 2, fy + 5,  { align: 'center', maxWidth: sigW - 12 })

  // Rol (debajo de la línea, bold navy)
  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...N)
  doc.text('CONTRATISTA',      lxS + sigW / 2, fy + 16, { align: 'center' })
  doc.text('DIRECTOR DE OBRA', rxS + sigW / 2, fy + 16, { align: 'center' })

  // ── H. FOOTER (banda navy sólida) ─────────────────────────────────────────
  const pages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p)
    const pH = doc.internal.pageSize.getHeight()
    doc.setFillColor(...N)
    doc.rect(0, pH - 9, W, 9, 'F')
    // Acento izquierdo (mismo que letterhead)
    doc.setFillColor(...N_MED)
    doc.rect(0, pH - 9, 4, 9, 'F')
    doc.setFontSize(6.5); doc.setTextColor(...WHITE); doc.setFont('helvetica', 'normal')
    doc.text(
      `Acta No. ${d.numero}  ·  ${d.contratista || ''}  ·  ${d.cliente || ''}`,
      8, pH - 3.5
    )
    doc.text(`Pág. ${p} / ${pages}`, W - mg, pH - 3.5, { align: 'right' })
  }

  doc.save(filename(d, 'pdf'))
}

// ─────────────────────────────────────────────────────────────────────────────
//  WORD  —  mismo diseño corporativo
// ─────────────────────────────────────────────────────────────────────────────
export async function exportWord(d) {
  const pgW     = 11906
  const margins = { top: 900, right: 900, bottom: 900, left: 900 }
  const cW      = pgW - margins.left - margins.right

  const bdr  = { style: BorderStyle.SINGLE, size: 1, color: 'D0D8E4' }
  const noBdr = { style: BorderStyle.NONE }
  const borders     = { top: bdr, bottom: bdr, left: bdr, right: bdr }
  const noBorders   = { top: noBdr, bottom: noBdr, left: noBdr, right: noBdr }
  const bottomOnly  = { top: noBdr, left: noBdr, right: noBdr, bottom: { style: BorderStyle.SINGLE, size: 6, color: '1B3A5C' } }

  const sp = (before = 0, after = 80) =>
    new Paragraph({ spacing: { before, after } })

  // Celdas genéricas
  function cell(txt, { align = AlignmentType.LEFT, w = 700, fill = 'FFFFFF', bold = false, size = 16, color = '111111', pad = {} } = {}) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill },
      margins: { top: 60, bottom: 60, left: 100, right: 80, ...pad },
      children: [new Paragraph({
        alignment: align,
        children: [new TextRun({ text: String(txt ?? '—'), bold, size, color, font: 'Arial' })],
      })],
    })
  }

  function hdrCell(txt, w) {
    return new TableCell({
      width: { size: w, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: '1B3A5C' },
      margins: { top: 80, bottom: 80, left: 100, right: 80 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: txt, bold: true, color: 'FFFFFF', size: 16, font: 'Arial' })],
      })],
    })
  }

  // ── Encabezado principal ──────────────────────────────────────────────────
  const headerTable = new Table({
    width: { size: cW, type: WidthType.DXA },
    columnWidths: [cW],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: cW, type: WidthType.DXA }, borders: noBorders,
      shading: { type: ShadingType.CLEAR, fill: '1B3A5C' },
      margins: { top: 200, bottom: 200, left: 200, right: 200 },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'ACTA DE OBRA', bold: true, color: 'FFFFFF', size: 28, font: 'Arial' })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `No. ${d.numero}  ·  ${fmtFecha(d.fecha)}`, color: 'B8CCDF', size: 18, font: 'Arial' })],
        }),
      ],
    })] })],
  })

  // ── Fila de meta (Obra | Contrato | Periodo) ──────────────────────────────
  const metaW = Math.floor(cW / 3)
  function metaCell(lbl, val) {
    return new TableCell({
      width: { size: metaW, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: 'F8FAFB' },
      margins: { top: 60, bottom: 80, left: 120, right: 80 },
      children: [
        new Paragraph({ children: [new TextRun({ text: lbl, bold: true, size: 13, color: '888888', font: 'Arial' })] }),
        new Paragraph({ children: [new TextRun({ text: String(val || '—'), size: 17, font: 'Arial' })] }),
      ],
    })
  }
  const metaTable = new Table({
    width: { size: cW, type: WidthType.DXA }, columnWidths: [metaW, metaW, metaW],
    rows: [new TableRow({ children: [
      metaCell('OBRA / PROYECTO', d.obra),
      metaCell('No. CONTRATO',    d.contrato),
      metaCell('PERIODO',         d.periodo),
    ] })],
  })

  // ── Partes (CONTRATANTE | CONTRATISTA) ───────────────────────────────────
  const partW = Math.floor(cW / 2)

  function parteHdr(txt) {
    return new TableCell({
      width: { size: partW, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill: '1B3A5C' },
      margins: { top: 80, bottom: 80, left: 120, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: txt, bold: true, color: 'FFFFFF', size: 17, font: 'Arial' })] })],
    })
  }
  function parteCell(txt, bold = false, fill = 'FFFFFF') {
    return new TableCell({
      width: { size: partW, type: WidthType.DXA }, borders,
      shading: { type: ShadingType.CLEAR, fill },
      margins: { top: 60, bottom: 60, left: 120, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: String(txt || '—'), bold, size: bold ? 18 : 16, font: 'Arial' })] })],
    })
  }
  const partesTable = new Table({
    width: { size: cW, type: WidthType.DXA }, columnWidths: [partW, partW],
    rows: [
      new TableRow({ children: [parteHdr('CONTRATANTE'), parteHdr('CONTRATISTA')] }),
      new TableRow({ children: [parteCell(d.cliente, true), parteCell(d.contratista, true)] }),
      new TableRow({ children: [parteCell(`NIT: ${d.nit_cl || '—'}`, false, 'F8FAFB'), parteCell(`NIT: ${d.nit_c || '—'}`, false, 'F8FAFB')] }),
      new TableRow({ children: [parteCell(`Dir. Obra: ${d.director || '—'}`), parteCell(`Rep.: ${d.representante || '—'}`)] }),
    ],
  })

  // ── Tabla de actividades ──────────────────────────────────────────────────
  const actCols = [700, 4300, 680, 920, 1200, 1200]
  const actRows = [new TableRow({ children: [
    hdrCell('Ítem',        actCols[0]),
    hdrCell('Descripción', actCols[1]),
    hdrCell('Und',         actCols[2]),
    hdrCell('Cant.',       actCols[3]),
    hdrCell('V. Unitario', actCols[4]),
    hdrCell('V. Total',    actCols[5]),
  ], tableHeader: true })]

  d.grupos.forEach((g, gi) => {
    actRows.push(new TableRow({ children: [new TableCell({
      columnSpan: 6, borders,
      shading: { type: ShadingType.CLEAR, fill: 'EBF2FB' },
      margins: { top: 60, bottom: 60, left: 120, right: 80 },
      children: [new Paragraph({ children: [new TextRun({ text: g.nombre || `Grupo ${gi + 1}`, bold: true, size: 17, color: '1B3A5C', font: 'Arial' })] })],
    })] }))
    g.acts.filter(a => a.desc).forEach((a, ai) => {
      const vt   = Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0))
      const fill = ai % 2 === 0 ? 'FFFFFF' : 'F8FAFB'
      actRows.push(new TableRow({ children: [
        cell(a.item,          { align: AlignmentType.CENTER, w: actCols[0], fill }),
        cell(a.desc,          { align: AlignmentType.LEFT,   w: actCols[1], fill }),
        cell(a.und,           { align: AlignmentType.CENTER, w: actCols[2], fill }),
        cell(fmtNum(a.cant),  { align: AlignmentType.RIGHT,  w: actCols[3], fill }),
        cell(fmtCOP(a.vunit), { align: AlignmentType.RIGHT,  w: actCols[4], fill }),
        cell(fmtCOP(vt),      { align: AlignmentType.RIGHT,  w: actCols[5], fill }),
      ] }))
    })
  })
  const actTable = new Table({ width: { size: cW, type: WidthType.DXA }, columnWidths: actCols, rows: actRows })

  // ── Resumen financiero ────────────────────────────────────────────────────
  const T   = d.totals; const aiu = d.aiu
  const tW  = Math.floor(cW * 0.46)
  const lW  = Math.floor(tW * 0.55)
  const vW2 = tW - lW

  const totLines = [
    [`Subtotal`,                                fmtCOP(T.bruto), false],
    [`Administración ${aiu.admin       || 10}%`, fmtCOP(T.admV), false],
    [`Imprevistos ${aiu.imprevistos    || 3}%`,  fmtCOP(T.impV), false],
    [`Utilidad ${aiu.utilidad          || 10}%`, fmtCOP(T.utiV), false],
    [`IVA ${d.iva                      || 19}%`, fmtCOP(T.ivaV), false],
    ['TOTAL FINAL',                              fmtCOP(T.total), true],
  ]

  const totRows2 = totLines.map(([lbl, val, isTot]) =>
    new TableRow({ children: [
      new TableCell({
        width: { size: lW, type: WidthType.DXA }, borders,
        shading: { type: ShadingType.CLEAR, fill: isTot ? '1A6B35' : 'F4F7FB' },
        margins: { top: 80, bottom: 80, left: 120, right: 60 },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: lbl, bold: isTot, size: isTot ? 19 : 16, color: isTot ? 'FFFFFF' : '666666', font: 'Arial' })] })],
      }),
      new TableCell({
        width: { size: vW2, type: WidthType.DXA }, borders,
        shading: { type: ShadingType.CLEAR, fill: isTot ? '1A6B35' : 'FFFFFF' },
        margins: { top: 80, bottom: 80, left: 60, right: 120 },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: val, bold: isTot, size: isTot ? 20 : 16, color: isTot ? 'FFFFFF' : '111111', font: 'Arial' })] })],
      }),
    ] })
  )
  const totTable = new Table({ width: { size: tW, type: WidthType.DXA }, columnWidths: [lW, vW2], rows: totRows2 })

  // ── Firmas ────────────────────────────────────────────────────────────────
  const sigW = Math.floor((cW - 600) / 2)
  function sigCell(name, role) {
    return new TableCell({
      width: { size: sigW, type: WidthType.DXA }, borders: bottomOnly,
      margins: { top: 800, bottom: 100, left: 80, right: 80 },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: name || '—', size: 16, font: 'Arial' })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: role, bold: true, size: 16, color: '1B3A5C', font: 'Arial' })] }),
      ],
    })
  }
  function spacerCell() {
    return new TableCell({
      width: { size: 600, type: WidthType.DXA }, borders: noBorders,
      children: [new Paragraph({})],
    })
  }
  const sigTable = new Table({
    width: { size: cW, type: WidthType.DXA }, columnWidths: [sigW, 600, sigW],
    rows: [new TableRow({ children: [
      sigCell(d.contratista, 'CONTRATISTA'),
      spacerCell(),
      sigCell(d.director,    'DIRECTOR DE OBRA'),
    ] })],
  })

  // ── Armado del documento ──────────────────────────────────────────────────
  const obsChildren = d.observaciones ? [
    sp(120, 60),
    new Paragraph({ children: [new TextRun({ text: 'Observaciones:', bold: true, size: 16, color: '888888', font: 'Arial' })] }),
    new Paragraph({ children: [new TextRun({ text: d.observaciones, size: 16, font: 'Arial' })], spacing: { before: 40, after: 60 } }),
  ] : []

  const docx = new Document({
    sections: [{
      properties: { page: { size: { width: pgW, height: 16838 }, margin: margins } },
      children: [
        headerTable, sp(0, 80),
        metaTable,   sp(0, 80),
        partesTable, sp(0, 100),
        actTable,    sp(0, 80),
        totTable,
        ...obsChildren,
        sp(120, 0),
        sigTable,
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
  rows.push([d.contratista, '', '', '', '', ''])
  rows.push([`NIT: ${d.nit_c}`, '', '', '', '', ''])
  rows.push([`Fecha: ${fmtFecha(d.fecha)}`, '', '', '', '', ''])
  rows.push([`Acta No. ${d.numero}`, '', '', '', '', ''])
  rows.push([`Cliente: ${d.cliente}`, '', `Actividad: ${d.tipo || 'Obra Civil'}`, '', '', ''])
  rows.push([`NIT: ${d.nit_cl}`, '', '', '', '', ''])
  rows.push([''])
  rows.push(['Ítem', 'Descripción', 'UND', 'Cantidad', 'Precio Unitario', 'Total'])

  d.grupos.forEach((g) => {
    rows.push([g.nombre, '', '', '', '', ''])
    g.acts.filter(a => a.desc).forEach((a) => {
      rows.push([
        a.item, a.desc, a.und,
        parseFloat(a.cant) || 0,
        parseFloat(a.vunit) || 0,
        Math.round((parseFloat(a.cant) || 0) * (parseFloat(a.vunit) || 0)),
      ])
    })
    rows.push([''])
  })

  const T = d.totals; const aiu = d.aiu
  rows.push(['', '', '', '', 'Subtotal',                          T.bruto])
  rows.push(['', '', '', '', `Administración ${aiu.admin || 10}%`, T.admV])
  rows.push(['', '', '', '', `Imprevistos ${aiu.imprevistos || 3}%`, T.impV])
  rows.push(['', '', '', '', `Utilidad ${aiu.utilidad || 10}%`,   T.utiV])
  rows.push(['', '', '', '', `IVA ${d.iva || 19}%`,               T.ivaV])
  rows.push(['', '', '', '', 'TOTAL FINAL',                       T.total])
  rows.push([''])
  rows.push([`Contratista: ${d.contratista}`, '', '', `Director de obra: ${d.director}`, '', ''])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 8 }, { wch: 52 }, { wch: 8 }, { wch: 10 }, { wch: 22 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `ACTA #${d.numero}`)
  XLSX.writeFile(wb, filename(d, 'xlsx'))
}
