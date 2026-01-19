export interface Song {
  id: number;
  title: string;
  artist: {
    id: number;
    name: string;
  };
  videoUrl: string;
  audioUrl: string;
  lyricsUrl?: string;
  createdAt: string;
}
