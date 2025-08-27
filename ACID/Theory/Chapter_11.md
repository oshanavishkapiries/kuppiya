# 📘 Chapter 11: Real-World ACID Project Simulation

## 🎯 Chapter Goals

* Theory එකෙන් practical **full backend system** එකකට යන්න
* ACID problems simulate කරන්න
* Node.js backend එකෙන් **Bank + E-commerce** examples test කරන්න
* Error handling + retry logic + safe transactions add කරන්න

---

## 🔹 Project Idea

අපි build කරන system එකේ main modules:

1. **Bank Accounts**

   * Deposit / Withdraw / Transfer
   * Must be ACID safe

2. **E-commerce Orders**

   * Place order → deduct balance + reduce stock
   * Must rollback if any step fails

---

## 🔹 Step 1: Setup Database

```js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// Tables
db.serialize(() => {
  db.run("CREATE TABLE accounts (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER)");
  db.run("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, stock INTEGER, price INTEGER)");
  db.run("CREATE TABLE orders (id INTEGER PRIMARY KEY, accountId INTEGER, productId INTEGER, qty INTEGER, total INTEGER)");

  // Seed data
  db.run("INSERT INTO accounts (name, balance) VALUES ('Alice', 1000), ('Bob', 500)");
  db.run("INSERT INTO products (name, stock, price) VALUES ('Laptop', 5, 300), ('Phone', 10, 200)");
});
```

---

## 🔹 Step 2: Bank Transfer Simulation (ACID Safe)

```js
app.post('/bank-transfer', (req, res) => {
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

        db.run("COMMIT");
        res.send("Transfer success ✅");
      });
    });
  });
});
```

✅ Atomicity, Consistency, Isolation, Durability check කරන්න පුළුවන්

---

## 🔹 Step 3: Place Order (E-commerce Example)

```js
app.post('/place-order', (req, res) => {
  const { accountId, productId, qty } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Check product availability
    db.get("SELECT stock, price FROM products WHERE id = ?", [productId], (err, product) => {
      if (!product || product.stock < qty) {
        db.run("ROLLBACK");
        return res.status(400).send("Out of stock");
      }

      const total = product.price * qty;

      // 2. Check account balance
      db.get("SELECT balance FROM accounts WHERE id = ?", [accountId], (err2, acc) => {
        if (!acc || acc.balance < total) {
          db.run("ROLLBACK");
          return res.status(400).send("Insufficient funds");
        }

        // 3. Deduct balance + reduce stock + insert order
        db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [total, accountId]);
        db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [qty, productId]);
        db.run("INSERT INTO orders (accountId, productId, qty, total) VALUES (?, ?, ?, ?)", 
          [accountId, productId, qty, total], (err3) => {
          if (err3) {
            db.run("ROLLBACK");
            return res.status(500).send("Order failed");
          }

          db.run("COMMIT");
          res.send("Order placed ✅");
        });
      });
    });
  });
});
```

---

## 🔹 Step 4: Simulate Failure (Edge Case)

### Example – Crash before order finishes

```js
app.post('/simulate-order-crash', (req, res) => {
  db.run("BEGIN TRANSACTION");
  db.run("UPDATE accounts SET balance = balance - 200 WHERE id = 1");
  process.exit(1);  // Crash here 🚨
});
```

➡️ Restart server → Balance unchanged (because no COMMIT) ✅

---

## 🔹 Step 5: Retry Logic for Reliability

When concurrency issues or deadlocks occur → we retry transaction

```js
function runWithRetry(operation, retries = 3) {
  let attempt = 0;

  function execute(resolve, reject) {
    attempt++;
    operation((err, result) => {
      if (err && attempt < retries) {
        console.log(`Retrying... attempt ${attempt}`);
        return execute(resolve, reject);
      }
      if (err) return reject(err);
      resolve(result);
    });
  }

  return new Promise(execute);
}
```

Use this wrapper around order/bank-transfer transactions.

