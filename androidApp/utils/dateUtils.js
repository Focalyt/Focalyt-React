// Date utility functions for consistent date handling across the app

/**
 * Get today's date in ISO format (YYYY-MM-DD) for API calls
 * @returns {string} Today's date in ISO format
 */
export const getTodayISO = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get today's date in local format (Day Mon DD YYYY) for local storage
 * @returns {string} Today's date in local format
 */
export const getTodayLocal = () => {
  return new Date().toDateString();
};

/**
 * Convert any date to ISO format (YYYY-MM-DD)
 * @param {Date|string} date - Date to convert
 * @returns {string} Date in ISO format
 */
export const toISOFormat = (date) => {
  if (typeof date === 'string') {
    // If it's already in ISO format, return as is
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    // If it's in local format, convert to ISO
    if (date.includes(' ')) {
      return new Date(date).toISOString().split('T')[0];
    }
  }
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Convert any date to local format (Day Mon DD YYYY)
 * @param {Date|string} date - Date to convert
 * @returns {string} Date in local format
 */
export const toLocalFormat = (date) => {
  if (typeof date === 'string') {
    // If it's already in local format, return as is
    if (date.includes(' ')) {
      return date;
    }
    // If it's in ISO format, convert to local
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(date).toDateString();
    }
  }
  return new Date(date).toDateString();
};

/**
 * Get yesterday's date in ISO format
 * @returns {string} Yesterday's date in ISO format
 */
export const getYesterdayISO = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

/**
 * Get yesterday's date in local format
 * @returns {string} Yesterday's date in local format
 */
export const getYesterdayLocal = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toDateString();
};

/**
 * Get tomorrow's date in ISO format
 * @returns {string} Tomorrow's date in ISO format
 */
export const getTomorrowISO = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Get tomorrow's date in local format
 * @returns {string} Tomorrow's date in local format
 */
export const getTomorrowLocal = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toDateString();
};

/**
 * Check if a date is today
 * @param {string} date - Date to check (can be in any format)
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const todayISO = getTodayISO();
  const todayLocal = getTodayLocal();
  const dateISO = toISOFormat(date);
  const dateLocal = toLocalFormat(date);
  
  return dateISO === todayISO || dateLocal === todayLocal;
};

/**
 * Check if a date is yesterday
 * @param {string} date - Date to check (can be in any format)
 * @returns {boolean} True if date is yesterday
 */
export const isYesterday = (date) => {
  const yesterdayISO = getYesterdayISO();
  const yesterdayLocal = getYesterdayLocal();
  const dateISO = toISOFormat(date);
  const dateLocal = toLocalFormat(date);
  
  return dateISO === yesterdayISO || dateLocal === yesterdayLocal;
};

/**
 * Get date for API calls (always use ISO format)
 * @param {string} date - Date in any format
 * @returns {string} Date in ISO format for API
 */
export const getDateForAPI = (date) => {
  return toISOFormat(date);
};

/**
 * Get date for local storage (always use local format)
 * @param {string} date - Date in any format
 * @returns {string} Date in local format for storage
 */
export const getDateForStorage = (date) => {
  return toLocalFormat(date);
};

