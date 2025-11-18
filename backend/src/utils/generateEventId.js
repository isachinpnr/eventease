// Generate custom event ID: EVT-[MMM][YYYY]-[Random3]
// Example: EVT-AUG2025-X4T

export const generateEventId = () => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const now = new Date();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  
  // Generate random 3-character alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 3; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `EVT-${month}${year}-${random}`;
};

