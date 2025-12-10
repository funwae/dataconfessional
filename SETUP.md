# Data Nexus Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key (or other LLM provider)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in:
   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `LLM_PROVIDER`: Set to "openai" (default)

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Create required directories:**
   ```bash
   mkdir -p uploads exports
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## First Steps

1. **Register an account** on the home page
2. **Create a project** with your goal type and audience
3. **Upload data sources:**
   - CSV or Excel files
   - URLs (competitor sites, articles, etc.)
4. **Generate dashboard & report** from the Dashboard tab
5. **Ask questions** in the AI Q&A panel
6. **Export reports** in various formats

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility functions and services
- `/prisma` - Database schema
- `/docs` - Project documentation

## Notes

- For MVP, files are stored locally in `uploads/` and `exports/` directories
- In production, you should use S3-compatible object storage
- The LLM client is abstracted - you can add other providers in `lib/llm-client.ts`
- Chart data is currently using sample data - in production, fetch from actual table data

## Troubleshooting

- **Database connection errors**: Check your `DATABASE_URL` in `.env`
- **File upload fails**: Ensure `uploads/` directory exists and is writable
- **LLM errors**: Verify your `OPENAI_API_KEY` is set correctly
- **Port already in use**: Change the port with `PORT=3001 npm run dev`


