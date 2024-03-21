export interface Pagefind {
    search: (query: string) => Promise<PagefindResponse>
}

export interface PagefindResponse {
    results: PagefindResult[]
}

export interface PagefindResult {
    id: string;
    data: () => Promise<PagefindDocument>
}

export interface PagefindDocument {
    url: string
    raw_url: string
    excerpt: string
}
