# Module 4: Garbage Collection

## Table of Contents
1. [Introduction to Garbage Collection](#introduction-to-garbage-collection)
2. [How GC Works](#how-gc-works)
3. [Generational Garbage Collection](#generational-garbage-collection)
4. [GC Algorithms](#gc-algorithms)
5. [Choosing a GC Algorithm](#choosing-a-gc-algorithm)
6. [GC Tuning and Ergonomics](#gc-tuning-and-ergonomics)
7. [Memory Leaks](#memory-leaks)
8. [Practical Examples](#practical-examples)
9. [Key Takeaways](#key-takeaways)

## Introduction to Garbage Collection

Garbage Collection (GC) is the process of automatically managing memory in the JVM. It identifies and reclaims memory occupied by objects that are no longer in use by the application.

### Why GC is Important

- **Automatic Memory Management**: Frees developers from manual memory allocation/deallocation (like `malloc`/`free` in C/C++)
- **Prevents Memory Leaks**: Reduces common programming errors related to memory
- **Improves Application Stability**: Ensures memory is used efficiently

### The "Stop-the-World" Problem

Most GC algorithms require pausing the application threads to perform garbage collection. These pauses are known as "Stop-the-World" (STW) events. A major goal of modern GC algorithms is to minimize the frequency and duration of these pauses.

## How GC Works

The core process of garbage collection involves two main steps:

### 1. Marking

The first step is to identify which objects are still in use ("live") and which are not ("garbage").

- **GC Roots**: The starting point for marking. GC Roots are objects that are always reachable, such as:
    - Active threads
    - Static variables
    - JNI references
    - Local variables on the stack
- **Reachability**: The GC traverses the object graph starting from GC Roots. Any object reachable from a GC Root is considered "live".

```
        GC Roots
       /    |    \
    ObjA  ObjB  ObjC
     |     |   /  |
    ObjD  ObjE  ObjF
            |
           ObjG

    Unreachable: ObjX, ObjY
```

### 2. Sweeping/Compacting

After marking, the GC deals with the garbage.

- **Sweeping**: The memory occupied by unreachable objects is reclaimed.
- **Compacting**: Live objects are moved together to reduce fragmentation and improve memory allocation speed.

```
Before Compaction:
[Live|Free|Live|Live|Free|Free|Live]

After Compaction:
[Live|Live|Live|Live|Free|Free|Free]
```

## Generational Garbage Collection

The generational hypothesis states that most objects die young. The JVM heap is divided into generations to optimize GC based on this hypothesis.

### Young Generation Collection (Minor GC)

- **Trigger**: When Eden space is full
- **Process**:
    1. Mark live objects in Eden and one of the Survivor spaces
    2. Copy live objects to the other Survivor space
    3. Clear Eden and the first Survivor space
    4. Increment age of surviving objects
- **Characteristics**: Fast, frequent, STW pauses are short

### Old Generation Collection (Major/Full GC)

- **Trigger**: When Old Generation is full, or based on heuristics
- **Process**:
    1. Mark live objects in the entire heap (Young + Old)
    2. Sweep/compact the Old Generation
- **Characteristics**: Slower, less frequent, STW pauses can be longer

### Object Promotion

- Objects that survive a certain number of Minor GCs (controlled by `-XX:MaxTenuringThreshold`) are promoted to the Old Generation.
- If an object is too large to fit in Eden, it may be allocated directly in the Old Generation (humongous allocation).

## GC Algorithms

The JVM provides several GC algorithms, each with different characteristics.

### 1. Serial GC

- **Flag**: `-XX:+UseSerialGC`
- **Characteristics**:
    - Single-threaded
    - Simple mark-sweep-compact algorithm
    - Long STW pauses
- **Use Case**: Client-side applications, single-processor machines, small heaps

### 2. Parallel GC (Throughput Collector)

- **Flag**: `-XX:+UseParallelGC`
- **Characteristics**:
    - Multi-threaded for Young Generation (Minor GC)
    - Single-threaded for Old Generation (Major GC)
    - With `-XX:+UseParallelOldGC`, Major GC is also multi-threaded
    - Default GC for Java 8
- **Use Case**: Throughput-oriented applications, batch processing

### 3. Concurrent Mark Sweep (CMS) GC

- **Flag**: `-XX:+UseConcMarkSweepGC`
- **Characteristics**:
    - Aims to minimize STW pauses by doing most of the work concurrently with application threads
    - Does not compact the Old Generation, which can lead to fragmentation
    - Deprecated in Java 9, removed in Java 14
- **Use Case**: Latency-sensitive applications (e.g., web servers)

### 4. G1 (Garbage-First) GC

- **Flag**: `-XX:+UseG1GC`
- **Characteristics**:
    - Divides the heap into a grid of regions
    - Prioritizes collecting regions with the most garbage first
    - Balances throughput and latency
    - Default GC since Java 9
- **Use Case**: Large heaps (>4GB), applications requiring predictable pause times

### 5. ZGC (Z Garbage Collector)

- **Flag**: `-XX:+UseZGC`
- **Characteristics**:
    - Scalable low-latency GC
    - Pause times do not increase with heap size (typically <10ms)
    - Handles very large heaps (terabytes)
    - Uses load barriers and colored pointers
- **Use Case**: Applications requiring extremely low latency with large heaps

### 6. Shenandoah GC

- **Flag**: `-XX:+UseShenandoahGC`
- **Characteristics**:
    - Another ultra-low-latency GC
    - Does more work concurrently, including compaction
    - Pause times are independent of heap size
- **Use Case**: Similar to ZGC, for applications where responsiveness is key

## Choosing a GC Algorithm

| GC Algorithm      | Primary Goal        | Typical Pause Times | Best For                                       |
|-------------------|---------------------|---------------------|------------------------------------------------|
| **Serial**        | Low footprint       | Long                | Single-core, small heaps, client apps          |
| **Parallel**      | High throughput     | Medium to Long      | Batch processing, scientific computing         |
| **CMS** (Legacy)  | Low latency         | Short to Medium     | Web servers (replaced by G1)                   |
| **G1**            | Balanced            | Short, predictable  | Large heaps, general purpose, default choice   |
| **ZGC/Shenandoah**| Ultra-low latency   | Very Short (<10ms)  | Very large heaps, real-time, financial apps    |

## GC Tuning and Ergonomics

The JVM uses ergonomics to automatically select the GC algorithm and tune heap sizes based on the machine's hardware. However, you can manually tune the GC for better performance.

### Key Tuning Flags

- **Heap Size**:
    - `-Xms<size>`: Initial heap size
    - `-Xmx<size>`: Maximum heap size
- **Young Generation Size**:
    - `-Xmn<size>`: Size of the Young Generation
    - `-XX:NewRatio=<ratio>`: Ratio between Old and Young Generation (e.g., 2 means Old is 2x Young)
- **Survivor Ratio**:
    - `-XX:SurvivorRatio=<ratio>`: Ratio between Eden and a Survivor space
- **G1 Specific**:
    - `-XX:MaxGCPauseMillis=<ms>`: Target for maximum pause time
- **GC Logging**:
    - `-Xlog:gc*` (Java 9+)
    - `-verbose:gc -XX:+PrintGCDetails -XX:+PrintGCTimeStamps` (Java 8)

## Memory Leaks

In Java, a memory leak occurs when objects are no longer needed by the application but are still referenced, preventing the GC from reclaiming their memory.

### Common Causes of Memory Leaks

- **Static Collections**: Storing objects in static `List`s or `Map`s and never removing them
- **Unclosed Resources**: Not closing streams, connections, etc.
- **Improper `equals()` and `hashCode()`**: When using objects as keys in a `HashMap`
- **Inner Classes**: Non-static inner classes holding a reference to the outer class

### Detecting Memory Leaks

1. **Enable GC Logging**: Look for increasing heap usage after Full GCs
2. **Use a Profiler**: Tools like VisualVM, JProfiler, or YourKit can track object allocations
3. **Analyze Heap Dumps**:
   - Generate a heap dump using `jmap` or VisualVM
   - Analyze the dump with tools like Eclipse Memory Analyzer (MAT) to find leak suspects

## Practical Examples

### Example 1: Enabling and Logging GC

```bash
# Create a simple Java program that creates objects
public class GcDemo {
    public static void main(String[] args) {
        for (int i = 0; i < 1000; i++) {
            new byte[1024 * 1024]; // Allocate 1MB
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {}
        }
    }
}

# Compile it: javac GcDemo.java

# Run with G1 GC and logging (Java 9+)
java -XX:+UseG1GC -Xlog:gc* GcDemo

# Run with Parallel GC and logging (Java 8)
java -XX:+UseParallelGC -verbose:gc GcDemo
```
Observe the GC logs in the console.

### Example 2: Simulating a Memory Leak

```java
import java.util.ArrayList;
import java.util.List;

public class MemoryLeakDemo {
    // Static list will hold references forever
    private static List<byte[]> leak = new ArrayList<>();
    
    public static void main(String[] args) {
        while (true) {
            leak.add(new byte[1024 * 1024]); // 1MB
            System.out.println("Heap size: " + Runtime.getRuntime().totalMemory() / (1024*1024) + "MB");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {}
        }
    }
}
```
Run this with a limited heap size (`-Xmx100m`) and observe the `OutOfMemoryError`. Use VisualVM to inspect the heap.

### Example 3: Using jstat to Monitor GC

1. **Run a Java application** (e.g., `MemoryLeakDemo` from above)
2. **Find its process ID (PID)**: `jps`
3. **Run `jstat`**: `jstat -gc <PID> 1000` (updates every 1000ms)

This will show you real-time statistics about heap usage and GC events.

## Key Takeaways

1. **GC Automates Memory Management**: But it's not a magic bullet; memory leaks can still happen.
2. **Generational GC is Key**: Most objects die young, so collecting the Young Generation separately is efficient.
3. **Pause Times Matter**: "Stop-the-World" pauses can impact application performance. Modern GCs aim to minimize them.
4. **Choose the Right GC**: The best GC depends on your application's needs (throughput vs. latency) and heap size. G1 is a great default.
5. **Logging is Crucial**: Enable GC logging to understand and tune GC behavior.
6. **Profilers are Your Friend**: Use tools like VisualVM and MAT to diagnose memory issues.

## Practice Questions

1. What are GC Roots?
2. Explain the "mark and sweep" process.
3. What is the generational hypothesis?
4. What's the difference between a Minor GC and a Major GC?
5. When would you choose the Parallel GC over the G1 GC?
6. What is a "Stop-the-World" pause?
7. How does ZGC achieve such low pause times?
8. Describe a common cause of memory leaks in Java and how to find it.

## Next Steps

Proceed to [Module 5: Bytecode and Class File Format](./05-bytecode.md) to dive into the compiled representation of your Java code.

## Further Reading

- [Java Platform, Standard Edition HotSpot Virtual Machine Garbage Collection Tuning Guide](https://docs.oracle.com/en/java/javase/11/gctuning/introduction-garbage-collection-tuning.html)
- [Visualizing Garbage Collection](https://www.youtube.com/watch?v=UnaNF_-b06A) (Video)
- [A Guide to G1 Garbage Collector](https://www.baeldung.com/jvm-g1-garbage-collector)
