import PDFDocument from 'pdfkit';
import { formatDate } from './formatDate.js';

// Generate PDF confirmation for booking
export const generateBookingPDF = (booking, event, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Header
      doc.fontSize(24).fillColor('#2563eb').text('EventEase', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).fillColor('#000000').text('Booking Confirmation', { align: 'center' });
      doc.moveDown(2);
      
      // Booking Details
      doc.fontSize(14).fillColor('#1f2937').text('Booking Details:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000000');
      doc.text(`Booking ID: ${booking._id}`, { indent: 20 });
      doc.text(`Booking Date: ${formatDate(booking.bookingDate)}`, { indent: 20 });
      doc.text(`Status: ${booking.status}`, { indent: 20 });
      doc.moveDown();
      
      // Event Details
      doc.fontSize(14).fillColor('#1f2937').text('Event Information:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000000');
      doc.text(`Event: ${event.title}`, { indent: 20 });
      doc.text(`Event ID: ${event.eventId}`, { indent: 20 });
      doc.text(`Date: ${formatDate(event.date)}`, { indent: 20 });
      doc.text(`Time: ${event.time}`, { indent: 20 });
      doc.text(`Location: ${event.location}`, { indent: 20 });
      if (event.venue) {
        doc.text(`Venue: ${event.venue}`, { indent: 20 });
      }
      doc.text(`Category: ${event.category}`, { indent: 20 });
      doc.moveDown();
      
      // User Details
      doc.fontSize(14).fillColor('#1f2937').text('Attendee Information:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000000');
      doc.text(`Name: ${user.name}`, { indent: 20 });
      doc.text(`Email: ${user.email}`, { indent: 20 });
      doc.moveDown();
      
      // Booking Summary
      doc.fontSize(14).fillColor('#1f2937').text('Booking Summary:', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#000000');
      doc.text(`Number of Seats: ${booking.seats}`, { indent: 20 });
      doc.fillColor('#059669').text(`Total Amount: ₹${booking.totalAmount}`, { indent: 20 });
      doc.moveDown(2);
      
      // Footer
      doc.fontSize(10).fillColor('#6b7280').text('Thank you for using EventEase!', { align: 'center' });
      doc.text('This is a computer-generated confirmation.', { align: 'center' });
      doc.text(`Generated on: ${formatDate(new Date())}`, { align: 'center' });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

