# 📘 Chapter 12: Advanced ACID Strategies

## 🎯 Chapter Goals

* ACID beyond basics
* **Deadlocks** & **solutions**
* **Distributed Transactions**
* **ACID vs BASE** (NoSQL comparison)
* Real-world Node.js strategies

---

## 🔹 1. Deadlocks

👉 **Deadlock** = Two or more transactions waiting for each other forever.

### Example:

* Transaction A → Locks **Account 1** → waiting for **Account 2**
* Transaction B → Locks **Account 2** → waiting for **Account 1**

🚨 Both stuck = deadlock

### Node.js Simulation

```js
// Txn A: Transfer 100 from 1 -> 2
db.run("BEGIN TRANSACTION");
db.run("UPDATE accounts SET balance = balance - 100 WHERE id = 1");
// wait before updating account 2...

// Txn B: Transfer 50 from 2 -> 1
db.run("BEGIN TRANSACTION");
db.run("UPDATE accounts SET balance = balance - 50 WHERE id = 2");
// both waiting => deadlock
```

### 🔧 Solutions

1. **Timeouts** – Abort after waiting too long
2. **Consistent Lock Ordering** – Always lock smallest ID first
3. **Retry Logic** – Re-run transaction after deadlock

---

## 🔹 2. Distributed Transactions

👉 When multiple databases/services involved → harder to keep ACID.

### Example:

* **Bank System** + **E-commerce System**
* Transfer money (DB1) → Confirm order (DB2)

### Problem:

If DB1 success but DB2 fails → Inconsistent state 🚨

### Solutions:

1. **Two-Phase Commit (2PC)**

   * Phase 1: Prepare (all DBs say “ready”)
   * Phase 2: Commit (all finalize)
   * Reliable but **slow**

2. **Sagas** (Microservices)

   * Break transaction into smaller steps
   * If one step fails → run **compensating transaction** to undo previous steps

---

## 🔹 3. ACID vs BASE

👉 Some databases (like MongoDB, Cassandra) use **BASE** instead of ACID.

* **ACID** → Strong consistency, safe transactions
* **BASE** → Basically Available, Soft state, Eventual consistency

| Feature      | ACID (SQL, PostgreSQL, MySQL) | BASE (NoSQL, Cassandra, DynamoDB)  |
| ------------ | ----------------------------- | ---------------------------------- |
| Consistency  | Strong                        | Eventual                           |
| Transactions | Supported                     | Limited / custom                   |
| Speed        | Slower (safety)               | Faster (scalability)               |
| Use Case     | Banking, Orders, Payments     | Big data, Social networks, Caching |

---

## 🔹 4. Node.js Best Practices for ACID

1. Always use **transactions** for critical updates
2. Add **retry logic** for deadlocks & network errors
3. Use **connection pooling** (e.g. `pg-pool` for PostgreSQL)
4. For distributed systems → prefer **Saga pattern** over 2PC (scalable)
5. Backups + Replication = Durability boost



