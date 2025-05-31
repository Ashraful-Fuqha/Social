// src/utils/utils.ts

/**
 * Formats a duration in seconds into a human-readable string (MM:SS or HH:MM:SS).
 * @param duration The duration in seconds.
 * @returns Formatted duration string.
 */
const formatDuration = (duration: number): string => {
    // Ensure duration is a non-negative number
    if (isNaN(duration) || duration < 0) {
        return "0:00";
    }

    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);

    // Format seconds and minutes with leading zeros using padStart
    const paddedSeconds = seconds.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');

    // Format the duration based on whether there are hours
    if (hours > 0) {
        const paddedHours = hours.toString().padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    } else {
        return `${paddedMinutes}:${paddedSeconds}`;
    }
};

/**
 * Calculates the time elapsed since a given timestamp and returns a human-readable string (e.g., "3 days ago").
 * Handles seconds, minutes, hours, days, months, and years.
 * @param videoTimestamp The timestamp string or Date object.
 * @returns Human-readable time elapsed string.
 */
const timeSince = (videoTimestamp: string | Date): string => {
    // Ensure the input can be converted to a valid Date object
    const date = new Date(videoTimestamp);

    // Check for invalid dates
    if (isNaN(date.getTime())) {
        console.error("Invalid date provided to timeSince:", videoTimestamp);
        return "Invalid date"; // Return a clear indicator for invalid input
    }

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    // Handle future dates or very small differences (less than a second)
    if (seconds < 0) {
        return "just now"; // Or handle as a future date if needed
    }
     if (seconds < 1) {
         return "just now";
     }


    let interval = seconds / 31536000; // Years (approx)
    if (interval >= 1) { // Use >= 1 for intervals like "1 year"
        const years = Math.floor(interval);
        return years + (years === 1 ? " year" : " years");
    }

    interval = seconds / 2592000; // Months (approx 30 days)
    if (interval >= 1) {
         const months = Math.floor(interval);
        return months + (months === 1 ? " month" : " months");
    }

    interval = seconds / 86400; // Days
    if (interval >= 1) {
        const days = Math.floor(interval);
        return days + (days === 1 ? " day" : " days");
    }

    interval = seconds / 3600; // Hours
    if (interval >= 1) {
         const hours = Math.floor(interval);
        return hours + (hours === 1 ? " hour" : " hours");
    }

    interval = seconds / 60; // Minutes
    if (interval >= 1) {
         const minutes = Math.floor(interval);
        return minutes + (minutes === 1 ? " minute" : " minutes");
    }

    // If less than a minute, return seconds
    const remainingSeconds = Math.floor(seconds);
    return remainingSeconds + (remainingSeconds === 1 ? " second" : " seconds");
};

export { timeSince, formatDuration };
