# Quick Start Guide

## The Problem: Can't Create Projects

If you're getting errors when trying to create projects, it's likely because the database isn't running.

## Solution: Start the Database

### Step 1: Start PostgreSQL with Docker

```bash
# If you get permission errors, use sudo:
sudo docker compose up -d

# Or if you have docker permissions:
docker compose up -d
```

### Step 2: Wait a few seconds for the database to start

### Step 3: Set up the database schema

```bash
npx prisma generate
npx prisma db push --accept-data-loss
npm run db:seed
```

### Step 4: Start the app

```bash
npm run dev
```

Now you should be able to create projects!

## Troubleshooting

**"Can't reach database server"**
- Make sure Docker is running: `docker ps`
- Start the database: `sudo docker compose up -d`
- Check if it's running: `docker ps | grep data-nexus-db`

**"Permission denied" with Docker**
- Use `sudo docker compose up -d`
- Or add yourself to docker group: `sudo usermod -aG docker $USER` (then log out/in)

**Port already in use**
- Check what's using port 5432: `sudo lsof -i :5432`
- Or change the port in `docker-compose.yml`

## Verify Everything Works

1. Database is running: `docker ps` should show `data-nexus-db`
2. Schema is set up: `npx prisma studio` should open a database browser
3. App is running: http://localhost:3000 should show the projects page
4. Create a project: Click "New Project" and fill in the form

