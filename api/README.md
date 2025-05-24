# api

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Setup Notes

- You must have the Stockfish binary available in your PATH or in the project root for analysis to work.
- Set your OpenAI API key in a `.env` file as `OPENAI_API_KEY=sk-...` for LLM advice.
