# Module 3: Memory Management

## Table of Contents
1. [Introduction](#introduction)
2. [Runtime Data Areas Overview](#runtime-data-areas-overview)
3. [Heap Memory](#heap-memory)
4. [Stack Memory](#stack-memory)
5. [Method Area (Metaspace)](#method-area-metaspace)
6. [PC Register](#pc-register)
7. [Native Method Stack](#native-method-stack)
8. [Memory Allocation and Deallocation](#memory-allocation-and-deallocation)
9. [Practical Examples](#practical-examples)
10. [Key Takeaways](#key-takeaways)

## Introduction

JVM memory management is the process of allocating and deallocating memory for Java objects. Understanding how JVM organizes and manages memory is crucial for writing efficient, high-performance Java applications.

### Why Memory Management is Important

- **Performance**: Efficient memory usage leads to faster applications
- **Stability**: Prevents `OutOfMemoryError` and other memory-related issues
- **Debugging**: Helps diagnose memory leaks and performance bottlenecks
- **Tuning**: Allows for fine-tuning JVM for specific workloads

## Runtime Data Areas Overview

The JVM divides its memory into several runtime data areas. These can be categorized based on whether they are shared among threads or are thread-private.

```
┌──────────────────────────────────────────────────┐
│                JVM MEMORY AREAS                  │
│                                                  │
│  ┌───────────────────┐  ┌──────────────────────┐ │
│  │ THREAD-SHARED     │  │ THREAD-PRIVATE       │ │
│  │                   │  │                      │ │
│  │  - Heap           │  │  - Stack             │ │
│  │  - Method Area    │  │  - PC Register       │ │
│  │    (Metaspace)    │  │  - Native Method Stack │ │
│  └───────────────────┘  └──────────────────────┘ │
└──────────────────────────────────────────────────┘
```

- **Thread-Shared**: Created at JVM startup, destroyed at JVM exit
- **Thread-Private**: Created when a thread starts, destroyed when a thread exits

## Heap Memory

The heap is the largest memory area, responsible for storing all class instances and arrays.

### Heap Structure

The heap is typically divided into two main generations for garbage collection purposes:

```
┌──────────────────────────────────────────────────────────────┐
│                          HEAP MEMORY                           │
│                                                              │
│  ┌──────────────────────────┐  ┌───────────────────────────┐ │
│  │     YOUNG GENERATION     │  │      OLD GENERATION       │ │
│  │                          │  │       (Tenured)           │ │
│  │  ┌─────────┐ ┌─────────┐ │  │                           │ │
│  │  │  Eden   │ │ Survivor│ │  │  - Long-lived objects     │ │
│  │  │ Space   │ │  (S0/S1)│ │  │                           │ │
│  │  └─────────┘ └─────────┘ │  │                           │ │
│  └──────────────────────────┘  └───────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

#### 1. Young Generation
- **Purpose**: Stores newly created objects
- **Sub-divisions**:
    - **Eden Space**: Where most new objects are allocated
    - **Survivor Spaces (S0, S1)**: Objects that survive minor GC from Eden
- **GC**: Minor Garbage Collection (fast)

#### 2. Old Generation (Tenured)
- **Purpose**: Stores long-lived objects
- **Promotion**: Objects are promoted from Young Generation after surviving multiple GC cycles
- **GC**: Major Garbage Collection (slower)

### Object Allocation in Heap

```java
public class HeapAllocation {
    public static void main(String[] args) {
        // 'person' reference is on the stack
        // 'new Person()' object is on the heap
        Person person = new Person("Alice", 30);
        
        // Array is also on the heap
        int[] numbers = new int[10];
    }
}

class Person {
    String name;
    int age;
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

### Key Heap Characteristics
- **Shared**: All threads share the heap
- **Garbage Collected**: Automatically managed by GC
- **Size**: Configurable with `-Xms` (initial) and `-Xmx` (maximum)
- **Error**: `java.lang.OutOfMemoryError: Java heap space`

## Stack Memory

Each thread has its own private Java Virtual Machine Stack, created at the same time as the thread.

### Stack Structure

The stack stores frames. A new frame is created for each method invocation and destroyed when the method completes.

```
┌──────────────────────────┐
│        STACK MEMORY      │ (LIFO)
│                          │
│  ┌───────────────────┐   │
│  │      Frame 3      │ ← Current Frame (method3)
│  ├───────────────────┤   │
│  │      Frame 2      │   (method2)
│  ├───────────────────┤   │
│  │      Frame 1      │   (method1)
│  └───────────────────┘   │
└──────────────────────────┘
```

### Frame Contents

Each frame contains:
- **Local Variable Array**: Stores local variables and method parameters
- **Operand Stack**: Workspace for intermediate calculations
- **Frame Data**:
    - Reference to runtime constant pool
    - Information for exception handling

### Stack Example

```java
public class StackExample {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int result = add(a, b);
        System.out.println(result);
    }
    
    public static int add(int x, int y) {
        int sum = x + y;
        return sum;
    }
}
```

**Execution Flow:**
1. `main` method starts → `main` frame pushed to stack
2. `add` method called → `add` frame pushed to stack
3. `add` method returns → `add` frame popped from stack
4. `main` method finishes → `main` frame popped from stack

### Key Stack Characteristics
- **Thread-Private**: Each thread has its own stack
- **LIFO**: Last-In, First-Out structure
- **Fast Access**: Memory allocation is simple and fast
- **Size**: Fixed size, configurable with `-Xss`
- **Error**: `java.lang.StackOverflowError`

## Method Area (Metaspace)

The Method Area stores per-class structures such as the runtime constant pool, field and method data, and the code for methods and constructors.

### From PermGen to Metaspace

- **Java 7 and earlier**: Method Area was part of the heap, called **Permanent Generation (PermGen)**
- **Java 8 and later**: PermGen was removed and replaced by **Metaspace**, which is part of native memory, not the heap.

### Metaspace Contents
- Class metadata
- Runtime constant pool
- Static variables
- Method code (JIT compiled code)

### Key Metaspace Characteristics
- **Shared**: All threads share the Metaspace
- **Dynamic Sizing**: Can grow dynamically by default
- **Size**: Configurable with `-XX:MetaspaceSize` and `-XX:MaxMetaspaceSize`
- **Error**: `java.lang.OutOfMemoryError: Metaspace`

## PC Register

The Program Counter (PC) Register is a small memory area that stores the address of the currently executing Java bytecode instruction.

### Key PC Register Characteristics
- **Thread-Private**: Each thread has its own PC register
- **Fast**: Very small and efficient
- **Native Methods**: If executing a native method, the PC register is undefined
- **No OOM**: The only memory area that will not throw `OutOfMemoryError`

## Native Method Stack

The Native Method Stack is used to support native methods (methods written in languages other than Java, such as C/C++).

### Key Native Method Stack Characteristics
- **Thread-Private**: Each thread has its own native method stack
- **JNI**: Used for Java Native Interface (JNI) calls
- **Implementation-Specific**: Varies between different JVMs
- **Error**: Can cause `StackOverflowError`

## Memory Allocation and Deallocation

### Allocation
- **Stack**: Automatic when a method is called
- **Heap**: Explicitly with `new` keyword

### Deallocation
- **Stack**: Automatic when a method returns
- **Heap**: Automatic by the Garbage Collector

### Stack vs Heap

| Feature            | Stack                               | Heap                                |
|--------------------|-------------------------------------|-------------------------------------|
| **Scope**          | Thread-private                      | Shared among all threads            |
| **Storage**        | Primitives, object references       | Objects, arrays                     |
| **Lifecycle**      | Tied to method invocation           | Independent of method scope         |
| **Allocation**     | Automatic (LIFO)                    | Explicit (`new`)                    |
| **Deallocation**   | Automatic (LIFO)                    | Automatic (Garbage Collector)       |
| **Size**           | Smaller, fixed size                 | Larger, dynamic size                |
| **Speed**          | Faster                               | Slower                              |
| **Error**          | `StackOverflowError`                | `OutOfMemoryError: Java heap space` |

## Practical Examples

### Example 1: StackOverflowError

```java
public class StackOverflowDemo {
    public static void main(String[] args) {
        try {
            recursiveMethod(0);
        } catch (StackOverflowError e) {
            System.out.println("StackOverflowError caught!");
        }
    }
    
    public static void recursiveMethod(int i) {
        System.out.println("Call: " + i);
        recursiveMethod(i + 1);
    }
}
```
**To run**: `java StackOverflowDemo`
**To control stack size**: `java -Xss256k StackOverflowDemo`

### Example 2: OutOfMemoryError: Java heap space

```java
import java.util.ArrayList;
import java.util.List;

public class HeapOOMDemo {
    public static void main(String[] args) {
        List<byte[]> list = new ArrayList<>();
        try {
            while (true) {
                list.add(new byte[1024 * 1024]); // Allocate 1MB
            }
        } catch (OutOfMemoryError e) {
            System.out.println("OutOfMemoryError caught!");
            System.out.println("List size: " + list.size());
        }
    }
}
```
**To run**: `java HeapOOMDemo`
**To control heap size**: `java -Xms10m -Xmx10m HeapOOMDemo`

### Example 3: OutOfMemoryError: Metaspace

```java
// This example requires a library for dynamic class generation
// For example, using javassist or cglib
// The concept is to keep generating new classes until Metaspace is full.
// This is less common in typical applications but can happen with
// frameworks that do a lot of class generation.
```

### Example 4: Visualizing Memory with jvisualvm

1. **Start your Java application**
2. **Open a terminal and run `jvisualvm`** (it's in your JDK's `bin` directory)
3. **Connect to your application's process**
4. **Go to the "Monitor" tab**:
   - View Heap and Metaspace usage in real-time
   - See thread count and classes loaded
5. **Go to the "Sampler" tab**:
   - Profile CPU and Memory usage to find hot spots

## Key Takeaways

1. **Two Types of Memory**: Thread-shared (Heap, Method Area) and Thread-private (Stack, PC Register, Native Method Stack)
2. **Heap**: Stores objects, managed by GC, divided into generations
3. **Stack**: Stores frames for method calls, fast but limited in size
4. **Metaspace**: Stores class metadata in native memory (Java 8+)
5. **Errors**: `StackOverflowError` for stack, `OutOfMemoryError` for heap and metaspace
6. **Tuning**: Use JVM flags (`-Xmx`, `-Xms`, `-Xss`, `-XX:MaxMetaspaceSize`) to control memory sizes

## Common Issues and Solutions

### Issue 1: `StackOverflowError`
**Cause**: Deep recursion or long method call chain
**Solution**: Increase stack size (`-Xss`), refactor code to be iterative

### Issue 2: `OutOfMemoryError: Java heap space`
**Cause**: Memory leak, insufficient heap size
**Solution**: Increase heap size (`-Xmx`), analyze heap dump to find leaks

### Issue 3: `OutOfMemoryError: Metaspace`
**Cause**: Too many classes loaded, class loader leak
**Solution**: Increase Metaspace size (`-XX:MaxMetaspaceSize`), check for dynamic class generation issues

## Practice Questions

1. What are the main runtime data areas in the JVM?
2. What is the difference between heap and stack memory?
3. Where are local variables stored? Where are instance variables stored?
4. Explain the structure of the heap (Young and Old Generation).
5. What is Metaspace and how is it different from PermGen?
6. What causes a `StackOverflowError`?
7. What causes an `OutOfMemoryError` in the heap?
8. How can you configure the initial and maximum heap size?

## Next Steps

Proceed to [Module 4: Garbage Collection](./04-garbage-collection.md) to understand how the JVM automatically reclaims heap memory.

## Further Reading

- [JVM Specification - Runtime Data Areas](https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-2.html#jvms-2.5)
- [Java Platform, Standard Edition HotSpot Virtual Machine Garbage Collection Tuning Guide](https://docs.oracle.com/en/java/javase/11/gctuning/introduction-garbage-collection-tuning.html)
