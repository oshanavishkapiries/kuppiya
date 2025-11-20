# Module 10: Practical Exercises

## Table of Contents
1. [Introduction](#introduction)
2. [Setup and Tools](#setup-and-tools)
3. [Exercise 1: Diagnosing a `StackOverflowError`](#exercise-1-diagnosing-a-stackoverflowerro)
4. [Exercise 2: Diagnosing an `OutOfMemoryError` (Heap Space)](#exercise-2-diagnosing-an-outofmemoryerror-heap-space)
5. [Exercise 3: Analyzing Bytecode with `javap`](#exercise-3-analyzing-bytecode-with-javap)
6. [Exercise 4: GC Tuning for Throughput](#exercise-4-gc-tuning-for-throughput)
7. [Exercise 5: GC Tuning for Latency](#exercise-5-gc-tuning-for-latency)
8. [Exercise 6: Diagnosing a Deadlock](#exercise-6-diagnosing-a-deadlock)
9. [Exercise 7: Finding a CPU Bottleneck](#exercise-7-finding-a-cpu-bottleneck)
10. [Exercise 8: Exploring Virtual Threads](#exercise-8-exploring-virtual-threads)

## Introduction

This final module provides a set of hands-on exercises to solidify the concepts learned throughout this guide. The best way to master the JVM is by getting your hands dirty, breaking things, and learning how to fix them.

## Setup and Tools

Before you begin, make sure you have the following installed:

-   **JDK 17 or later**: Provides modern tools and GC algorithms. A JDK with Java 21 is required for the virtual threads exercise.
-   **An IDE**: IntelliJ IDEA, Eclipse, or VS Code.
-   **Apache JMeter or a similar load testing tool**: For the performance tuning exercises.
-   **Eclipse Memory Analyzer (MAT)**: Download from [the official site](https://eclipse.dev/mat/).

You should also be comfortable opening a command line or terminal.

---

## Exercise 1: Diagnosing a `StackOverflowError`

**Goal**: Understand how uncontrolled recursion exhausts stack memory and how to control stack size.

1.  **Write the Code**: Create a Java class with a recursive method that never terminates.

    ```java
    public class StackOverflowApp {
        public static void main(String[] args) {
            System.out.println("Starting recursive call...");
            try {
                recursiveMethod(0);
            } catch (StackOverflowError e) {
                System.out.println("Caught StackOverflowError!");
                // The depth will vary based on JVM and OS
                System.out.println("Maximum recursion depth was not tracked in this simple example.");
            }
        }

        public static void recursiveMethod(int depth) {
            // No base case, will recurse forever
            recursiveMethod(depth + 1);
        }
    }
    ```

2.  **Run and Observe**: Compile and run the code. It will crash quickly with a `StackOverflowError`.

    ```bash
    javac StackOverflowApp.java
    java StackOverflowApp
    ```

3.  **Experiment with Stack Size**: Run the application again, but this time, experiment with the `-Xss` flag to change the stack size.
    -   **Smaller Stack**: `java -Xss128k StackOverflowApp` (Should crash earlier).
    -   **Larger Stack**: `java -Xss1m StackOverflowApp` (Should take longer to crash).

**Questions**:
-   What is a stack frame? Why does infinite recursion cause an error?
-   How does the `-Xss` flag affect the program's execution?

---

## Exercise 2: Diagnosing an `OutOfMemoryError` (Heap Space)

**Goal**: Simulate a memory leak, generate a heap dump, and analyze it with MAT to find the cause.

1.  **Write the Leaky Code**: Create a program that continuously adds objects to a static list.

    ```java
    import java.util.ArrayList;
    import java.util.List;

    public class MemoryLeakApp {
        private static List<byte[]> leakyList = new ArrayList<>();

        public static void main(String[] args) throws InterruptedException {
            System.out.println("Starting memory leak simulation...");
            while (true) {
                // Allocate 1MB and add it to a list that is never cleared
                leakyList.add(new byte[1024 * 1024]);
                System.out.println("Current heap usage is growing...");
                Thread.sleep(100); // Slow it down a bit
            }
        }
    }
    ```

2.  **Run and Generate a Heap Dump**: Compile the code. Run it with a small heap and the flag to generate a heap dump on OOM.

    ```bash
    javac MemoryLeakApp.java
    java -Xmx128m -XX:+HeapDumpOnOutOfMemoryError MemoryLeakApp
    ```
    The program will run for a few seconds and then crash, creating a `.hprof` file (e.g., `java_pidXXXX.hprof`).

3.  **Analyze with MAT**:
    -   Open the `.hprof` file in Eclipse MAT.
    -   On the welcome screen, choose the "Leak Suspects Report" and click "Finish".
    -   MAT will analyze the dump and point directly to the `leakyList` as the problem.
    -   Explore the "Dominator Tree" view to see how `leakyList` is holding onto most of the heap.

**Questions**:
-   Why is a `static` collection a common source of memory leaks?
-   What is the difference between "Shallow Heap" and "Retained Heap" in MAT?

---

## Exercise 3: Analyzing Bytecode with `javap`

**Goal**: Understand how common Java language features are translated into bytecode.

1.  **Write the Code**: Create a class with a few different constructs.

    ```java
    public class BytecodeExplorer {
        public void stringManipulation() {
            String greeting = "Hello";
            for (int i = 0; i < 5; i++) {
                greeting += "!";
            }
            System.out.println(greeting);
        }

        public int conditionalLogic(int a, int b) {
            if (a > b) {
                return a;
            } else {
                return b;
            }
        }
    }
    ```

2.  **Disassemble**: Compile the class and then use `javap` to view the bytecode.

    ```bash
    javac BytecodeExplorer.java
    javap -c BytecodeExplorer
    ```

3.  **Analyze the Output**:
    -   Look at the `stringManipulation` method. Can you see the compiler's optimization that uses `StringBuilder`?
    -   Look at the `conditionalLogic` method. Identify the branching instructions (like `if_icmpgt`).

**Questions**:
-   What instruction is used to call `System.out.println`?
-   How are the `if/else` branches implemented in bytecode?

---

## Exercise 4: GC Tuning for Throughput

**Goal**: Compare the performance of different GC algorithms for a throughput-oriented task.

1.  **Write a CPU-intensive Task**:

    ```java
    public class ThroughputApp {
        public static void main(String[] args) {
            long startTime = System.currentTimeMillis();
            // Simulate some heavy work
            for (int i = 0; i < 100_000_000; i++) {
                String s = new String("object" + i);
                if (i % 10000 == 0) {
                    System.out.println("Processed " + i + " objects.");
                }
            }
            long endTime = System.currentTimeMillis();
            System.out.println("Total time: " + (endTime - startTime) + " ms");
        }
    }
    ```

2.  **Benchmark Different GCs**: Compile the code. Run it with a fixed heap size and test different GCs. Measure the total execution time for each.
    -   **Serial GC**: `time java -Xmx512m -XX:+UseSerialGC ThroughputApp`
    -   **Parallel GC**: `time java -Xmx512m -XX:+UseParallelGC ThroughputApp`
    -   **G1 GC**: `time java -Xmx512m -XX:+UseG1GC ThroughputApp`

**Questions**:
-   Which GC performed the best (had the shortest total execution time)?
-   Why is the Parallel GC often called the "throughput collector"?

---

## Exercise 5: GC Tuning for Latency

**Goal**: Understand how to use G1's pause time goal to improve application responsiveness.

1.  **Write a Latency-Sensitive Task**: This is harder to simulate simply, but we can create a program that logs GC pauses.

    ```java
    // This is a conceptual exercise. A real-world scenario would involve a web server.
    // We will use GC logging to observe pause times.
    public class LatencyApp {
        public static void main(String[] args) throws InterruptedException {
            System.out.println("Simulating a latency-sensitive application...");
            for (int i = 0; i < 600; i++) { // Run for 1 minute
                // Create a lot of objects to trigger GC
                byte[] temp = new byte[1024 * 1024];
                Thread.sleep(100);
            }
        }
    }
    ```

2.  **Run with G1 and Log Pauses**: Compile the code. Run it with G1 and enable GC logging.
    -   **Default G1**: `java -Xmx256m -XX:+UseG1GC -Xlog:gc*:gc.log LatencyApp`
    -   **Tuned G1**: `java -Xmx256m -XX:+UseG1GC -XX:MaxGCPauseMillis=50 -Xlog:gc*:gc_tuned.log LatencyApp`

3.  **Analyze the Logs**: Open `gc.log` and `gc_tuned.log`. Search for "Pause Young". Compare the pause durations between the two runs.

**Questions**:
-   Did the `-XX:MaxGCPauseMillis` flag successfully reduce the maximum pause time?
-   What might be the trade-off of setting a very low pause time goal? (Hint: throughput might decrease).

---

## Exercise 6: Diagnosing a Deadlock

**Goal**: Create a deadlock, detect it, and understand how to analyze it with a thread dump.

1.  **Write Deadlocking Code**:

    ```java
    public class DeadlockApp {
        private static final Object lock1 = new Object();
        private static final Object lock2 = new Object();

        public static void main(String[] args) {
            Thread thread1 = new Thread(() -> {
                synchronized (lock1) {
                    System.out.println("Thread 1: Holding lock 1...");
                    try { Thread.sleep(100); } catch (InterruptedException e) {}
                    System.out.println("Thread 1: Waiting for lock 2...");
                    synchronized (lock2) {
                        System.out.println("Thread 1: Acquired lock 2.");
                    }
                }
            });

            Thread thread2 = new Thread(() -> {
                synchronized (lock2) {
                    System.out.println("Thread 2: Holding lock 2...");
                    try { Thread.sleep(100); } catch (InterruptedException e) {}
                    System.out.println("Thread 2: Waiting for lock 1...");
                    synchronized (lock1) {
                        System.out.println("Thread 2: Acquired lock 1.");
                    }
                }
            });

            thread1.start();
            thread2.start();
        }
    }
    ```

2.  **Run and Take a Thread Dump**: Compile and run the code. The application will hang.
    -   Find the process ID (PID) using `jps`.
    -   Take a thread dump: `jstack <PID>`.

3.  **Analyze the Thread Dump**: Scroll to the bottom of the `jstack` output. You will see a "Found one Java-level deadlock" section that clearly explains which threads are deadlocked and which locks they are waiting for.

**Questions**:
-   What is the circular wait condition that causes this deadlock?
-   How can you refactor the code to avoid this deadlock? (Hint: enforce a consistent lock acquisition order).

---

## Exercise 7: Finding a CPU Bottleneck

**Goal**: Use a profiler (JFR/JMC) to find a performance bottleneck in a CPU-bound application.

1.  **Write the Code**:

    ```java
    import java.util.ArrayList;
    import java.util.List;

    public class CpuIntensiveApp {
        public static void main(String[] args) throws InterruptedException {
            System.out.println("Starting CPU intensive task...");
            while (true) {
                performHeavyCalculation();
                performLighterCalculation();
                Thread.sleep(50);
            }
        }

        public static void performHeavyCalculation() {
            // Inefficiently check for primes
            List<Integer> primes = new ArrayList<>();
            for (int i = 2; i < 50000; i++) {
                boolean isPrime = true;
                for (int j = 2; j < i; j++) {
                    if (i % j == 0) {
                        isPrime = false;
                        break;
                    }
                }
                if (isPrime) primes.add(i);
            }
        }

        public static void performLighterCalculation() {
            // Simple loop
            long sum = 0;
            for (int i = 0; i < 1000; i++) {
                sum += i;
            }
        }
    }
    ```

2.  **Run and Profile with JFR**: Compile and run the application.
    -   Find its PID with `jps`.
    -   Start a JFR recording: `jcmd <PID> JFR.start duration=30s filename=cpu_profile.jfr`
    -   Let it run for 30 seconds.

3.  **Analyze in JMC**:
    -   Open `cpu_profile.jfr` in JDK Mission Control.
    -   Go to the "Method Profiling" tab.
    -   The results will clearly show that almost all the execution time is spent inside the `performHeavyCalculation` method.

**Questions**:
-   What makes the `performHeavyCalculation` method so inefficient?
-   How could you optimize the prime number calculation algorithm?

---

## Exercise 8: Exploring Virtual Threads

**Goal**: See the power of virtual threads for handling a large number of concurrent, blocking tasks. (Requires JDK 21+)

1.  **Write the Code**:

    ```java
    import java.time.Duration;
    import java.util.concurrent.Executors;
    import java.util.stream.IntStream;

    public class VirtualThreadsApp {
        public static void main(String[] args) {
            long startTime = System.currentTimeMillis();
            
            // Use a virtual-thread-per-task executor
            try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
                IntStream.range(0, 100_000).forEach(i -> {
                    executor.submit(() -> {
                        // Simulate a blocking I/O call
                        Thread.sleep(Duration.ofSeconds(1));
                        if (i % 10000 == 0) {
                            System.out.println("Task " + i + " complete.");
                        }
                        return i;
                    });
                });
            } // The try-with-resources block waits for all tasks to finish

            long endTime = System.currentTimeMillis();
            System.out.println("Total time: " + (endTime - startTime) + " ms");
        }
    }
    ```

2.  **Run and Observe**: Compile and run the code.
    -   `javac VirtualThreadsApp.java`
    -   `java VirtualThreadsApp`
    -   Observe how the application handles 100,000 concurrent sleeping tasks with ease. The total time should be just over 1 second.

3.  **Challenge**: Try to rewrite this using a cached thread pool (`Executors.newCachedThreadPool()`) which uses platform threads. What happens? (Your machine will likely run out of memory or crash).

**Questions**:
-   Why can the JVM handle so many virtual threads but not so many platform threads?
-   What does it mean for a virtual thread to be "unmounted" from its carrier thread?
