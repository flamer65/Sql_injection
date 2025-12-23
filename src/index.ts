import { Client } from "pg";
import express from "express";

const app = express();
app.use(express.json());

const client = new Client({
    host: "localhost",
    port: 5433,
    user: "postgres",
    password: "root1234",
    database: "usersschema",
});
const connect = async () => await client.connect();
// Connect once at startup
connect()
    .then(() => {
        console.log("Database connected");
    })
    .catch((err) => console.error("Connection error", err));

app.post("/register", async (req, res) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        // Vulnerable: uses string interpolation instead of parameterized queries
        const query = `INSERT INTO users (username, email, password) VALUES ('${username}', '${email}', '${password}')`;
        // use this as safe for the query
        //const query = `INSERT INTO users (username, email, password) VALUES ($1, $2, $3);`;
         //await client.query(query, [username, email, password]);
        console.log("Executing:", query);
        await client.query(query);
        res.send("User registered successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error registering user");
    }
});
app.get('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        // Vulnerable: uses string interpolation instead of parameterized queries
        const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
        //how to prevent it 
        // const query = `SELECT * FROM users WHERE email = $1 AND password = $2`;
        console.log("Executing:", query);
        //await client.query(query, [email, password]);
        const result = await client.query(query);
        res.send(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).send("Error logging in user");
    }
})

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
