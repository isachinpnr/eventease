// Email service - Simulates email sending
// In production, configure with actual SMTP settings

export const sendEmail = async (to, subject, htmlContent, textContent) => {
  try {
    // Simulate email sending (in production, use nodemailer with SMTP)
    console.log('='.repeat(60));
    console.log('📧 EMAIL NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('---');
    console.log(textContent || htmlContent);
    console.log('='.repeat(60));
    
    // In production, uncomment and configure:
    /*
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: to,
      subject: subject,
      html: htmlContent,
      text: textContent,
    });
    */
    
    return { success: true, message: 'Email sent successfully (simulated)' };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send registration welcome email
export const sendRegistrationEmail = async (user) => {
  const subject = 'Welcome to EventEase! 🎉';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to EventEase, ${user.name}!</h1>
      <p>Thank you for registering with EventEase. We're excited to have you on board!</p>
      <p>You can now:</p>
      <ul>
        <li>Browse and discover amazing events</li>
        <li>Book tickets for your favorite events</li>
        <li>Manage all your bookings in one place</li>
      </ul>
      <p>Get started by exploring our events!</p>
      <p>Best regards,<br>The EventEase Team</p>
    </div>
  `;
  const textContent = `Welcome to EventEase, ${user.name}!\n\nThank you for registering. You can now browse events, book tickets, and manage your bookings.\n\nBest regards,\nThe EventEase Team`;
  
  return await sendEmail(user.email, subject, htmlContent, textContent);
};

// Send booking confirmation email
export const sendBookingConfirmationEmail = async (booking, event, user) => {
  const subject = `Booking Confirmation - ${event.title} 🎫`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Booking Confirmed!</h1>
      <p>Dear ${user.name},</p>
      <p>Your booking has been confirmed. Here are the details:</p>
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2>${event.title}</h2>
        <p><strong>Event ID:</strong> ${event.eventId}</p>
        <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        <p><strong>Time:</strong> ${event.time}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Seats:</strong> ${booking.seats}</p>
        <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        <p><strong>Booking ID:</strong> ${booking._id}</p>
      </div>
      <p>We look forward to seeing you at the event!</p>
      <p>Best regards,<br>The EventEase Team</p>
    </div>
  `;
  const textContent = `Booking Confirmed!\n\nDear ${user.name},\n\nYour booking for "${event.title}" has been confirmed.\n\nEvent Details:\n- Date: ${new Date(event.date).toLocaleDateString()}\n- Time: ${event.time}\n- Seats: ${booking.seats}\n- Total: ₹${booking.totalAmount}\n\nBooking ID: ${booking._id}\n\nBest regards,\nThe EventEase Team`;
  
  return await sendEmail(user.email, subject, htmlContent, textContent);
};

