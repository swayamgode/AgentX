/**
 * Scheduler Utilities
 * Calculate optimal posting times and manage scheduling
 */

export interface ScheduleOptions {
    startDate: Date;
    count: number;
    postsPerDay?: number;
    startHour?: number; // 0-23
    endHour?: number; // 0-23
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
}

/**
 * Calculate optimal posting schedule
 * Distributes posts evenly across time period
 */
export function calculateSchedule(options: ScheduleOptions): Date[] {
    const {
        startDate,
        count,
        postsPerDay = 6, // YouTube quota limit
        startHour = 9, // 9 AM
        endHour = 21, // 9 PM
        daysOfWeek = [0, 1, 2, 3, 4, 5, 6], // All days
    } = options;

    const schedule: Date[] = [];
    const hoursRange = endHour - startHour;
    const intervalHours = hoursRange / postsPerDay;

    const currentDate = new Date(startDate);
    let postsToday = 0;

    for (let i = 0; i < count; i++) {
        // Skip to next valid day if needed
        while (!daysOfWeek.includes(currentDate.getDay())) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(startHour, 0, 0, 0);
            postsToday = 0;
        }

        // If we've hit the daily limit, move to next day
        if (postsToday >= postsPerDay) {
            currentDate.setDate(currentDate.getDate() + 1);
            currentDate.setHours(startHour, 0, 0, 0);
            postsToday = 0;

            // Skip to next valid day
            while (!daysOfWeek.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        // Calculate time for this post
        const postHour = startHour + (postsToday * intervalHours);
        const postMinute = Math.floor((postHour % 1) * 60);
        const postHourInt = Math.floor(postHour);

        const scheduledTime = new Date(currentDate);
        scheduledTime.setHours(postHourInt, postMinute, 0, 0);

        schedule.push(scheduledTime);
        postsToday++;
    }

    return schedule;
}

/**
 * Get optimal posting times for maximum engagement
 * Based on general social media best practices
 */
export function getOptimalPostingTimes(): { hour: number; label: string }[] {
    return [
        { hour: 9, label: '9:00 AM - Morning commute' },
        { hour: 12, label: '12:00 PM - Lunch break' },
        { hour: 15, label: '3:00 PM - Afternoon break' },
        { hour: 18, label: '6:00 PM - After work' },
        { hour: 20, label: '8:00 PM - Evening prime time' },
        { hour: 22, label: '10:00 PM - Late night' },
    ];
}

/**
 * Check if schedule respects YouTube quota
 */
export function validateSchedule(schedule: Date[], maxPerDay: number = 6): {
    valid: boolean;
    violations: string[];
} {
    const violations: string[] = [];
    const postsByDay = new Map<string, number>();

    schedule.forEach(date => {
        const dayKey = date.toISOString().split('T')[0];
        postsByDay.set(dayKey, (postsByDay.get(dayKey) || 0) + 1);
    });

    postsByDay.forEach((count, day) => {
        if (count > maxPerDay) {
            violations.push(`${day}: ${count} posts (max ${maxPerDay})`);
        }
    });

    return {
        valid: violations.length === 0,
        violations,
    };
}

/**
 * Format schedule for display
 */
export function formatSchedule(schedule: Date[]): {
    date: string;
    time: string;
    datetime: string;
}[] {
    return schedule.map(date => ({
        date: date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }),
        time: date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }),
        datetime: date.toISOString(),
    }));
}
