# 📘 Chapter 8: Consistency Deep Dive

## 🔹 Recap

Consistency = **DB state එක valid rules break නොකර තියාගන්න එක**.
👉 Atomicity එක focus කරනවා **All or Nothing** කියලා.
👉 Consistency එක focus කරනවා **valid state** maintain කරන එක.

---

## 🔹 Why Consistency is Important?

1. **Invalid Data Issue**

   * Bank account balance < 0 → **Invalid State**
   * Order total < 0 → **Invalid State**
   * Student age = -10 → **Invalid State**

2. **Business Rules**

   * Stock එක negative වෙන්න බෑ
   * Email unique වෙන්න ඕන
   * Transaction date future එකට යන්න බෑ

3. **Database Constraints**

   * **NOT NULL**
   * **CHECK**
   * **FOREIGN KEY**
   * **UNIQUE**

---

## 🔹 Example Scenarios

1. **Bank Transfer** → Balance negative වෙන්න බෑ
2. **E-commerce Order** → Stock negative වෙන්න බෑ
3. **University DB** → Student DOB future එකක් වෙන්න බෑ

---

## 🔹 Node.js Practical – Consistency with Constraints

අපි SQL constraints + Node.js validation එක දෙකම combine කරලා use කරන්නම්.

---

### 1. Add Constraints to Tables

`db.js`

```js
db.serialize(() => {
  // Accounts table with balance check
  db.run("CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, name TEXT, balance INTEGER CHECK(balance >= 0))");

  // Products table with stock check
  db.run("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY, name TEXT, stock INTEGER CHECK(stock >= 0))");

  // Orders table with FK constraints
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY, 
    customerId INTEGER, 
    productId INTEGER, 
    quantity INTEGER CHECK(quantity > 0), 
    total INTEGER CHECK(total >= 0),
    FOREIGN KEY(customerId) REFERENCES accounts(id),
    FOREIGN KEY(productId) REFERENCES products(id)
  )`);
});
```

---

### 2. API: Consistent Order Placement

`server.js`

```js
app.post('/consistent-order', (req, res) => {
  const { customerId, productId, quantity, price } = req.body;
  const total = quantity * price;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. Check stock
    db.get("SELECT stock FROM products WHERE id = ?", [productId], (err, row) => {
      if (err || !row || row.stock < quantity) {
        db.run("ROLLBACK");
        return res.status(400).send("Consistency violation: Not enough stock");
      }

      // 2. Check customer funds
      db.get("SELECT balance FROM accounts WHERE id = ?", [customerId], (err2, row2) => {
        if (err2 || !row2 || row2.balance < total) {
          db.run("ROLLBACK");
          return res.status(400).send("Consistency violation: Insufficient funds");
        }

        // 3. Perform updates
        db.run("UPDATE products SET stock = stock - ? WHERE id = ?", [quantity, productId]);
        db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [total, customerId]);
        db.run("INSERT INTO orders (customerId, productId, quantity, total) VALUES (?, ?, ?, ?)", 
          [customerId, productId, quantity, total], (err3) => {
          if (err3) {
            db.run("ROLLBACK");
            return res.status(500).send("Order failed");
          }

          db.run("COMMIT");
          res.send("Consistent order placed successfully");
        });
      });
    });
  });
});
```

---

### 3. Test Cases

1. **Valid Order**

   ```
   POST http://localhost:3000/consistent-order
   {
     "customerId": 1,
     "productId": 1,
     "quantity": 1,
     "price": 500
   }
   ```

   ✅ Stock reduce, balance deduct, order create

2. **Invalid Order (Insufficient Stock)**

   ```
   POST http://localhost:3000/consistent-order
   {
     "customerId": 1,
     "productId": 1,
     "quantity": 999,
     "price": 500
   }
   ```

   🚨 Rollback → Stock unchanged, no order created

3. **Invalid Order (Negative Quantity)**

   ```
   POST http://localhost:3000/consistent-order
   {
     "customerId": 1,
     "productId": 1,
     "quantity": -5,
     "price": 500
   }
   ```

   🚨 Blocked by **CHECK constraint**

---

## 🔹 Edge Cases

1. **Manual DB Update**

   * Try to insert invalid data directly → DB constraint will block

2. **App Validation Skip**

   * Even if Node.js validation missing → DB constraint ensures consistency

3. **Cascade Issues**

   * Example: Delete product → Orders with that product fail if FK not handled
   * Solution: Use `ON DELETE CASCADE` if business logic allows

