const express = require('express');
const db = require('./db');
const app = express();

app.use(express.json());

// Atomic Bank Transfer
app.post('/transfer', (req, res) => {
  const { fromId, toId, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId], function(err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).send("Error deducting balance");
      }

      // Simulate error if transferring more than 3000
      if (amount > 3000) {
        db.run("ROLLBACK");
        return res.status(400).send("Transfer limit exceeded, rolled back");
      }

      db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId], function(err2) {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Error adding balance");
        }

        db.run("COMMIT");
        res.send("Transfer successful");
      });
    });
  });
});

app.get('/accounts', (req, res) => {
  db.all("SELECT * FROM accounts", [], (err, rows) => {
    res.json(rows);
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));