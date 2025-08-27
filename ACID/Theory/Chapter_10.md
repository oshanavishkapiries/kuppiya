# 📘 Chapter 10: Durability Deep Dive

## 🔹 Recap

* **Atomicity** → All or nothing
* **Consistency** → Always valid state
* **Isolation** → Transactions don’t interfere
* **Durability** → Once committed → Data save වෙලා තියෙන්න ඕන (power off/crash but data safe)

---

## 🔹 Why Durability is Important?

Imagine:

1. Bank transaction success → “Transfer done ✅”
2. Suddenly server crash before writing to disk
3. After restart → Transaction **vanished** 🚨

👉 Without durability → User trust = 0
👉 With durability → Safe even after crash

---

## 🔹 How DB Ensures Durability?

1. **WAL (Write-Ahead Log)**

   * Changes log file එකට **before** applying to main DB
   * Crash → Replay log → Recover

2. **Commit = Permanent**

   * Until `COMMIT`, nothing permanent
   * After `COMMIT`, safe in storage

3. **Backups & Replication**

   * Backup copies → Crash recovery
   * Replication → Data safe in multiple nodes

---

## 🔹 SQLite & Durability

* SQLite uses **WAL mode** for durability
* If crash occurs → WAL log replay after restart

Enable WAL mode in Node.js:

```js
db.run("PRAGMA journal_mode = WAL;");
```

---

## 🔹 Node.js Practical – Durability Simulation

### 1. Normal Transaction

```js
app.post('/durable-transfer', (req, res) => {
  const { fromId, toId, amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.get("SELECT balance FROM accounts WHERE id = ?", [fromId], (err, row) => {
      if (!row || row.balance < amount) {
        db.run("ROLLBACK");
        return res.status(400).send("Insufficient funds");
      }

      db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId]);
      db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId], (err2) => {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Transfer failed");
        }

        db.run("COMMIT");  // ✅ Once committed → permanent
        res.send("Durable transfer complete");
      });
    });
  });
});
```

---

### 2. Simulate Crash Before Commit

```js
app.post('/simulate-crash', (req, res) => {
  db.run("BEGIN TRANSACTION");
  db.run("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
  
  // Crash before commit
  process.exit(1);  // 🚨 Simulate server crash
});
```

➡️ Restart server → Balance unchanged (because no `COMMIT`)

---

### 3. Simulate Crash After Commit

```js
app.post('/simulate-crash-after', (req, res) => {
  db.run("BEGIN TRANSACTION");
  db.run("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
  db.run("COMMIT");

  // Simulate crash AFTER commit
  process.exit(1);
});
```

➡️ Restart server → Balance updated (because WAL logged + committed) ✅

---

## 🔹 Extra Durability Techniques

1. **Backups** → Daily DB backups
2. **Replication** → Multiple servers store data
3. **Cloud Storage** → AWS RDS, Firestore → Built-in durability

