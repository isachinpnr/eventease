// Custom middleware to log each new booking with user and timestamp info

export const bookingLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Only log successful bookings (status 200 or 201)
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const bookingData = JSON.parse(data);
        // Check if this is a booking response (has _id and event field)
        if (bookingData._id && bookingData.event) {
          const eventId = typeof bookingData.event === 'object' 
            ? bookingData.event._id || bookingData.event.title 
            : bookingData.event;
          
          const logEntry = {
            timestamp: new Date().toISOString(),
            userId: req.user ? req.user._id.toString() : 'Unknown',
            userEmail: req.user ? req.user.email : 'Unknown',
            eventId: eventId,
            seats: bookingData.seats || 'Unknown',
            bookingId: bookingData._id || 'Unknown'
          };
          
          console.log('=== NEW BOOKING LOG ===');
          console.log(JSON.stringify(logEntry, null, 2));
          console.log('======================');
        }
      } catch (error) {
        // If parsing fails, just continue
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

