/**
 * Audio Library for Meme Videos
 * Trending and popular meme sound effects
 */

export interface AudioTrack {
    id: string;
    name: string;
    description: string;
    category: 'trending' | 'comedy' | 'dramatic' | 'epic' | 'sound-effect';
    audioUrl: string;
    duration: number; // seconds
    trending: boolean;
    tags: string[];
    artist?: string;
    license: 'royalty-free' | 'creative-commons' | 'custom';
}

// Curated audio library with royalty-free and meme sounds
export const AUDIO_LIBRARY: AudioTrack[] = [
    {
        id: 'vine-boom',
        name: 'Vine Boom',
        description: 'Classic vine boom sound effect',
        category: 'sound-effect',
        audioUrl: '/audio/vine-boom.mp3',
        duration: 1,
        trending: true,
        tags: ['vine', 'boom', 'impact', 'dramatic'],
        license: 'royalty-free',
    },
    {
        id: 'bruh',
        name: 'Bruh Sound Effect',
        description: 'Iconic bruh moment sound',
        category: 'sound-effect',
        audioUrl: '/audio/bruh.mp3',
        duration: 2,
        trending: true,
        tags: ['bruh', 'reaction', 'funny'],
        license: 'royalty-free',
    },
    {
        id: 'oh-no',
        name: 'Oh No Song',
        description: 'Oh no, oh no, oh no no no no no',
        category: 'trending',
        audioUrl: '/audio/oh-no.mp3',
        duration: 15,
        trending: true,
        tags: ['oh no', 'tiktok', 'viral', 'disaster'],
        artist: 'Kreepa',
        license: 'royalty-free',
    },
    {
        id: 'curb-your-enthusiasm',
        name: 'Curb Your Enthusiasm Theme',
        description: 'Iconic comedy theme music',
        category: 'comedy',
        audioUrl: '/audio/curb-theme.mp3',
        duration: 10,
        trending: true,
        tags: ['curb', 'comedy', 'awkward', 'fail'],
        artist: 'Luciano Michelini',
        license: 'creative-commons',
    },
    {
        id: 'to-be-continued',
        name: 'To Be Continued',
        description: 'JoJo roundabout meme music',
        category: 'dramatic',
        audioUrl: '/audio/to-be-continued.mp3',
        duration: 8,
        trending: true,
        tags: ['jojo', 'roundabout', 'cliffhanger', 'dramatic'],
        artist: 'Yes',
        license: 'creative-commons',
    },
    {
        id: 'dramatic-chipmunk',
        name: 'Dramatic Chipmunk',
        description: 'Dramatic dun dun dun sound',
        category: 'dramatic',
        audioUrl: '/audio/dramatic-chipmunk.mp3',
        duration: 3,
        trending: false,
        tags: ['dramatic', 'suspense', 'reveal'],
        license: 'royalty-free',
    },
    {
        id: 'windows-xp-error',
        name: 'Windows XP Error',
        description: 'Classic Windows error sound',
        category: 'sound-effect',
        audioUrl: '/audio/windows-error.mp3',
        duration: 1,
        trending: false,
        tags: ['windows', 'error', 'fail', 'tech'],
        license: 'royalty-free',
    },
    {
        id: 'sad-violin',
        name: 'Sad Violin',
        description: 'Worlds smallest violin',
        category: 'comedy',
        audioUrl: '/audio/sad-violin.mp3',
        duration: 3,
        trending: false,
        tags: ['sad', 'violin', 'sarcastic', 'tiny'],
        license: 'royalty-free',
    },
    {
        id: 'airhorn',
        name: 'Air Horn',
        description: 'MLG air horn sound',
        category: 'sound-effect',
        audioUrl: '/audio/airhorn.mp3',
        duration: 2,
        trending: false,
        tags: ['airhorn', 'mlg', 'hype', 'loud'],
        license: 'royalty-free',
    },
    {
        id: 'record-scratch',
        name: 'Record Scratch',
        description: 'Freeze frame record scratch',
        category: 'sound-effect',
        audioUrl: '/audio/record-scratch.mp3',
        duration: 2,
        trending: true,
        tags: ['record', 'scratch', 'freeze', 'stop'],
        license: 'royalty-free',
    },
    {
        id: 'emotional-damage',
        name: 'Emotional Damage',
        description: 'Emotional damage meme sound',
        category: 'comedy',
        audioUrl: '/audio/emotional-damage.mp3',
        duration: 3,
        trending: true,
        tags: ['emotional', 'damage', 'roast', 'funny'],
        license: 'royalty-free',
    },
    {
        id: 'john-cena',
        name: 'John Cena Theme',
        description: 'And his name is John Cena!',
        category: 'epic',
        audioUrl: '/audio/john-cena.mp3',
        duration: 5,
        trending: true,
        tags: ['john cena', 'wwe', 'surprise', 'epic'],
        license: 'royalty-free',
    },
    {
        id: 'coffin-dance',
        name: 'Coffin Dance',
        description: 'Astronomia coffin dance music',
        category: 'trending',
        audioUrl: '/audio/coffin-dance.mp3',
        duration: 10,
        trending: true,
        tags: ['coffin', 'dance', 'funeral', 'fail'],
        artist: 'Vicetone & Tony Igy',
        license: 'creative-commons',
    },
    {
        id: 'silence',
        name: 'No Audio',
        description: 'Silent video (no audio)',
        category: 'sound-effect',
        audioUrl: '',
        duration: 0,
        trending: false,
        tags: ['silent', 'none', 'quiet'],
        license: 'royalty-free',
    },
];

// Helper functions
export function getAudioByCategory(category: AudioTrack['category']): AudioTrack[] {
    return AUDIO_LIBRARY.filter(a => a.category === category);
}

export function getTrendingAudio(): AudioTrack[] {
    return AUDIO_LIBRARY.filter(a => a.trending);
}

export function searchAudio(query: string): AudioTrack[] {
    const lowerQuery = query.toLowerCase();
    return AUDIO_LIBRARY.filter(
        a =>
            a.name.toLowerCase().includes(lowerQuery) ||
            a.description.toLowerCase().includes(lowerQuery) ||
            a.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
}

export function getAudioById(id: string): AudioTrack | undefined {
    return AUDIO_LIBRARY.find(a => a.id === id);
}
