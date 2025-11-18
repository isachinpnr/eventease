// Combine event date and time string into a full datetime object
// eventDate: Date object
// timeString: String like "12:00" or "14:30"

export const getEventDateTime = (eventDate, timeString) => {
  const date = new Date(eventDate);
  
  // Parse time string (format: "HH:MM" or "HH:MM:SS")
  const timeParts = timeString.split(':');
  const hours = parseInt(timeParts[0], 10) || 0;
  const minutes = parseInt(timeParts[1], 10) || 0;
  const seconds = parseInt(timeParts[2], 10) || 0;
  
  // Set the time on the date
  date.setHours(hours, minutes, seconds, 0);
  
  return date;
};

// Check if event has started (date + time has passed)
export const hasEventStarted = (eventDate, timeString) => {
  const eventDateTime = getEventDateTime(eventDate, timeString);
  const now = new Date();
  
  // Compare full datetime
  return now >= eventDateTime;
};

