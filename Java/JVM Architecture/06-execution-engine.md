# Module 6: Execution Engine

## Table of Contents
1. [Introduction to the Execution Engine](#introduction-to-the-execution-engine)
2. [Interpreter](#interpreter)
3. [Just-In-Time (JIT) Compiler](#just-in-time-jit-compiler)
4. [Tiered Compilation](#tiered-compilation)
5. [JIT Optimization Techniques](#jit-optimization-techniques)
6. [Ahead-of-Time (AOT) Compilation](#ahead-of-time-aot-compilation)
7. [Java Native Interface (JNI)](#java-native-interface-jni)
8. [Practical Examples](#practical-examples)
9. [Key Takeaways](#key-takeaways)

## Introduction to the Execution Engine

The Execution Engine is the component of the JVM that executes the bytecode loaded by the Class Loader. It reads the bytecode instructions and executes them one by one.

### Core Responsibilities

- Executing bytecode
- Interacting with the Runtime Data Areas
- Managing the Garbage Collector
- Providing the Java Native Interface (JNI)

The JVM uses a combination of interpretation and compilation to execute code, aiming to balance fast startup with long-term performance.

```
  Bytecode (.class file)
           |
           V
   Execution Engine
   /              \
  /                \
 V                  V
Interpreter      JIT Compiler
 |                  |
 V                  V
Execute one by one  Compile to Native Code
```

## Interpreter

The interpreter reads, interprets, and executes bytecode instructions sequentially.

### How it Works

1. Reads one bytecode instruction.
2. Decodes the instruction.
3. Performs the corresponding action.
4. Moves to the next instruction.

### Advantages

- **Fast Startup**: No time is spent on compilation. The application can start executing immediately.
- **Simplicity**: The implementation is straightforward.

### Disadvantages

- **Slow Execution**: Interpreting each instruction every time it's executed is inefficient, especially for code in loops.
- **No Optimization**: The interpreter does not perform advanced optimizations.

## Just-In-Time (JIT) Compiler

To overcome the performance limitations of the interpreter, the JVM uses a Just-In-Time (JIT) compiler. The JIT compiler selectively compiles frequently executed bytecode into native machine code at runtime.

### HotSpot Detection

The JVM monitors the code as it runs to identify "hot spots" – methods or loops that are executed frequently.

- **Invocation Counter**: Tracks how many times a method is called.
- **Back-edge Counter**: Tracks how many times a loop is executed.

When a counter exceeds a certain threshold, the corresponding code is queued for compilation by the JIT.

### The JIT Compilation Process

1. **Profiling**: The JVM gathers runtime information about the code's behavior.
2. **Compilation**: The JIT compiler takes the bytecode and compiles it into optimized native code.
3. **Code Cache**: The compiled native code is stored in a special area of memory called the "code cache".
4. **Execution**: Subsequent calls to the method will execute the compiled native code directly, bypassing the interpreter.

## Tiered Compilation

Modern HotSpot JVMs use a tiered compilation model to get the best of both worlds: fast startup and high-performance optimized code.

### The Tiers

- **Level 0: Interpreter**: Executes all code initially. Gathers profiling data.
- **Level 1: C1 Compiler (Client Compiler)**:
    - Performs simple, fast optimizations.
    - Compiles code quickly to provide an immediate performance boost.
- **Level 2: C2 Compiler (Server Compiler)**:
    - Performs advanced, aggressive optimizations that take longer to complete.
    - Generates highly optimized native code for maximum long-term performance.

### How Tiered Compilation Works

```
      Interpreter (Level 0)
           |
 (Method gets warm)
           |
           V
    C1 Compiler (Level 1)
           |
 (Method gets hot + more profiling)
           |
           V
    C2 Compiler (Level 2)
```

1. A method starts executing in the interpreter.
2. If it becomes "warm", the C1 compiler compiles it.
3. The JVM continues to profile the C1-compiled code.
4. If the method becomes "hot", the C2 compiler recompiles it with more advanced optimizations.

This approach allows the application to start fast and gradually reach peak performance as more code is optimized by the C2 compiler.

## JIT Optimization Techniques

The JIT compiler performs numerous sophisticated optimizations.

### 1. Method Inlining

- **What it is**: Replacing a method call with the body of the called method.
- **Benefit**: Eliminates the overhead of a method call and opens up further optimization opportunities within the combined code.

**Before Inlining:**
```java
int result = add(5, 10);

int add(int a, int b) { return a + b; }
```

**After Inlining:**
```java
int result = 5 + 10;
```

### 2. Escape Analysis

- **What it is**: Determining if an object's scope "escapes" its current method (i.e., is it returned or passed to another method).
- **Benefit**: If an object does not escape, the JIT can perform **scalar replacement**, allocating the object's fields directly on the stack instead of the heap. This avoids heap allocation and garbage collection overhead.

**Example:**
```java
public void process() {
    Point p = new Point(10, 20); // 'p' does not escape this method
    // ... use p ...
}
```
With escape analysis, `p` might not be allocated on the heap at all. Its fields `x` and `y` could be treated as local variables.

### 3. Loop Unrolling

- **What it is**: Replicating the body of a loop to reduce the number of loop control instructions.
- **Benefit**: Reduces branching overhead and increases opportunities for other optimizations.

**Before Unrolling:**
```java
for (int i = 0; i < 3; i++) {
    doWork(i);
}
```

**After Unrolling:**
```java
doWork(0);
doWork(1);
doWork(2);
```

### 4. Dead Code Elimination

- **What it is**: Removing code that does not affect the program's outcome.
- **Benefit**: Reduces code size and improves execution speed.

**Example:**
```java
final boolean DEBUG = false;
if (DEBUG) {
    System.out.println("Debugging..."); // This is dead code
}
```
The JIT compiler will completely remove the `if` block and the print statement.

## Ahead-of-Time (AOT) Compilation

AOT compilation involves compiling Java code to native machine code *before* execution, similar to how C++ is compiled.

### GraalVM Native Image

- **GraalVM** is a high-performance polyglot VM that includes a powerful AOT compiler.
- Its `native-image` tool can compile a Java application into a self-contained, platform-specific native executable.

### AOT vs. JIT

| Feature             | JIT Compilation (HotSpot)          | AOT Compilation (GraalVM Native Image) |
|---------------------|------------------------------------|----------------------------------------|
| **Startup Time**    | Slower (requires warmup)           | Extremely fast                         |
| **Peak Performance**| Potentially higher (uses runtime profiles) | Potentially lower (lacks runtime info) |
| **Memory Footprint**| Larger                             | Much smaller                           |
| **Flexibility**     | High (dynamic class loading, reflection) | Lower (requires closed-world assumption) |
| **Distribution**    | Requires a JVM                     | Standalone executable                  |

**Use Case for AOT**: Serverless functions, microservices, CLI tools where instant startup and low memory usage are critical.

## Java Native Interface (JNI)

JNI is a framework that allows Java code running in the JVM to call, and be called by, native applications and libraries written in other languages such as C, C++, or assembly.

### How it Works

1. Declare a method with the `native` keyword in Java.
2. Use `javah` (or `javac -h`) to generate a C/C++ header file.
3. Implement the native method in C/C++.
4. Compile the C/C++ code into a native shared library (`.dll`, `.so`, `.dylib`).
5. In Java, load the library using `System.loadLibrary()` and call the native method.

### Use Cases

- Interfacing with legacy C/C++ libraries.
- Accessing platform-specific hardware or OS features.
- Performance-critical computations where C/C++ might be faster.

### Performance Overhead

Calling native methods via JNI has a significant performance overhead compared to a regular Java method call. It should be used judiciously.

## Practical Examples

### Example 1: Observing JIT Compilation

You can ask the JVM to print information about JIT compilation.

```bash
# Run a Java program and print compilation logs
java -XX:+PrintCompilation -jar my-app.jar
```
This will output a log to the console each time a method is compiled by the JIT.

### Example 2: Disabling JIT Compilation

You can run your application in interpreter-only mode to see the performance impact of the JIT.

```bash
# Run in interpreter-only mode
java -Xint MyApp

# Compare its performance to the default (mixed) mode
java MyApp
```
For any computationally intensive task, the `-Xint` version will be significantly slower.

### Example 3: Forcing AOT Compilation (with GraalVM)

This requires having GraalVM installed.

```java
// HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Native World!");
    }
}
```

**Compile and build native image:**
```bash
# Compile the Java file
javac HelloWorld.java

# Create the native executable
native-image HelloWorld

# Run the executable
./helloworld
```
Notice the instantaneous startup time.

## Key Takeaways

1. **Hybrid Execution**: The JVM uses both an interpreter for fast startup and a JIT compiler for peak performance.
2. **HotSpot is Key**: The JVM identifies and compiles frequently executed "hot spots".
3. **Tiered Compilation is the Default**: Code progresses from the interpreter to C1 and finally C2 for maximum optimization.
4. **JIT is Smart**: It performs powerful optimizations like method inlining and escape analysis based on runtime profiling.
5. **AOT for Startup**: GraalVM's native image provides an alternative for use cases where instant startup and low memory are paramount.
6. **JNI is the Bridge**: It allows Java to interact with the native world, but comes with a performance cost.

## Practice Questions

1. What is the main disadvantage of using only an interpreter?
2. What is a "hot spot" in the context of the JVM?
3. Explain the difference between the C1 and C2 compilers.
4. What is method inlining and why is it beneficial?
5. How can escape analysis improve performance?
6. When would you choose AOT compilation over JIT compilation?
7. What is the purpose of the JNI?
8. How can you see which methods are being JIT-compiled in your application?

## Next Steps

Proceed to [Module 7: Performance Tuning](./07-performance-tuning.md) to learn how to apply your knowledge to optimize Java applications.

## Further Reading

- [The Java HotSpot Performance Engine Architecture](https://www.oracle.com/java/technologies/hotspot-architecture.html)
- [A Deep Dive into GraalVM Native Image](https://www.graalvm.org/22.0/reference-manual/native-image/)
- [JNI Specification](https://docs.oracle.com/en/java/javase/17/docs/specs/jni/index.html)
