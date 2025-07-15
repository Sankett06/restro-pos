// Utility functions for handling MySQL datetime format
export const parseDateTime = (dateTimeString: string | Date): Date => {
  if (!dateTimeString) {
    return new Date();
  }
  
  if (dateTimeString instanceof Date) {
    return dateTimeString;
  }
  
  // Handle MySQL datetime format: "2025-07-14 12:21:10"
  // Convert to ISO format for proper parsing
  const isoString = dateTimeString.replace(' ', 'T') + 'Z';
  const date = new Date(isoString);
  
  // If that fails, try direct parsing
  if (isNaN(date.getTime())) {
    const directDate = new Date(dateTimeString);
    if (isNaN(directDate.getTime())) {
      console.warn('Invalid date format:', dateTimeString);
      return new Date();
    }
    return directDate;
  }
  
  return date;
};

export const formatDateTime = (date: Date | string): string => {
  const parsedDate = parseDateTime(date);
  return parsedDate.toISOString().slice(0, 19).replace('T', ' ');
};

export const formatDate = (date: Date | string): string => {
  const parsedDate = parseDateTime(date);
  return parsedDate.toISOString().slice(0, 10);
};

export const formatTime = (date: Date | string): string => {
  const parsedDate = parseDateTime(date);
  return parsedDate.toTimeString().slice(0, 8);
};

export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const parsedDate = parseDateTime(date);
  return !isNaN(parsedDate.getTime());
};