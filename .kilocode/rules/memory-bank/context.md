# Active Context: StreamHub - Entertainment App

## Current State

**App Status**: ✅ Fully functional

StreamHub is a complete entertainment streaming application with MongoDB backend.

## Recently Completed

- [x] Complete entertainment app with music & video streaming
- [x] MongoDB database with mongoose integration
- [x] Music player with streaming and download
- [x] Video player with streaming
- [x] Open library with search functionality
- [x] Modern UI with Tailwind CSS
- [x] Seed data API for sample content
- [x] YouTube video embed support
- [x] Fix React hydration error and key prop issues
- [x] Fix YouTube video ID preservation in fallback data
- [x] Hide custom video controls for YouTube embeds since they have their own
- [x] Add server-side download API to bypass CORS restrictions
- [x] Add local video import and storage with IndexedDB
- [x] Fix local video persistence after page refresh
- [x] Redesign video page with improved local video import UI
- [x] Extract video import button as separate reusable component
- [x] Add device file picker for browsing and playing local videos directly

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page with featured content | ✅ |
| `src/app/music/` | Music library page | ✅ |
| `src/app/videos/` | Videos library page | ✅ |
| `src/app/videos/[id]/` | Video player page | ✅ |
| `src/app/library/` | User library page | ✅ |
| `src/app/search/` | Search page | ✅ |
| `src/app/favorites/` | Favorites page | ✅ |
| `src/app/downloads/` | Downloads page | ✅ |
| `src/app/api/music/` | Music API routes | ✅ |
| `src/app/api/video/` | Video API routes | ✅ |
| `src/app/api/search/` | Search API route | ✅ |
| `src/app/api/playlist/` | Playlist API routes | ✅ |
| `src/app/api/seed/` | Seed data API | ✅ |
| `src/app/api/download/` | Server-side download API | ✅ |
| `src/components/` | Reusable UI components | ✅ |
| `src/lib/mongodb.ts` | MongoDB connection | ✅ |
| `src/lib/models.ts` | Database models | ✅ |
| `src/context/` | React context providers | ✅ |

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: MongoDB (mongoose)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Package Manager**: Bun

## Database

**Connection**: `mongodb://localhost:27017/entertainment_app`

**Collections**:
- `musics` - Music tracks with metadata
- `videos` - Video content with metadata
- `playlists` - User playlists

## Key Features

1. **Music Streaming**: Play music with full player controls
2. **Video Streaming**: Watch videos with fullscreen support
3. **Search**: Search across music and videos
4. **Downloads**: Download music for offline playback
5. **Library**: Manage playlists and favorites
6. **Seed Data**: Auto-populates with sample content

## Quick Start

1. Ensure MongoDB is running on localhost:27017
2. Run `bun dev` to start the development server
3. The app will auto-seed sample data on first load

## Pending Improvements

- [ ] User authentication
- [ ] Persistent favorites/downloads
- [ ] More advanced search filters
- [ ] Video categories and filtering

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| Now | Complete StreamHub entertainment app |
| 2026-03-03 | Fixed hydration error and added image configuration |
| 2026-03-03 | Fixed React key prop error (unique _id for music/videos) |
| 2026-03-03 | Added YouTube video embed support |
| 2026-03-03 | Fixed YouTube controls and download CORS issue |
| 2026-03-03 | Added local video import and IndexedDB storage |
| 2026-03-03 | Redesign video page with improved local video import UI |
| 2026-04-23 | Fixed search page query-loading flow to remove blocking lint error and validated lint/typecheck/build |

## Bug Fixes Applied

- [x] Fixed React hydration mismatch in Header component (useSyncExternalStore approach)
- [x] Added suppressHydrationWarning to form inputs to fix fdprocessedid mismatch
- [x] Added picsum.photos to allowed image domains in next.config.ts
- [x] Added unique _id fields to sample music and videos in seed data
- [x] Refactored `src/app/search/page.tsx` query-driven fetch flow to avoid `react-hooks/immutability` lint error
- [x] Added empty-query loading reset in search page to prevent stale loading state
