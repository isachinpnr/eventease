// Push Notification Service
// Uses Web Push API for browser notifications

// For production, generate VAPID keys using: npx web-push generate-vapid-keys
// Add to .env:
// VAPID_PUBLIC_KEY=your-public-key
// VAPID_PRIVATE_KEY=your-private-key
// VAPID_SUBJECT=mailto:your-email@example.com

let webpush = null;

// Initialize web-push (lazy load)
const initWebPush = async () => {
  if (!webpush) {
    try {
      const webPushModule = await import('web-push');
      webpush = webPushModule.default;
      
      // Set VAPID details if available
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:noreply@eventease.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
      }
    } catch (error) {
      console.error('Failed to initialize web-push:', error);
    }
  }
  return webpush;
};

// Send push notification
export const sendPushNotification = async (subscription, payload) => {
  try {
    const push = await initWebPush();
    
    if (!push) {
      console.log('📱 Push notification (simulated):', payload.title);
      return { success: true, simulated: true };
    }
    
    // Send notification
    await push.sendNotification(subscription, JSON.stringify(payload));
    return { success: true, simulated: false };
  } catch (error) {
    console.error('Push notification error:', error);
    // If push fails, still log it (simulated)
    console.log('📱 Push notification (simulated):', payload.title);
    return { success: false, error: error.message, simulated: true };
  }
};

// Send registration welcome notification
export const sendRegistrationNotification = async (subscription, user) => {
  const payload = {
    title: 'Welcome to EventEase! 🎉',
    body: `Hi ${user.name}, thanks for joining EventEase! Start exploring amazing events now.`,
    icon: '/icon-192x192.png', // You can add your app icon
    badge: '/badge-72x72.png',
    tag: 'registration',
    data: {
      url: '/events',
      type: 'registration'
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore Events'
      }
    ]
  };
  
  return await sendPushNotification(subscription, payload);
};

// Send booking confirmation notification
export const sendBookingConfirmationNotification = async (subscription, booking, event, user) => {
  const userName = user?.name ? `${user.name}, ` : '';
  const payload = {
    title: 'Booking Confirmed! 🎫',
    body: `${userName}Your booking for "${event.title}" is confirmed. ${booking.seats} seat(s) booked.`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: `booking-${booking._id}`,
    data: {
      url: '/dashboard',
      type: 'booking',
      bookingId: booking._id
    },
    actions: [
      {
        action: 'view',
        title: 'View Booking'
      },
      {
        action: 'download',
        title: 'Download PDF'
      }
    ]
  };
  
  return await sendPushNotification(subscription, payload);
};

// Get VAPID public key (for frontend subscription)
export const getVAPIDPublicKey = () => {
  return process.env.VAPID_PUBLIC_KEY || 'DEMO_PUBLIC_KEY';
};

