# Blog Aggregator (Gator)

A CLI RSS feed aggregator. Add feeds, follow them, and browse the latest posts — all from the terminal.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) (running locally or remotely)

## Installation

```bash
git clone <repo-url>
cd Blog_Aggregator
npm install
```

## Configuration

Create the config file at `~/.gatorconfig.json`:

```json
{
  "db_url": "postgres://username:password@localhost:5432/gator"
}
```

Replace `username`, `password`, and `gator` with your actual PostgreSQL credentials and database name.

## Database setup

Apply migrations to create the required tables:

```bash
npx drizzle-kit migrate
```

## Running commands

All commands are run via:

```bash
npm start -- <command> [args]
```

---

## Commands

### Account management

| Command | Description |
|---|---|
| `register <name>` | Create a new user account and log in as them |
| `login <name>` | Switch to an existing user |
| `users` | List all registered users |
| `reset` | Delete all users (and their data) |

```bash
npm start -- register alice
npm start -- login alice
```

### Feed management

| Command | Description |
|---|---|
| `addfeed <name> <url>` | Add a new RSS feed and auto-follow it |
| `feeds` | List all feeds in the database |
| `follow <url>` | Follow an existing feed |
| `following` | List feeds you are currently following |
| `unfollow <url>` | Unfollow a feed |

```bash
npm start -- addfeed "Hacker News" https://hnrss.org/newest
npm start -- follow https://hnrss.org/newest
npm start -- following
```

### Aggregation

Start the background scraper. It fetches feeds on a rotating basis at the given interval:

```bash
npm start -- agg 1m
```

Supported duration units: `ms`, `s`, `m`, `h`. Press `Ctrl+C` to stop.

### Browsing posts

Show the latest posts from feeds you follow:

```bash
npm start -- browse        # shows 2 posts (default)
npm start -- browse 10     # shows 10 posts
```

---

## Example workflow

```bash
# 1. Create an account
npm start -- register alice

# 2. Add some feeds
npm start -- addfeed "Hacker News" https://hnrss.org/newest
npm start -- addfeed "Go Blog" https://go.dev/blog/feed.atom

# 3. Run the aggregator for a bit (Ctrl+C to stop)
npm start -- agg 30s

# 4. Browse the latest posts
npm start -- browse 5
```
