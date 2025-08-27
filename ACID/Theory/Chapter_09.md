# 📘 Chapter 9: Isolation Deep Dive

## 🔹 Recap

👉 **Atomicity** = All or Nothing
👉 **Consistency** = Always valid state
👉 **Isolation** = Transactions එකක් run වෙද්දී, වෙන transaction එකකට **effect** වෙන්න බෑ

---

## 🔹 Why Isolation is Important?

* Multiple users එකම වෙලාවට DB access කරනවා
* Without isolation → Data corrupt, inconsistent
* With isolation → Each transaction **feels like it’s running alone**

---

## 🔹 Common Problems Without Isolation

1. **Dirty Read**

   * Transaction A update කරනවා (not committed)
   * Transaction B read කරනවා
   * Transaction A rollback → B read කල data invalid 🚨

2. **Non-Repeatable Read**

   * Transaction A read balance = 1000
   * Transaction B update balance = 500
   * Transaction A read again → balance = 500
   * 🚨 Same query → Different result

3. **Phantom Read**

   * Transaction A read orders count = 5
   * Transaction B insert new order
   * Transaction A read again → count = 6
   * 🚨 Extra "phantom" row appeared

4. **Lost Update**

   * Transaction A read balance = 1000 → deduct 200 → save 800
   * Transaction B read balance = 1000 → deduct 300 → save 700
   * Final balance should be 500 → but ends up 700 🚨

---

## 🔹 SQL Isolation Levels

1. **Read Uncommitted** → Dirty reads allowed
2. **Read Committed** → Prevent dirty reads
3. **Repeatable Read** → Prevent dirty + non-repeatable reads
4. **Serializable** → Prevent dirty + non-repeatable + phantom

---

## 🔹 Node.js Practical Simulation

SQLite default isolation level = **SERIALIZABLE**, but we can simulate problems.

---

### 1. Dirty Read Simulation

```js
// Transaction A - Update balance (not committed yet)
app.post('/txn-a-update', (req, res) => {
  db.run("BEGIN TRANSACTION");
  db.run("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
  res.send("Transaction A updated (not committed)");
});

// Transaction B - Read balance while A not committed
app.get('/txn-b-read', (req, res) => {
  db.get("SELECT balance FROM accounts WHERE id = 1", (err, row) => {
    res.send(`Transaction B sees balance: ${row.balance}`);
  });
});

// Commit / Rollback A
app.post('/txn-a-commit', (req, res) => {
  db.run("COMMIT");
  res.send("Transaction A committed");
});
app.post('/txn-a-rollback', (req, res) => {
  db.run("ROLLBACK");
  res.send("Transaction A rolled back");
});
```

**Test**

1. Run `/txn-a-update`
2. Run `/txn-b-read` → See updated balance (dirty read)
3. Run `/txn-a-rollback` → Balance should revert, but B already saw wrong value 🚨

---

### 2. Lost Update Simulation

```js
app.post('/lost-update', (req, res) => {
  const { amount } = req.body;

  db.serialize(() => {
    db.get("SELECT balance FROM accounts WHERE id = 1", (err, row) => {
      const newBalance = row.balance - amount;

      // Simulate delay
      setTimeout(() => {
        db.run("UPDATE accounts SET balance = ? WHERE id = 1", [newBalance], () => {
          res.send(`Updated balance to ${newBalance}`);
        });
      }, 2000);
    });
  });
});
```

**Test**

1. Call `/lost-update` twice quickly with amounts 200 + 300
2. Expect final balance = old - 500
3. Actual final balance = only one update kept (Lost update 🚨)

---

### 3. Preventing Lost Update (Using Transactions + Locks)

```js
app.post('/safe-update', (req, res) => {
  const { amount } = req.body;

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION"); // Lock row

    db.get("SELECT balance FROM accounts WHERE id = 1", (err, row) => {
      if (!row || row.balance < amount) {
        db.run("ROLLBACK");
        return res.status(400).send("Not enough funds");
      }

      const newBalance = row.balance - amount;
      db.run("UPDATE accounts SET balance = ? WHERE id = 1", [newBalance], (err2) => {
        if (err2) {
          db.run("ROLLBACK");
          return res.status(500).send("Failed update");
        }

        db.run("COMMIT");
        res.send(`Safely updated balance to ${newBalance}`);
      });
    });
  });
});
```

Now → Even if multiple requests fire, second transaction will **wait until first commits**. ✅

