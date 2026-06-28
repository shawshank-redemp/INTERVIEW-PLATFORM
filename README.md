# AI Interview Platform

## Overview

AI Interview Platform is a real-time voice interviewing application that conducts personalized technical interviews based on a candidate's GitHub profile. The platform analyzes public repositories, generates contextual interview questions using OpenAI's Realtime API, conducts a low-latency voice interview over WebRTC, transcribes responses in real time using Deepgram, and produces an AI-generated evaluation with feedback and scoring.

## Features

* Personalized interview generation from GitHub repositories
* Real-time voice conversations using OpenAI Realtime API
* Low-latency audio streaming with WebRTC
* Live speech transcription using Deepgram
* Automatic interview transcript storage
* AI-generated interview score and feedback
* PostgreSQL database integration with Prisma ORM

## Technology Stack

### Frontend

* React
* TypeScript
* Bun
* Tailwind CSS
* WebRTC

### Backend

* Node.js
* Express
* TypeScript

### Database

* PostgreSQL
* Prisma ORM

### AI & Speech

* OpenAI Realtime API
* GPT Realtime
* Deepgram Speech-to-Text

## System Workflow

1. The user submits a GitHub profile URL.
2. The backend retrieves repository metadata from GitHub.
3. An interview session is created and stored in PostgreSQL.
4. The browser establishes a WebRTC connection with the OpenAI Realtime API through the backend.
5. The AI interviewer conducts a personalized voice interview.
6. User responses are transcribed in real time using Deepgram.
7. All conversations are stored for evaluation.
8. After the interview, the AI generates a final score and detailed feedback.

## Project Structure

```text
apps/
├── frontend/
└── backend/

packages/
```

## Installation

Clone the repository.

```bash
git clone https://github.com/shawshank-redemp/INTERVIEW-PLATFORM.git
```

Install dependencies.

```bash
bun install
```

Configure the environment variables.

```env
OPENAI_KEY=your_openai_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
DATABASE_URL=your_database_url
```

Run the development server.

```bash
bun run dev
```

## Core Concepts

This project demonstrates practical implementation of:

* WebRTC
* SDP (Session Description Protocol)
* ICE (Interactive Connectivity Establishment)
* STUN and TURN
* OpenAI Realtime API
* WebSockets
* REST APIs
* Real-Time Audio Streaming
* Speech-to-Text
* Prompt Engineering


## Author

**Shashank S**


