# Module 7: Performance Tuning

## Table of Contents
1. [Introduction to Performance Tuning](#introduction-to-performance-tuning)
2. [The Performance Tuning Methodology](#the-performance-tuning-methodology)
3. [Key Performance Metrics](#key-performance-metrics)
4. [JVM Startup Flags for Tuning](#jvm-startup-flags-for-tuning)
5. [Heap Sizing and Tuning](#heap-sizing-and-tuning)
6. [Garbage Collection Tuning](#garbage-collection-tuning)
7. [JIT Compiler Tuning](#jit-compiler-tuning)
8. [Profiling CPU and Memory](#profiling-cpu-and-memory)
9. [Common Performance Pitfalls](#common-performance-pitfalls)
10. [Practical Tuning Scenario](#practical-tuning-scenario)
11. [Key Takeaways](#key-takeaways)

## Introduction to Performance Tuning

JVM performance tuning is the process of adjusting various parameters of the JVM to optimize the performance of a Java application for a specific goal.

### Goals of Performance Tuning

- **Reduce Latency**: Minimize the time it takes to process a single request.
- **Increase Throughput**: Maximize the number of requests processed in a given time.
- **Decrease Memory Footprint**: Reduce the amount of memory the application consumes.
- **Improve Startup Time**: Make the application start faster.

It's often a trade-off. For example, tuning for high throughput might increase latency.

## The Performance Tuning Methodology

Effective tuning is a scientific process, not guesswork.

1. **Define Performance Goals**: What are you trying to achieve? (e.g., "reduce p99 latency to under 100ms").
2. **Measure Baseline Performance**: Profile the application under realistic load to find its current performance characteristics.
3. **Identify Bottlenecks**: Analyze the baseline data. Is the bottleneck CPU, memory (GC), I/O, or something else?
4. **Formulate a Hypothesis**: Propose a specific change to address the bottleneck (e.g., "increasing the heap size will reduce GC frequency").
5. **Make One Change at a Time**: Modify a single JVM flag or code section.
6. **Measure Again**: Rerun the performance test under the same conditions.
7. **Analyze Results**: Did the change help, hurt, or have no effect?
8. **Repeat**: Continue the cycle until performance goals are met.

## Key Performance Metrics

- **Latency**: Response time for individual operations. Often measured in percentiles (p50, p90, p99, p99.9).
- **Throughput**: Operations per unit of time (e.g., requests per second).
- **CPU Usage**: Percentage of CPU time consumed by the application.
- **Heap Usage**: How much memory is being used and how often GC occurs.
- **GC Pause Times**: Duration of "Stop-the-World" GC pauses.

## JVM Startup Flags for Tuning

These flags are the primary tools for JVM tuning.

### Basic Flags

- `-Xms<size>`: Initial heap size (e.g., `-Xms2g`).
- `-Xmx<size>`: Maximum heap size (e.g., `-Xmx8g`).
- `-Xss<size>`: Thread stack size (e.g., `-Xss256k`).

### GC Flags

- `-XX:+Use<GC_Algorithm>`: Selects the GC (e.g., `-XX:+UseG1GC`, `-XX:+UseZGC`).
- `-Xlog:gc*:<file>`: Logs GC activity to a file (Java 9+).

### JIT Compiler Flags

- `-XX:TieredStopAtLevel=<n>`: Stops tiered compilation at a certain level.
- `-XX:+PrintCompilation`: Logs JIT compilation activity.

### Other Useful Flags

- `-server`: A hint to the JVM to enable optimizations for long-running server applications (default on server-class machines).
- `-XX:+HeapDumpOnOutOfMemoryError`: Generates a heap dump file if an OOM error occurs.
- `-XX:HeapDumpPath=<path>`: Specifies the path for the heap dump file.

## Heap Sizing and Tuning

Properly sizing the heap is one of the most critical tuning activities.

### Best Practices

- **Set `-Xms` equal to `-Xmx`**:
    - `java -Xms4g -Xmx4g ...`
    - **Why?**: Prevents the heap from resizing at runtime, which can cause pauses. This is especially important for server applications.
- **Determine the Right Size**:
    - The heap should be large enough to hold the application's "live data set" comfortably.
    - A heap that is too small will cause frequent, expensive Full GCs.
    - A heap that is too large can lead to very long GC pauses when a Full GC does occur.
- **Sizing Young Generation**:
    - A larger Young Generation can reduce the promotion rate of short-lived objects to the Old Generation.
    - However, it can also increase the duration of Minor GC pauses.
    - Can be controlled with `-Xmn` or `-XX:NewRatio`.

## Garbage Collection Tuning

The goal of GC tuning is usually to minimize the impact of GC pauses on the application.

### Choosing a Collector

- **Throughput-focused (e.g., batch jobs)**: The **Parallel GC** (`-XX:+UseParallelGC`) is often a good choice. It prioritizes overall throughput over individual pause times.
- **Latency-sensitive (e.g., web services)**: **G1 GC** (`-XX:+UseG1GC`) is the modern default and provides a good balance. It can be tuned with a pause time goal (`-XX:MaxGCPauseMillis`).
- **Ultra-low Latency**: For applications with very large heaps and strict latency requirements, **ZGC** (`-XX:+UseZGC`) or **Shenandoah** (`-XX:+UseShenandoahGC`) are the best options.

### G1 Tuning Example

- **Set a Pause Time Goal**: `java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 MyApp`
    - This tells G1 to *try* to keep GC pauses under 200 milliseconds. This is a soft goal, not a hard guarantee.
- **Monitor and Adjust**: If G1 cannot meet the pause time goal, it may be because the application is allocating objects too quickly. You might need to increase the heap size or optimize the application's allocation patterns.

## JIT Compiler Tuning

For most applications, the default JIT compiler settings are excellent. Tuning it is an advanced topic.

### Common Scenarios for JIT Tuning

- **Fast Startup Required**: You might want to force faster compilation at the expense of peak performance.
    - `-XX:TieredStopAtLevel=1`: This tells the JVM to only use the interpreter and the C1 compiler, avoiding the slower C2 compiler. Useful for short-lived applications or CLI tools.
- **Diagnosing Compilation Issues**:
    - `-XX:+PrintCompilation`: See what's being compiled.
    - `-XX:+UnlockDiagnosticVMOptions -XX:+LogCompilation`: Log detailed compilation data to a `hotspot.log` file.

## Profiling CPU and Memory

You cannot tune what you cannot measure. Profiling is essential.

### Tools for Profiling

- **JDK Mission Control (JMC) and Java Flight Recorder (JFR)**:
    - **JFR**: A low-overhead data collection framework built into the JVM.
    - **JMC**: A tool for analyzing JFR recordings.
    - This is the standard, production-safe way to profile Java applications.
- **VisualVM**: A visual tool included in the JDK for monitoring and profiling applications. Good for development, but can have higher overhead.
- **Commercial Profilers**: YourKit, JProfiler, etc., offer more advanced features.
- **Linux Tools**: `top`, `perf`, `htop` can provide OS-level insights.

### What to Look For

- **CPU Profiling**:
    - **Hot Methods**: Which methods are consuming the most CPU time? Can they be optimized?
- **Memory Profiling**:
    - **Allocation Hotspots**: Which parts of the code are allocating the most objects? Can allocations be reduced?
    - **Memory Leaks**: Are objects being retained unnecessarily?

## Common Performance Pitfalls

- **Excessive Object Allocation**: Creating many short-lived objects in tight loops puts pressure on the GC.
- **String Concatenation in Loops**: Use `StringBuilder` instead of the `+` operator.
- **Using Inefficient Data Structures**: Choosing the wrong `Collection` (e.g., `LinkedList` when `ArrayList` is better).
- **Unnecessary Synchronization**: Overusing `synchronized` blocks can cause contention.
- **Blocking I/O**: Long-running I/O operations can block threads and waste resources.

## Practical Tuning Scenario

**Scenario**: A web service has acceptable average latency, but its p99 latency is too high, causing timeouts for some users.

1. **Goal**: Reduce p99 latency from 500ms to under 100ms.
2. **Baseline**: Use a load testing tool (like JMeter or Gatling) to simulate production traffic. Use JFR to record performance data during the test.
3. **Identify Bottleneck**: Analyze the JFR recording in JMC. The analysis reveals long GC pauses (300-400ms) are happening, which correlate with the latency spikes. The application is using the default G1 GC on a 16GB heap.
4. **Hypothesis**: The GC pauses are the cause. Switching to a lower-latency collector like ZGC should solve the problem.
5. **Change**: Add the JVM flag `-XX:+UseZGC`.
6. **Measure Again**: Rerun the exact same load test.
7. **Analyze**: The new JFR recording shows that the maximum GC pause is now only 5ms. The load test tool reports that p99 latency is now 85ms.
8. **Result**: Goal achieved.

## Key Takeaways

1. **Tuning is a Process**: Follow a scientific methodology of measuring, changing, and measuring again.
2. **Start with the Basics**: Correctly sizing the heap (`-Xms`, `-Xmx`) is the most important first step.
3. **Know Your Goal**: Tune for throughput, latency, or memory, but recognize the trade-offs.
4. **Use the Right Tools**: JFR and JMC are the modern standard for production profiling.
5. **Choose the Right GC**: G1 is a great all-arounder. Use Parallel for throughput and ZGC/Shenandoah for ultra-low latency.
6. **Don't Guess, Measure**: Never change a tuning flag without data to support why you're doing it.

## Practice Questions

1. What are the four main goals of performance tuning?
2. Why is it a best practice to set `-Xms` equal to `-Xmx`?
3. What is the difference between throughput and latency?
4. Which GC would you choose for a batch processing application that runs overnight?
5. What is the purpose of the `-XX:MaxGCPauseMillis` flag for the G1 collector?
6. What is the recommended tool for profiling a Java application in production?
7. Describe a common cause of poor performance related to object allocation.
8. Walk through the steps you would take to diagnose and fix a latency problem in a Java application.

## Next Steps

Proceed to [Module 8: Tools and Diagnostics](./08-tools-diagnostics.md) for a deeper look at the tools used for monitoring, troubleshooting, and tuning the JVM.

## Further Reading

- [Java Platform, Standard Edition HotSpot Virtual Machine Garbage Collection Tuning Guide](https://docs.oracle.com/en/java/javase/17/gctuning/introduction-garbage-collection-tuning.html)
- [Java Performance: The Definitive Guide](https://www.oreilly.com/library/view/java-performance-the/9781449363512/) by Scott Oaks
- [Using Java Flight Recorder](https://docs.oracle.com/en/java/javase/17/jfr/using-java-flight-recorder.html)
