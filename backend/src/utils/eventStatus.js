// Determine event status based on date AND time: Upcoming, Ongoing, Completed
import { getEventDateTime } from './eventDateTime.js';

export const getEventStatus = (eventDate, timeString) => {
  // Default time to 00:00 if not provided
  const time = timeString || '00:00';
  
  const now = new Date();
  const eventDateTime = getEventDateTime(eventDate, time);
  
  // Compare full datetime (date + time)
  if (now < eventDateTime) {
    // Current time is before event date/time
    return 'Upcoming';
  } else if (now >= eventDateTime) {
    // Current time is at or after event date/time
    // Check if it's the same day to determine Ongoing vs Completed
    const nowDate = new Date(now);
    const eventDateOnly = new Date(eventDate);
    
    // Reset time to compare only dates
    nowDate.setHours(0, 0, 0, 0);
    eventDateOnly.setHours(0, 0, 0, 0);
    
    if (nowDate.getTime() === eventDateOnly.getTime()) {
      // Same day - event is Ongoing
      return 'Ongoing';
    } else {
      // Different day - event is Completed
      return 'Completed';
    }
  }
};

