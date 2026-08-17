# Phase 2 Kickoff — EduTalk

Date: 2026-08-17

Attendees: product, tech lead, 1–2 engineers, QA, ops

## Objectives
- Align on Phase‑2 scope: real‑time video (WebRTC), session recording, AI moderation/summarization, analytics.
- Assign owners, set an initial sprint backlog, and define acceptance criteria.

## Agenda (30–60 minutes)
1. Welcome & goals (5m)
2. WebRTC POC scope and constraints (10m)
   - Signalling approach, TURN/STUN, 1:1 then small groups
3. Recording strategy & storage (10m)
   - Client vs server recording, retention, storage provider options
4. AI moderation & summarization (5m)
   - Minimal data needs, privacy considerations
5. CI/testing and staging plan (5m)
6. Owners & sprint backlog (5m)

## Outputs / Decisions to record
- Owners for each POC (WebRTC, recording, AI, CI)
- Target branch names and initial PR owners
- Acceptance criteria for POCs
- Timeline for first sprint (1–2 weeks)

## Initial owners (suggested)
- WebRTC POC: @engineering
- Recording POC: @engineering
- AI Moderation POC: @data/engineering
- CI for realtime flows: @qa/engineering

## First sprint backlog (suggested)
- WebRTC: signalling server scaffold, simple React client (1:1), STUN test
- Recording: client-side recording to file, playback UI prototype
- AI: transcript->summary POC using existing models (offline)
- CI: add smoke tests for WebRTC POC connectivity

## Acceptance criteria (for moving POC→prototype)
- WebRTC: 1:1 audio+video connectivity across NATs (TURN if needed)
- Recording: recorded session is playable with metadata attached
- AI: generate a summary for a recorded session and flag test policy violations
- CI: minimal smoke that can run in a staging environment

## Runbook / Next steps after meeting
1. Create `feature/phase-2-kickoff` branch and tasks
2. Scaffold WebRTC signalling server on backend and client page on frontend
3. Add README run instructions and small demo script
4. Schedule a review in 1 week

