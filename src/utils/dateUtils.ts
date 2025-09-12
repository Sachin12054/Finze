export const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const isToday = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  return getLocalDateString(today) === getLocalDateString(date);
};

export const isThisMonth = (dateString: string): boolean => {
  const today = new Date();
  const date = new Date(dateString);
  return today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear();
};
