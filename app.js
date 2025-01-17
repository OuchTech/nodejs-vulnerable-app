const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const db = new sqlite3.Database(":memory:");

// Initialisation de la base de données
db.serialize(() => {
    db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)");
    db.run("INSERT INTO users (username, password) VALUES ('admin', '12345')");
    db.run("INSERT INTO users (username, password) VALUES ('user', 'password')");
});

// Endpoint vulnérable à l'injection SQL
app.get("/login", (req, res) => {
    const { username, password } = req.query;
    const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    console.log("Executing query:", query);

    db.all(query, (err, rows) => {
        if (err) return res.status(500).send("Erreur serveur");
        if (rows.length > 0) res.send("Connexion réussie !");
        else res.send("Échec de la connexion.");
    });
});

// Endpoint vulnérable à l'XSS
app.get("/welcome", (req, res) => {
    const name = req.query.name || "Visiteur";
    res.send(`<h1>Bienvenue ${name}</h1>`);
});

// Endpoint vulnérable à une mauvaise validation des entrées
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send("Nom d'utilisateur ou mot de passe manquant");
    }

    // Mauvaise pratique : aucune validation supplémentaire sur les données
    db.run(`INSERT INTO users (username, password) VALUES ('${username}', '${password}')`, (err) => {
        if (err) return res.status(500).send("Erreur serveur");
        res.send("Utilisateur enregistré !");
    });
});

// Mauvaise gestion des mots de passe
app.get("/users", (req, res) => {
    db.all("SELECT username, password FROM users", (err, rows) => {
        if (err) return res.status(500).send("Erreur serveur");

        // Expose des mots de passe en clair
        res.json(rows);
    });
});

// Démarrage de l'application
app.listen(3000, () => {
    console.log("Application en cours d'exécution sur http://localhost:3000");
});
