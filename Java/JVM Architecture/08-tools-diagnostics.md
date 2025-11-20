# Module 8: Tools and Diagnostics

## Table of Contents
1. [Introduction to JVM Diagnostics](#introduction-to-jvm-diagnostics)
2. [Command-Line Tools](#command-line-tools)
3. [Visual Monitoring and Profiling Tools](#visual-monitoring-and-profiling-tools)
4. [Java Flight Recorder (JFR) and JDK Mission Control (JMC)](#java-flight-recorder-jfr-and-jdk-mission-control-jmc)
5. [Heap Dump Analysis](#heap-dump-analysis)
6. [Thread Dump Analysis](#thread-dump-analysis)
7. [GC Log Analysis](#gc-log-analysis)
8. [Practical Troubleshooting Scenarios](#practical-troubleshooting-scenarios)
9. [Key Takeaways](#key-takeaways)

## Introduction to JVM Diagnostics

JVM diagnostic tools are essential for monitoring, troubleshooting, and tuning Java applications. They provide insights into what's happening inside the JVM, from memory usage and thread states to JIT compilation and GC behavior.

### Why Use Diagnostic Tools?

- **Troubleshoot Problems**: Find the root cause of issues like high CPU usage, deadlocks, and memory leaks.
- **Monitor Application Health**: Keep an eye on key performance metrics in real-time.
- **Performance Tuning**: Gather the data needed to make informed tuning decisions.
- **Understand Application Behavior**: See how your code actually behaves at runtime.

## Command-Line Tools

The JDK ships with a suite of powerful command-line tools, typically found in the `bin` directory of your JDK installation.

### `jps` (JVM Process Status)

- **Purpose**: Lists the running Java processes on a machine. It's the "ps" command for Java.
- **Usage**:
    - `jps`: Lists PIDs and main class names.
    - `jps -l`: Shows the full package name of the main class.
    - `jps -v`: Shows the arguments passed to the JVM.

### `jstat` (JVM Statistics Monitoring)

- **Purpose**: Monitors various JVM statistics in real-time, such as class loading, JIT compilation, and garbage collection.
- **Usage**: `jstat -<option> <pid> <interval> <count>`
    - `jstat -gc <pid> 1s`: Displays GC statistics every second.
    - `jstat -compiler <pid>`: Shows JIT compiler statistics.

### `jinfo` (Configuration Information)

- **Purpose**: Views and modifies JVM configuration parameters for a running process.
- **Usage**:
    - `jinfo <pid>`: Prints all system properties and command-line flags.
    - `jinfo -flag <name> <pid>`: Prints the value of a specific flag.

### `jmap` (Memory Map)

- **Purpose**: Prints memory-related statistics and can generate a heap dump.
- **Usage**:
    - `jmap -heap <pid>`: Shows heap details, including GC algorithm and usage.
    - `jmap -histo <pid>`: Prints a histogram of the heap, showing object counts and sizes by class.
    - `jmap -dump:format=b,file=heap.hprof <pid>`: **Generates a heap dump.**

### `jstack` (Stack Trace)

- **Purpose**: Prints stack traces for all threads in a Java process. **Essential for diagnosing deadlocks and hangs.**
- **Usage**:
    - `jstack <pid>`: Prints all thread stacks.
    - `jstack -l <pid>`: Provides more detailed information, including locks.

## Visual Monitoring and Profiling Tools

### `jconsole`

- **Purpose**: A graphical monitoring tool that provides real-time information about memory, threads, classes, and MBeans.
- **Features**:
    - Basic overview of heap usage, thread count, etc.
    - MBean browser for interacting with the application.
    - Deadlock detection.
- **Best For**: Basic, lightweight, real-time monitoring.

### `jvisualvm` (VisualVM)

- **Purpose**: A more advanced visual tool that integrates monitoring, profiling, and thread/heap analysis.
- **Features**:
    - Everything `jconsole` does.
    - **CPU and Memory Profiler**: Samples or instruments code to find performance bottlenecks.
    - **Heap Dump Analysis**: Can take and perform basic analysis of heap dumps.
    - **Thread Analysis**: Visualizes thread states over time.
- **Best For**: All-in-one troubleshooting and profiling during development.

## Java Flight Recorder (JFR) and JDK Mission Control (JMC)

This is the premier, production-safe diagnostics suite for modern Java.

### Java Flight Recorder (JFR)

- **What it is**: A high-performance event recorder built directly into the HotSpot JVM.
- **Key Feature**: **Extremely low overhead** (typically <1% in production). It's safe to run continuously.
- **How it works**: It collects detailed data about JVM internals, application events, and OS-level information, and saves it to a recording file (`.jfr`).
- **Usage**:
    - **Start a recording**: `jcmd <pid> JFR.start name=myrecording duration=60s`
    - **Dump a recording**: `jcmd <pid> JFR.dump name=myrecording filename=recording.jfr`
    - **Via JVM flags**: `-XX:StartFlightRecording=duration=60s,filename=recording.jfr`

### JDK Mission Control (JMC)

- **What it is**: A desktop application for analyzing `.jfr` files produced by the Flight Recorder.
- **How it works**: It provides a rich, interactive visualization of the recorded data, making it easy to diagnose complex issues.
- **Key Sections in JMC**:
    - **Automated Analysis Results**: JMC automatically analyzes the recording and flags potential problems.
    - **JVM Internals**: Detailed information on GC, JIT compilation, class loading, etc.
    - **Method Profiling**: Shows CPU-intensive methods.
    - **Thread Analysis**: Visualizes thread locks, I/O, and latencies.
    - **Event Browser**: Allows you to inspect individual low-level events.

## Heap Dump Analysis

A heap dump is a snapshot of the JVM's heap memory at a specific moment. It's the primary tool for diagnosing memory leaks.

### How to Generate a Heap Dump

1. **`jmap`**: `jmap -dump:format=b,file=heap.hprof <pid>`
2. **VisualVM**: Right-click the process and select "Heap Dump".
3. **JMC**: Create a JFR recording and it will often contain enough heap information. You can also trigger a heap dump from JMC.
4. **On OOM**: Use the flag `-XX:+HeapDumpOnOutOfMemoryError`.

### How to Analyze a Heap Dump

- **Tool**: **Eclipse Memory Analyzer (MAT)** is the most powerful tool for this.
- **Key Concepts**:
    - **Shallow Heap**: The memory consumed by the object itself.
    - **Retained Heap**: The memory that would be freed if the object were garbage collected (i.e., the object itself plus all objects it exclusively holds references to).
    - **Dominator Tree**: A view that shows the objects responsible for retaining the most memory.
- **Process**:
    1. Open the heap dump (`.hprof` file) in MAT.
    2. Run the "Leak Suspects" report. MAT will automatically analyze the dump and point to potential memory leaks.
    3. Use the Dominator Tree to explore the largest objects and see what is holding them in memory.
    4. Find the path to GC roots to understand why a specific object is not being collected.

## Thread Dump Analysis

A thread dump is a snapshot of the state of all threads at a given moment. It's the primary tool for diagnosing deadlocks, hangs, and high CPU usage.

### How to Generate a Thread Dump

1. **`jstack`**: `jstack <pid>`
2. **VisualVM/JMC**: Go to the Threads tab and click the "Thread Dump" button.
3. **`kill -3 <pid>`** (on Linux/macOS): Sends a signal that causes the JVM to print a thread dump to standard output.

### How to Analyze a Thread Dump

- **Look for Deadlocks**: `jstack` and visual tools will explicitly report deadlocks. A deadlock occurs when Thread A is waiting for a lock held by Thread B, and Thread B is waiting for a lock held by Thread A.
- **Identify Blocked Threads**: Look for threads in the `BLOCKED` state. The dump will show which lock they are waiting to acquire.
- **High CPU Usage**: If a thread is consuming 100% of a CPU core, it will likely be in the `RUNNABLE` state. The stack trace for that thread will show exactly which method is being executed, pointing you to the hot spot.
- **Idle Threads**: Many threads may be in `WAITING` or `TIMED_WAITING` state, often in a connection pool or thread pool, waiting for work. This is usually normal.

## GC Log Analysis

Analyzing GC logs is key to understanding and tuning GC behavior.

- **Enable Logging**: Use `-Xlog:gc*:<file>` (Java 9+) or `-verbose:gc -XX:+PrintGCDetails` (Java 8).
- **Tools**:
    - **GCEasy**: A popular online tool for visualizing and analyzing GC logs.
    - **GCViewer**: An open-source desktop tool.
- **What to Look For**:
    - **Pause Times**: Are the STW pauses too long?
    - **GC Frequency**: Is the GC running too often?
    - **Heap Usage Patterns**: How quickly is the heap filling up?
    - **Full GCs**: Are frequent Full GCs occurring? This is often a sign of a problem.

## Practical Troubleshooting Scenarios

### Scenario 1: Application is Unresponsive (Hang)

1. **Action**: Take a thread dump using `jstack`.
2. **Analysis**:
   - Look for deadlocks. `jstack` will report them at the bottom.
   - If no deadlock, look for threads that are `BLOCKED` waiting on a lock held by another thread that is performing a long-running operation (e.g., a slow database query or network call).

### Scenario 2: Application is Slow (High CPU)

1. **Action**: Start a JFR recording (`jcmd <pid> JFR.start ...`).
2. **Analysis**:
   - Open the recording in JMC.
   - Go to the "Method Profiling" tab.
   - Sort by "Sample Count" to find the methods where the application is spending the most CPU time. These are your optimization targets.

### Scenario 3: Application Crashes with `OutOfMemoryError`

1. **Action**: Configure the JVM to generate a heap dump on OOM (`-XX:+HeapDumpOnOutOfMemoryError`).
2. **Analysis**:
   - Open the resulting `.hprof` file in Eclipse MAT.
   - Run the "Leak Suspects" report.
   - Analyze the Dominator Tree to find what is consuming the memory and why it's being retained.

## Key Takeaways

1. **Know Your Toolkit**: The JDK provides a rich set of command-line and visual tools for diagnostics.
2. **JFR/JMC is the Standard**: For modern, production-safe profiling, JFR and JMC are the best choices.
3. **The Right Tool for the Job**:
    - **Memory Leak?** → Heap Dump (jmap, MAT)
    - **Deadlock/Hang?** → Thread Dump (jstack)
    - **High CPU?** → Profiler (JFR/JMC)
    - **GC Issues?** → GC Logs (GCEasy)
4. **Master the Holy Trinity**: Heap Dumps, Thread Dumps, and Profiler recordings (like JFR) are the three essential artifacts for solving most complex JVM problems.

## Practice Questions

1. Which command-line tool would you use to get a list of running Java processes?
2. How do you generate a thread dump for a running application?
3. What is the key advantage of Java Flight Recorder (JFR) over older profilers like VisualVM?
4. What is the difference between "shallow heap" and "retained heap" in a heap dump analysis?
5. Which tool is best suited for analyzing a heap dump file?
6. What thread state would you look for to diagnose a deadlock?
7. How can you configure your application to automatically create a heap dump when it runs out of memory?
8. Describe the steps to find a CPU bottleneck in a production application with minimal performance overhead.

## Next Steps

Proceed to [Module 9: Advanced Topics](./09-advanced-topics.md) to explore more advanced concepts of the JVM.

## Further Reading

- [Java Platform, Standard Edition Troubleshooting Guide](https://docs.oracle.com/en/java/javase/17/troubleshoot/index.html)
- [Eclipse Memory Analyzer (MAT) Documentation](https://eclipse.dev/mat/)
- [VisualVM Homepage](https://visualvm.github.io/)
