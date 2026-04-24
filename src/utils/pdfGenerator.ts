import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Order } from '@/types/order';

// Extender el tipo jsPDF para incluir autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

export interface TicketData {
  noteNumber: string;
  date: string;
  branchName: string;
  branchAddress: string;
  patientName: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  discount?: number;
}

export const generateTicketPDF = (data: TicketData) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200] // Formato ticket (80mm ancho)
  }) as jsPDFWithAutoTable;

  const width = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('OPTICAS VISIÓN 2000', width / 2, 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sucursal: ${data.branchName}`, width / 2, 15, { align: 'center' });
  
  // Dividir dirección si es muy larga
  const addressLines = doc.splitTextToSize(data.branchAddress, 70);
  doc.text(addressLines, width / 2, 19, { align: 'center' });
  
  const headerBottomY = 19 + (addressLines.length * 3);
  doc.text('------------------------------------------', width / 2, headerBottomY, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`FOLIO: ${data.noteNumber}`, 5, headerBottomY + 7);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${format(new Date(data.date), 'Pp', { locale: es })}`, 5, headerBottomY + 12);
  doc.text(`Paciente: ${data.patientName}`, 5, headerBottomY + 16);
  doc.text('------------------------------------------', width / 2, headerBottomY + 20, { align: 'center' });

  // Items Table
  const tableRows = data.items.map(item => [
    `${item.quantity}x ${item.name}`,
    `$${item.price.toFixed(2)}`,
    `$${item.subtotal.toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: headerBottomY + 24,
    head: [['Descripción', 'Precio', 'Subt.']],
    body: tableRows,
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1 },
    headStyles: { fontStyle: 'bold', borderBottom: 0.1 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 15 },
      2: { halign: 'right', cellWidth: 15 }
    },
    margin: { left: 5, right: 5 }
  });

  // @ts-ignore
  const lastY = doc.lastAutoTable?.finalY || 80;
  const finalY = lastY + 5;

  // Totals
  doc.setFontSize(8);
  doc.text(`Subtotal:`, 45, finalY);
  doc.text(`$${data.subtotal.toFixed(2)}`, 75, finalY, { align: 'right' });

  let currentY = finalY + 4;
  
  if (data.discount && data.discount > 0) {
    doc.text(`Descuento:`, 45, currentY);
    doc.text(`-$${data.discount.toFixed(2)}`, 75, currentY, { align: 'right' });
    currentY += 4;
  }
  
  doc.text(`IVA (16%):`, 45, currentY);
  doc.text(`$${data.tax.toFixed(2)}`, 75, currentY, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:`, 45, currentY + 6);
  doc.text(`$${data.total.toFixed(2)}`, 75, currentY + 6, { align: 'right' });

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('¡Gracias por su preferencia!', width / 2, currentY + 16, { align: 'center' });
  doc.text('Conserve este ticket para cualquier aclaración.', width / 2, currentY + 20, { align: 'center' });

  return doc;
};

export const downloadTicketPDF = (data: TicketData) => {
  const doc = generateTicketPDF(data);
  doc.save(`${data.noteNumber}.pdf`);
};

export const shareTicketPDF = async (data: TicketData) => {
  const doc = generateTicketPDF(data);
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], `${data.noteNumber}.pdf`, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Ticket ${data.noteNumber}`,
        text: `Hola, adjunto el ticket de tu compra en Lumina Clinic Hub.`
      });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  } else {
    // Si no soporta compartir archivos, descargamos como fallback
    doc.save(`${data.noteNumber}.pdf`);
    return false;
  }
};

export const generateLabReportPDF = (orders: Order[], branchNames: Record<string, string>) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  }) as jsPDFWithAutoTable;

  const width = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE PEDIDOS A LABORATORIO', width / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${format(new Date(), 'PPP', { locale: es })}`, width / 2, 22, { align: 'center' });
  
  const statusLabels: Record<string, string> = {
    "PENDING": "Pendiente",
    "IN_PROGRESS": "En Laboratorio",
    "READY": "Listo",
    "DELIVERED": "Entregado",
    "CANCELLED": "Cancelado"
  };

  const tableRows = orders.map(order => [
    format(new Date(order.orderDate), 'dd/MM HH:mm'),
    order.patientName,
    `${order.frameModel}\n(${order.lensType})`,
    `OD: ${order.prescription.sphereOd}/${order.prescription.cylinderOd}/${order.prescription.axisOd}°\nOI: ${order.prescription.sphereOi}/${order.prescription.cylinderOi}/${order.prescription.axisOi}°\nDIP: ${order.prescription.pupillaryDistance}mm`,
    branchNames[order.branchId] || "Sucursal Local",
    statusLabels[order.status] || order.status
  ]);

  autoTable(doc, {
    startY: 30,
    head: [['Fecha', 'Paciente', 'Armazón / Mica', 'Graduación / DIP', 'Sucursal', 'Estado']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [6, 182, 212], textColor: 255, fontStyle: 'bold' }, // Cyan accent color
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 40 },
      2: { cellWidth: 50 },
      3: { cellWidth: 60 },
      4: { cellWidth: 40 },
      5: { cellWidth: 30 }
    }
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, width - 20, doc.internal.pageSize.getHeight() - 10);
  }

  return doc;
};
