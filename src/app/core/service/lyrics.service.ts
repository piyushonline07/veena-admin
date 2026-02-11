import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface LyricLine {
    startTime: number; // in seconds
    endTime: number;   // in seconds
    text: string;
}

@Injectable({
    providedIn: 'root'
})
export class LyricsService {

    constructor(private http: HttpClient) { }

    /**
     * Fetch and parse SRT or VTT lyrics file
     * Uses fetch API directly to avoid auth interceptor adding headers
     */
    loadLyrics(url: string): Observable<LyricLine[]> {
        if (!url) {
            return of([]);
        }

        console.log('[LyricsService] Fetching lyrics from:', url);

        // Use fetch API directly to bypass Angular interceptors
        // This prevents Authorization header from being added which causes CORS preflight
        return from(
            fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': 'text/vtt, text/plain, */*'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.text();
            })
        ).pipe(
            map((content: string) => this.parseLyrics(content, url)),
            catchError(err => {
                console.error('Failed to load lyrics:', err);
                return of([]);
            })
        );
    }

    /**
     * Parse SRT or VTT content
     */
    private parseLyrics(content: string, url: string): LyricLine[] {
        console.log('[LyricsService] Content length:', content.length);
        console.log('[LyricsService] First 100 chars:', content.substring(0, 100));
        console.log('[LyricsService] URL ends with .vtt:', url.endsWith('.vtt'));
        console.log('[LyricsService] Content starts with WEBVTT:', content.trim().startsWith('WEBVTT'));

        if (url.endsWith('.vtt') || content.trim().startsWith('WEBVTT')) {
            console.log('[LyricsService] Using VTT parser');
            return this.parseVTT(content);
        }
        console.log('[LyricsService] Using SRT parser');
        return this.parseSRT(content);
    }

    /**
     * Parse SRT format
     * Format:
     * 1
     * 00:00:01,000 --> 00:00:04,000
     * First line of lyrics
     */
    private parseSRT(content: string): LyricLine[] {
        const lines: LyricLine[] = [];

        // Normalize line endings (handle Windows CRLF)
        const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const blocks = normalizedContent.trim().split(/\n\n+/);

        console.log('[LyricsService] Parsing SRT, found blocks:', blocks.length);

        for (const block of blocks) {
            const blockLines = block.trim().split('\n');

            // Find the time line (contains -->)
            let timeLineIndex = blockLines.findIndex(line => line.includes('-->'));
            if (timeLineIndex === -1) continue;

            const timeLine = blockLines[timeLineIndex];
            const textLines = blockLines.slice(timeLineIndex + 1);

            if (textLines.length === 0) continue;

            const times = this.parseSRTTimeLine(timeLine);
            if (times) {
                // Skip entries where start equals end (invalid)
                if (times.start === times.end && times.start === 0) continue;

                lines.push({
                    startTime: times.start,
                    endTime: times.end,
                    text: textLines.join(' ').replace(/<[^>]*>/g, '').trim()
                });
            }
        }

        console.log('[LyricsService] Parsed lyrics lines:', lines.length);
        return lines;
    }

    /**
     * Parse VTT format
     * Format:
     * WEBVTT
     *
     * 00:00:01.000 --> 00:00:04.000
     * First line of lyrics
     */
    private parseVTT(content: string): LyricLine[] {
        const lines: LyricLine[] = [];

        // Normalize line endings (handle Windows CRLF)
        const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const blocks = normalizedContent.trim().split(/\n\n+/);

        console.log('[LyricsService] Parsing VTT, found blocks:', blocks.length);

        for (const block of blocks) {
            // Skip WEBVTT header
            if (block.trim().startsWith('WEBVTT')) continue;

            const blockLines = block.trim().split('\n');

            // Find the time line (contains -->)
            let timeLineIndex = blockLines.findIndex(line => line.includes('-->'));
            if (timeLineIndex === -1) continue;

            const timeLine = blockLines[timeLineIndex];
            const textLines = blockLines.slice(timeLineIndex + 1);

            if (textLines.length === 0) continue;

            const times = this.parseVTTTimeLine(timeLine);
            if (times) {
                // Skip entries where start equals end (invalid)
                if (times.start === times.end && times.start === 0) continue;

                lines.push({
                    startTime: times.start,
                    endTime: times.end,
                    text: textLines.join(' ').replace(/<[^>]*>/g, '').trim()
                });
            }
        }

        console.log('[LyricsService] Parsed lyrics lines:', lines.length);
        return lines;
    }

    /**
     * Parse SRT time format: 00:00:01,000 --> 00:00:04,000
     */
    private parseSRTTimeLine(line: string): { start: number; end: number } | null {
        const match = line.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
        if (!match) return null;

        return {
            start: this.parseTimeCode(match[1].replace(',', '.')),
            end: this.parseTimeCode(match[2].replace(',', '.'))
        };
    }

    /**
     * Parse VTT time format: 00:00:01.000 --> 00:00:04.000
     */
    private parseVTTTimeLine(line: string): { start: number; end: number } | null {
        const match = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (!match) return null;

        return {
            start: this.parseTimeCode(match[1]),
            end: this.parseTimeCode(match[2])
        };
    }

    /**
     * Convert time string to seconds
     * Format: HH:MM:SS.mmm or HH:MM:SS,mmm
     */
    private parseTimeCode(timeStr: string): number {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const secondsParts = parts[2].split(/[.,]/);
        const seconds = parseInt(secondsParts[0], 10);
        const milliseconds = parseInt(secondsParts[1] || '0', 10);

        return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
    }

    /**
     * Find the current lyric line based on playback time
     */
    getCurrentLyricIndex(lyrics: LyricLine[], currentTime: number): number {
        for (let i = 0; i < lyrics.length; i++) {
            if (currentTime >= lyrics[i].startTime && currentTime < lyrics[i].endTime) {
                return i;
            }
        }
        // Return the last line if past all lyrics
        if (lyrics.length > 0 && currentTime >= lyrics[lyrics.length - 1].startTime) {
            return lyrics.length - 1;
        }
        return -1;
    }
}
