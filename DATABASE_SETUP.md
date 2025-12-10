# Database Setup Guide

## Quick Setup with Docker

1. **Start the PostgreSQL container:**
   ```bash
   docker compose up -d
   ```
   (If you get permission errors, use: `sudo docker compose up -d`)

2. **Wait a few seconds for the database to start**, then run:
   ```bash
   npx prisma generate
   npx prisma db push --accept-data-loss
   npm run db:seed
   ```

3. **Verify it's working:**
   ```bash
   docker ps
   ```
   You should see `data-nexus-db` running.

## Database Credentials

- **Host:** localhost
- **Port:** 5432
- **Database:** data_nexus_test
- **Username:** data_nexus
- **Password:** data_nexus_dev

## Default User

After running `npm run db:seed`, a default user is created automatically. **No authentication is required** - the app uses this user automatically for all operations.

## Useful Commands

- **Start database:** `docker compose up -d` or `npm run db:start`
- **Stop database:** `docker compose down` or `npm run db:stop`
- **View database:** `npx prisma studio`
- **Reset database:** `docker compose down -v` (removes all data)

## Troubleshooting

**Permission denied with Docker:**
```bash
sudo usermod -aG docker $USER
# Then log out and back in
```

**Port already in use:**
- Change the port in `docker-compose.yml` from `5432:5432` to `5433:5432`
- Update `.env` DATABASE_URL to use port 5433

**Container won't start:**
```bash
docker compose logs postgres
```

