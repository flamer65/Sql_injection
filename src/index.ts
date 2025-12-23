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
        console.log("Executing:", query);
        const result = await client.query(query);
        res.send("User registered successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error registering user");
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
