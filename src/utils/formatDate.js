// Format date to DD-MMM-YYYY format (e.g., 30-Jul-2025)

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

export const formatDateTime = (dateString, timeString) => {
  return `${formatDate(dateString)} ${timeString || ''}`;
};

