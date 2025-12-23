# SQL Injection Demo

A demonstration project showing how SQL injection attacks work and how to prevent them using Node.js, Express, and PostgreSQL.

## 🗄️ Database Setup

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
psql -U postgres
```

```sql
CREATE DATABASE usersschema;
\c usersschema

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100),
    email VARCHAR(100),
    password VARCHAR(100)
);

-- Insert test user
INSERT INTO users (username, email, password) VALUES ('admin', 'admin@example.com', 'secret123');
```

### Option 2: Neon (Cloud PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. Update `src/index.ts` with your connection details:

```typescript
const client = new Client({
  connectionString:
    "postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require",
});
```

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Run the server
npm run dev
```

Server starts at `http://localhost:3000`

---

## 💉 SQL Injection Demo

### Vulnerable Endpoint: `/register`

The register endpoint uses **string interpolation** (VULNERABLE):

```typescript
const query = `INSERT INTO users VALUES ('${username}', '${email}', '${password}')`;
```

### Creating a User (Normal Request)

Send a POST request to `http://localhost:3000/register`:

```json
{
  "username": "user1",
  "email": "user@gmail.com",
  "password": "userpassword"
}
```

Response: `User registered successfully`

---

### Attack Example

Send this malicious payload in Postman:

```json
{
  "username": "user1",
  "email": "user@gmail.com",
  "password": "'); DELETE FROM users; --"
}
```

This attempts to:

1. Close the VALUES with `')`
2. Execute `DELETE FROM users`
3. Comment out the rest with `--`

> ⚠️ **Note**: PostgreSQL's Node.js driver blocks multiple statements, so DELETE won't execute. But authentication bypass WILL work!

### Authentication Bypass (Password Bypass)

The `/login` endpoint has a vulnerable query:

```typescript
const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
```

**Normal login request:**

```json
{
  "email": "user@gmail.com",
  "password": "userpassword"
}
```

**Attack: Bypass password with SQL injection:**

```json
{
  "email": "user@gmail.com",
  "password": "' OR '1'='1"
}
```

#### How it works:

The query becomes:

```sql
SELECT * FROM users WHERE email = 'user@gmail.com' AND password = '' OR '1'='1'
```

Breaking it down:

1. `password = ''` → Empty string (false)
2. `OR '1'='1'` → Always true!

Since `OR` has lower precedence, the entire WHERE clause evaluates to **true**, returning the user's data **without knowing the password**!

**Result:** The attacker gets access to the account!

---

## ✅ How to Fix: Parameterized Queries

Replace vulnerable code:

```typescript
// ❌ VULNERABLE - String interpolation
const query = `INSERT INTO users VALUES ('${username}', '${email}', '${password}')`;
await client.query(query);

// ✅ SAFE - Parameterized query
const query = `INSERT INTO users VALUES ($1, $2, $3)`;
await client.query(query, [username, email, password]);
```

### How it works:

| Placeholder | Array Index | Value    |
| ----------- | ----------- | -------- |
| `$1`        | `[0]`       | username |
| `$2`        | `[1]`       | email    |
| `$3`        | `[2]`       | password |

PostgreSQL treats parameters as **data**, not SQL commands. Even if someone sends `'); DELETE FROM users; --`, it's stored as literal text.

---

## 🛡️ Security Best Practices

1. **Always use parameterized queries** - Never concatenate user input into SQL
2. **Validate input** - Check data types and formats
3. **Use ORMs** - Prisma, TypeORM, Sequelize handle escaping automatically
4. **Least privilege** - Database user should only have necessary permissions
5. **Error handling** - Never expose SQL errors to users
