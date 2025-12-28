declare module 'yt-search' {
    interface VideoSearchResult {
        title: string;
        url: string;
        videoId: string;
        timestamp: string;
        duration: { seconds: number; timestamp: string };
        ago: string;
        views: number;
        author: {
            name: string;
            url: string;
        };
    }

    interface SearchResult {
        videos: VideoSearchResult[];
        playlists: unknown[];
        channels: unknown[];
    }

    function search(query: string): Promise<SearchResult>;

    export = search;
    export { VideoSearchResult, SearchResult };
}

declare module 'p-limit' {
    type LimitFunction = <T>(fn: () => Promise<T>) => Promise<T>;

    function pLimit(concurrency: number): LimitFunction;

    export = pLimit;
}

// CSS Module declarations for CSS Modules
declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
}

// Global CSS for side-effect imports
declare module '*.css' {
    const content: string;
    export default content;
}

// Asset module declarations
declare module '*.svg' {
    const content: string;
    export default content;
}

declare module '*.png' {
    const content: string;
    export default content;
}

declare module '*.jpg' {
    const content: string;
    export default content;
}

declare module '*.jpeg' {
    const content: string;
    export default content;
}

declare module '*.gif' {
    const content: string;
    export default content;
}
