export interface MusicTrack {
    id: string;
    name: string;
    artist: string;
    mood: string;
    duration: number;
    filename: string;
    description: string;
}

export interface MusicMood {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface MusicLibrary {
    tracks: MusicTrack[];
    moods: MusicMood[];
    attribution: string;
    source: string;
}

/**
 * Get all available royalty-free music tracks
 */
export async function getMusicLibrary(): Promise<MusicLibrary> {
    try {
        const response = await fetch('/music/royalty-free/metadata.json');
        if (!response.ok) {
            throw new Error('Failed to load music library');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading music library:', error);
        return {
            tracks: [],
            moods: [],
            attribution: '',
            source: ''
        };
    }
}

/**
 * Get tracks filtered by mood
 */
export function getTracksByMood(library: MusicLibrary, mood: string): MusicTrack[] {
    return library.tracks.filter(track => track.mood === mood);
}

/**
 * Get track by ID
 */
export function getTrackById(library: MusicLibrary, id: string): MusicTrack | undefined {
    return library.tracks.find(track => track.id === id);
}

/**
 * Get track URL for playback
 */
export function getTrackUrl(filename: string): string {
    return `/music/royalty-free/${filename}`;
}

/**
 * Fetch audio file as blob for video generation
 */
export async function fetchTrackAsBlob(filename: string): Promise<Blob | null> {
    try {
        const url = getTrackUrl(filename);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch track: ${filename}`);
        }
        return await response.blob();
    } catch (error) {
        console.error('Error fetching track:', error);
        return null;
    }
}
