/**
 * Curated Trending Meme Examples (2025-2026)
 * Used as few-shot training data for AI meme generation
 */

export interface MemeExample {
    template: string;
    text: string[];
    style: 'absurdist' | 'relatable' | 'dark' | 'specific' | 'nostalgic';
    tags: string[];
}

/**
 * Real trending meme examples categorized by humor style
 */
export const TRENDING_MEME_EXAMPLES: MemeExample[] = [
    // ABSURDIST HUMOR
    {
        template: 'typing-cat',
        text: ['Me explaining to my therapist why I need exactly 365 buttons in 2026'],
        style: 'absurdist',
        tags: ['2026', 'buttons', 'therapy', 'random']
    },
    {
        template: 'monkey-puppet',
        text: ['When someone asks why I have a folder called "definitely not memes"'],
        style: 'absurdist',
        tags: ['caught', 'folders', 'sus']
    },

    // HYPER-SPECIFIC / RELATABLE
    {
        template: 'woman-yelling-cat',
        text: [
            'My PM: "Just add a small feature"',
            'Me knowing it requires rewriting the entire authentication system'
        ],
        style: 'specific',
        tags: ['coding', 'PM', 'scope creep']
    },
    {
        template: 'typing-cat',
        text: ['Me writing a 47-line comment to explain one line of regex'],
        style: 'specific',
        tags: ['coding', 'regex', 'documentation']
    },
    {
        template: 'surprised-pikachu',
        text: ['When my code actually works on the first try without any errors'],
        style: 'relatable',
        tags: ['coding', 'surprise', 'miracle']
    },
    {
        template: 'this-is-fine',
        text: ['Me deploying to production at 4:59 PM on Friday'],
        style: 'specific',
        tags: ['deployment', 'Friday', 'disaster']
    },

    // DARK / SELF-DEPRECATING
    {
        template: 'drake-typing',
        text: ['Me explaining to my bank why I need a loan for more RAM'],
        style: 'dark',
        tags: ['broke', 'tech', 'priorities']
    },
    {
        template: 'monkey-puppet',
        text: ['When the interviewer asks about my "5 years of experience" in a framework from 2023'],
        style: 'dark',
        tags: ['job', 'lying', 'interview']
    },
    {
        template: 'this-is-fine',
        text: ['My mental health in 2026 (it\'s giving 2020 vibes)'],
        style: 'dark',
        tags: ['mental health', 'Gen Z', 'struggling']
    },

    // GEN Z SLANG INTEGRATION
    {
        template: 'typing-cat',
        text: ['Me writing "no cap fr fr" in my thesis because I forgot how to be professional'],
        style: 'relatable',
        tags: ['Gen Z', 'slang', 'professional']
    },
    {
        template: 'woman-yelling-cat',
        text: [
            'Boomers: "Just walk in and ask for a job"',
            'Me: *needs 10 years experience for entry level*'
        ],
        style: 'dark',
        tags: ['job market', 'economy', 'generational']
    },

    // CODING SPECIFIC
    {
        template: 'spiderman-pointing',
        text: [
            'My bug',
            'The bug I created while fixing my bug'
        ],
        style: 'specific',
        tags: ['coding', 'debugging', 'infinite loop']
    },
    {
        template: 'woman-yelling-cat',
        text: [
            'Me: *writes clean, documented code*',
            'Also me 3 months later: "Who wrote this garbage?"'
        ],
        style: 'relatable',
        tags: ['coding', 'documentation', 'self-roast']
    },
    {
        template: 'typing-cat',
        text: ['Me Googling "how to exit vim" for the 47th time this month'],
        style: 'specific',
        tags: ['vim', 'coding', 'struggle']
    },
    {
        template: 'surprised-pikachu',
        text: ['When I finally understand why my code wasn\'t working (I forgot a semicolon)'],
        style: 'relatable',
        tags: ['coding', 'syntax error', 'facepalm']
    },

    // WORK / OFFICE CULTURE
    {
        template: 'this-is-fine',
        text: ['Me in the daily standup saying "no blockers" while everything is on fire'],
        style: 'specific',
        tags: ['standup', 'agile', 'lying']
    },
    {
        template: 'drake-typing',
        text: ['Me writing a 3000-word Slack message at 2 AM about why the API design is wrong'],
        style: 'specific',
        tags: ['Slack', 'overthinking', 'night owl']
    },
    {
        template: 'monkey-puppet',
        text: ['When they ask who pushed to main without a PR'],
        style: 'specific',
        tags: ['git', 'main branch', 'guilty']
    },

    // MODERN LIFE / EXISTENTIAL
    {
        template: 'typing-cat',
        text: ['Me calculating if I can afford rent or therapy (I need both)'],
        style: 'dark',
        tags: ['broke', 'mental health', 'adulting']
    },
    {
        template: 'this-is-fine',
        text: ['2026 really said "let\'s bring back 2016 energy" and I\'m not ready'],
        style: 'nostalgic',
        tags: ['2026', 'nostalgia', 'anxiety']
    },
    {
        template: 'woman-yelling-cat',
        text: [
            'Society: "Just be yourself!"',
            'Me being myself: *gets diagnosed with 4 mental disorders*'
        ],
        style: 'dark',
        tags: ['mental health', 'society', 'irony']
    },

    // TECH CULTURE
    {
        template: 'surprised-pikachu',
        text: ['When ChatGPT writes better code than me on the first try'],
        style: 'relatable',
        tags: ['AI', 'ChatGPT', 'existential crisis']
    },
    {
        template: 'typing-cat',
        text: ['Me explaining to my non-tech friend why I can\'t "just make an app like Instagram"'],
        style: 'specific',
        tags: ['tech', 'non-tech friends', 'frustration']
    },
    {
        template: 'spiderman-pointing',
        text: [
            'Stack Overflow answer from 2015',
            'My "original" solution'
        ],
        style: 'relatable',
        tags: ['Stack Overflow', 'copying', 'coding']
    },

    // ABSURDIST / RANDOM
    {
        template: 'monkey-puppet',
        text: ['POV: You just said "you too" when the waiter said "enjoy your meal"'],
        style: 'absurdist',
        tags: ['social anxiety', 'awkward', 'relatable']
    },
    {
        template: 'this-is-fine',
        text: ['Me pretending I understand the microservices architecture in the meeting'],
        style: 'relatable',
        tags: ['imposter syndrome', 'microservices', 'faking it']
    },
    {
        template: 'drake-typing',
        text: ['Me writing a 500-line bash script instead of learning Python properly'],
        style: 'specific',
        tags: ['bash', 'Python', 'procrastination']
    },

    // INTERNET CULTURE
    {
        template: 'typing-cat',
        text: ['Me at 3 AM researching if penguins have knees (they do btw)'],
        style: 'absurdist',
        tags: ['3 AM', 'random facts', 'internet rabbit hole']
    },
    {
        template: 'woman-yelling-cat',
        text: [
            'My brain at 3 PM: *sleepy*',
            'My brain at 3 AM: "Let\'s redesign the entire app architecture"'
        ],
        style: 'relatable',
        tags: ['insomnia', 'productivity', 'night owl']
    },
    {
        template: 'surprised-pikachu',
        text: ['When I realize I\'ve been debugging the wrong file for 2 hours'],
        style: 'relatable',
        tags: ['debugging', 'facepalm', 'time waste']
    }
];

/**
 * Get examples by style
 */
export function getExamplesByStyle(style: MemeExample['style']): MemeExample[] {
    return TRENDING_MEME_EXAMPLES.filter(ex => ex.style === style);
}

/**
 * Get random examples for few-shot learning
 */
export function getRandomExamples(count: number = 5): MemeExample[] {
    const shuffled = [...TRENDING_MEME_EXAMPLES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Get examples for specific template
 */
export function getExamplesForTemplate(templateId: string): MemeExample[] {
    return TRENDING_MEME_EXAMPLES.filter(ex => ex.template === templateId);
}
