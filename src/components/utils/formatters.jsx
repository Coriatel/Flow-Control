/**
 * Formats a quantity for display.
 * - Returns '0' for null, undefined, or non-numeric values.
 * - Displays integers without decimal points (e.g., 5).
 * - Displays decimals with up to 2 decimal places, removing trailing zeros (e.g., 5.5, 5.56).
 * @param {number | string | null | undefined} quantity The quantity to format.
 * @returns {string} The formatted quantity as a string.
 */
export const formatQuantity = (quantity) => {
  if (quantity === null || quantity === undefined || isNaN(Number(quantity))) {
    return '0';
  }
  
  const num = Number(quantity);
  
  // Round to a maximum of 2 decimal places and convert back to a number
  // to remove trailing zeros automatically.
  const formattedNum = Number(num.toFixed(2));
  
  return String(formattedNum);
};