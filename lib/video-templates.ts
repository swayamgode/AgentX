/**
 * Video Meme Templates Library
 * Popular video meme formats with metadata
 */

export interface VideoTextOverlay {
    id: string;
    text: string;
    startTime: number; // seconds
    endTime: number; // seconds
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    fontSize: number;
    color: string;
    backgroundColor?: string;
    animation?: 'fade' | 'slide' | 'bounce' | 'typewriter' | 'none';
    position?: 'top' | 'center' | 'bottom';
}

export interface VideoTemplate {
    id: string;
    name: string;
    description: string;
    category: 'reaction' | 'typing' | 'pointing' | 'dancing' | 'other';
    videoUrl: string; // URL to video file or placeholder
    thumbnailUrl: string;
    duration: number; // seconds
    width: number;
    height: number;
    textOverlays: VideoTextOverlay[];
    trending: boolean;
    tags: string[];
}

// Popular video meme templates
export const VIDEO_TEMPLATES: VideoTemplate[] = [
    {
        id: 'typing-cat',
        name: 'Cat Typing on Laptop',
        description: 'Cat aggressively typing on laptop keyboard',
        category: 'typing',
        videoUrl: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.mp4',
        thumbnailUrl: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200.gif',
        duration: 3,
        width: 480,
        height: 270,
        trending: true,
        tags: ['cat', 'typing', 'work', 'busy'],
        textOverlays: [
            {
                id: 'top-text',
                text: 'Me writing code at 3 AM',
                startTime: 0,
                endTime: 3,
                x: 50,
                y: 10,
                fontSize: 40,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'fade',
                position: 'top',
            },
        ],
    },
    {
        id: 'woman-yelling-cat',
        name: 'Woman Yelling at Cat',
        description: 'Split screen of woman yelling and confused cat at dinner table',
        category: 'reaction',
        videoUrl: 'https://i.imgur.com/placeholder-video.mp4', // Placeholder
        thumbnailUrl: 'https://i.imgflip.com/345v97.jpg',
        duration: 4,
        width: 680,
        height: 438,
        trending: true,
        tags: ['argument', 'cat', 'reaction', 'split'],
        textOverlays: [
            {
                id: 'left-text',
                text: 'My code',
                startTime: 0,
                endTime: 4,
                x: 25,
                y: 85,
                fontSize: 35,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'none',
                position: 'bottom',
            },
            {
                id: 'right-text',
                text: 'The bug I just created',
                startTime: 0,
                endTime: 4,
                x: 75,
                y: 85,
                fontSize: 35,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'none',
                position: 'bottom',
            },
        ],
    },
    {
        id: 'surprised-pikachu',
        name: 'Surprised Pikachu',
        description: 'Pikachu with surprised expression',
        category: 'reaction',
        videoUrl: 'https://media.giphy.com/media/3kzJvEciJa94SMW3hN/giphy.mp4',
        thumbnailUrl: 'https://media.giphy.com/media/3kzJvEciJa94SMW3hN/200.gif',
        duration: 2,
        width: 498,
        height: 498,
        trending: true,
        tags: ['pikachu', 'surprised', 'shocked', 'reaction'],
        textOverlays: [
            {
                id: 'top-text',
                text: 'When the code works on first try',
                startTime: 0,
                endTime: 2,
                x: 50,
                y: 10,
                fontSize: 38,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                animation: 'slide',
                position: 'top',
            },
        ],
    },
    {
        id: 'drake-typing',
        name: 'Drake Typing',
        description: 'Drake typing intensely on phone',
        category: 'typing',
        videoUrl: 'https://media.giphy.com/media/13GIgrGdslD9oQ/giphy.mp4',
        thumbnailUrl: 'https://media.giphy.com/media/13GIgrGdslD9oQ/200.gif',
        duration: 3,
        width: 500,
        height: 281,
        trending: true,
        tags: ['drake', 'typing', 'texting', 'phone'],
        textOverlays: [
            {
                id: 'caption',
                text: 'Me explaining why my code is correct',
                startTime: 0,
                endTime: 3,
                x: 50,
                y: 90,
                fontSize: 36,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'typewriter',
                position: 'bottom',
            },
        ],
    },
    {
        id: 'monkey-puppet',
        name: 'Monkey Puppet Looking Away',
        description: 'Monkey puppet looking away awkwardly',
        category: 'reaction',
        videoUrl: 'https://media.giphy.com/media/kGCuRgmbnO9EI/giphy.mp4',
        thumbnailUrl: 'https://media.giphy.com/media/kGCuRgmbnO9EI/200.gif',
        duration: 3,
        width: 500,
        height: 375,
        trending: true,
        tags: ['monkey', 'awkward', 'looking away', 'puppet'],
        textOverlays: [
            {
                id: 'top-text',
                text: 'When someone asks if I tested my code',
                startTime: 0,
                endTime: 3,
                x: 50,
                y: 10,
                fontSize: 35,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'fade',
                position: 'top',
            },
        ],
    },
    {
        id: 'dancing-baby',
        name: 'Dancing Baby',
        description: 'Baby dancing with enthusiasm',
        category: 'dancing',
        videoUrl: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.mp4',
        thumbnailUrl: 'https://media.giphy.com/media/ICOgUNjpvO0PC/200.gif',
        duration: 2,
        width: 500,
        height: 375,
        trending: false,
        tags: ['baby', 'dancing', 'happy', 'celebration'],
        textOverlays: [
            {
                id: 'caption',
                text: 'When the build finally passes',
                startTime: 0,
                endTime: 2,
                x: 50,
                y: 90,
                fontSize: 38,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'bounce',
                position: 'bottom',
            },
        ],
    },
    {
        id: 'this-is-fine',
        name: 'This Is Fine Dog',
        description: 'Dog sitting in burning room saying this is fine',
        category: 'reaction',
        videoUrl: 'https://media.giphy.com/media/NTur7XlVDUdqM/giphy.mp4',
        thumbnailUrl: 'https://media.giphy.com/media/NTur7XlVDUdqM/200.gif',
        duration: 3,
        width: 500,
        height: 282,
        trending: true,
        tags: ['dog', 'fire', 'fine', 'disaster'],
        textOverlays: [
            {
                id: 'top-text',
                text: 'Production on Friday afternoon',
                startTime: 0,
                endTime: 3,
                x: 50,
                y: 10,
                fontSize: 40,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'fade',
                position: 'top',
            },
        ],
    },
    {
        id: 'spiderman-pointing',
        name: 'Spiderman Pointing',
        description: 'Two Spidermen pointing at each other',
        category: 'pointing',
        videoUrl: 'https://media.giphy.com/media/l36kU80xPf0ojG0Erg/giphy.mp4',
        thumbnailUrl: 'https://media.giphy.com/media/l36kU80xPf0ojG0Erg/200.gif',
        duration: 2,
        width: 500,
        height: 375,
        trending: true,
        tags: ['spiderman', 'pointing', 'same', 'duplicate'],
        textOverlays: [
            {
                id: 'left-label',
                text: 'My bug',
                startTime: 0,
                endTime: 2,
                x: 25,
                y: 50,
                fontSize: 35,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'none',
                position: 'center',
            },
            {
                id: 'right-label',
                text: "Someone else's bug",
                startTime: 0,
                endTime: 2,
                x: 75,
                y: 50,
                fontSize: 35,
                color: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                animation: 'none',
                position: 'center',
            },
        ],
    },
];

// Helper function to get templates by category
export function getTemplatesByCategory(category: VideoTemplate['category']): VideoTemplate[] {
    return VIDEO_TEMPLATES.filter(t => t.category === category);
}

// Helper function to get trending templates
export function getTrendingTemplates(): VideoTemplate[] {
    return VIDEO_TEMPLATES.filter(t => t.trending);
}

// Helper function to search templates
export function searchTemplates(query: string): VideoTemplate[] {
    const lowerQuery = query.toLowerCase();
    return VIDEO_TEMPLATES.filter(
        t =>
            t.name.toLowerCase().includes(lowerQuery) ||
            t.description.toLowerCase().includes(lowerQuery) ||
            t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}
