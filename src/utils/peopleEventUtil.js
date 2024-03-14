/**
 * Determines the event type based on the content.
 * @param {string} content - The content to check for event type.
 * @returns {string} - The event type ('dwell', 'capacity', 'visit', or 'unknown').
 */
function getEventType(content) {
  if (content.includes('dwell')) {
    return 'dwell'
  } else if (content.includes('capacity')) {
    return 'capacity'
  } else if (content.includes('visit')) {
    return 'visit'
  } else {
    return 'unknown'
  }
}

export { getEventType }
