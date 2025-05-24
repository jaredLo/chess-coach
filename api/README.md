# Chess Coach API

> ⚠️ **Work (probably) in Progress**

## Known Limitations

This API is still in its early stages, and there are a few things to be aware of:

- **No authentication or rate limiting**: The API is open by default, so if you deploy it publicly, anyone can use it. This could lead to abuse or high server load.
- **Synchronous Stockfish calls**: Each analysis request starts a new Stockfish process and waits for it to finish. This can be slow, especially under heavy usage, and doesn't scale well.
- **No caching**: The same chess position will be analyzed from scratch every time, which increases latency and server resource usage.
- **Limited error handling**: The API doesn't always provide detailed error messages, and some edge cases (like malformed PGN or engine errors) may not be handled gracefully.
- **No input validation**: Inputs from clients are not strictly validated, which could lead to unexpected errors or security issues.
- **Single-threaded processing**: The current implementation doesn't take advantage of multi-core systems for parallel analysis.
- **Minimal logging and monitoring**: There is only basic logging, and no monitoring or alerting for failures or performance issues.

I welcome contributions and suggestions to help address these limitations as the project evolves.

This is the backend API for the Chess Coach application. It provides chess analysis using Stockfish and AI-powered coaching using OpenRouter's API.

## Prerequisites

- Node.js (v16 or higher) (Sidenote: I wanted to use bun.sh, but turns out it doesn't work too well when it comes to handling the stockfish part)
- Yarn package manager
- Stockfish chess engine for your platform

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Download Stockfish:
   - Visit [Stockfish's official website](https://stockfishchess.org/download/)
   - Download the appropriate version for your platform
   - Place the Stockfish executable in the `stockfish/` directory
   - Rename it to match the expected name in the code:
     - For M1/M2 Mac: `stockfish-macos-m1-apple-silicon`
     - For Intel Mac: `stockfish-macos-x86-64`
     - For Windows: `stockfish-windows-x86-64.exe`
     - For Linux: `stockfish-linux-x86-64`

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=8060
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

4. Get an OpenRouter API key:
   - Visit [OpenRouter](https://openrouter.ai/)
   - Sign up for an account
   - Get your API key from the dashboard
   - Add it to your `.env` file

## Running the API

Start the development server:
```bash
yarn dev
```

The API will be available at `http://localhost:8060`.

## API Endpoints

### POST /analyze
Analyzes a chess position and provides coaching advice.

Request body:
```json
{
  "pgn": "string",        // PGN of the game
  "moveIndex": number,    // Current move index
  "userColor": "w" | "b", // Color of the user
  "actualMove": "string"  // The move that was played
}
```

Response:
```json
{
  "input": {
    "pgn": "string",
    "fen": "string"
  },
  "stockfish": {
    "bestMove": "string",
    "eval": number | string
  },
  "advice": "string"
}
```

## Development

- The API is built with Express.js and TypeScript
- Stockfish is used for chess analysis
- OpenRouter's API is used for AI coaching
- The code is structured to be easily extensible

## License

This project is licensed under the MIT License - see the LICENSE file for details.
