# Module 1: JVM Architecture

## Table of Contents
1. [Introduction](#introduction)
2. [JVM vs JRE vs JDK](#jvm-vs-jre-vs-jdk)
3. [JVM Architecture Overview](#jvm-architecture-overview)
4. [Core Components](#core-components)
5. [Platform Independence](#platform-independence)
6. [JVM Implementations](#jvm-implementations)
7. [Practical Examples](#practical-examples)
8. [Key Takeaways](#key-takeaways)

## Introduction

The Java Virtual Machine (JVM) is an abstract computing machine that enables a computer to run Java programs. It's the cornerstone of Java's "Write Once, Run Anywhere" (WORA) principle.

### What is JVM?

The JVM is a specification that provides a runtime environment in which Java bytecode can be executed. It's responsible for:
- Loading, verifying, and executing Java bytecode
- Managing memory
- Providing runtime environment
- Handling security

## JVM vs JRE vs JDK

Understanding the difference between these three is fundamental:

### JVM (Java Virtual Machine)
- **What**: Abstract machine specification
- **Purpose**: Executes Java bytecode
- **Contains**: Runtime engine
- **Size**: Smallest component

### JRE (Java Runtime Environment)
- **What**: Implementation of JVM + libraries
- **Purpose**: Run Java applications
- **Contains**: JVM + Standard libraries (rt.jar) + other supporting files
- **Size**: Medium

### JDK (Java Development Kit)
- **What**: Complete development toolkit
- **Purpose**: Develop and run Java applications
- **Contains**: JRE + Development tools (javac, javadoc, jar, debugger)
- **Size**: Largest

```
┌─────────────────────────────────┐
│            JDK                  │
│  ┌───────────────────────────┐  │
│  │         JRE               │  │
│  │  ┌─────────────────────┐  │  │
│  │  │       JVM           │  │  │
│  │  │  - Interpreter      │  │  │
│  │  │  - JIT Compiler     │  │  │
│  │  │  - Garbage Collector│  │  │
│  │  └─────────────────────┘  │  │
│  │  - Java Class Libraries  │  │
│  └───────────────────────────┘  │
│  - javac, jar, javadoc, etc.   │
└─────────────────────────────────┘
```

## JVM Architecture Overview

The JVM consists of three main subsystems:

### 1. Class Loader Subsystem
- Loads .class files into memory
- Performs verification and initialization

### 2. Runtime Data Areas (Memory Areas)
- Heap, Stack, Method Area, PC Registers, Native Method Stack

### 3. Execution Engine
- Interprets/compiles bytecode
- Executes instructions

```
┌────────────────────────────────────────────────────────┐
│                    JAVA PROGRAM                        │
└────────────────────┬───────────────────────────────────┘
                     │ (.java files)
                     ▼
              ┌──────────────┐
              │   COMPILER   │
              │   (javac)    │
              └──────┬───────┘
                     │ (.class files - Bytecode)
                     ▼
┌────────────────────────────────────────────────────────┐
│                   JVM ARCHITECTURE                     │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │         CLASS LOADER SUBSYSTEM                   │ │
│  │  ┌────────────┐ ┌─────────┐ ┌────────────────┐  │ │
│  │  │  Loading   │→│ Linking │→│ Initialization │  │ │
│  │  └────────────┘ └─────────┘ └────────────────┘  │ │
│  └──────────────────────────────────────────────────┘ │
│                           ↓                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │          RUNTIME DATA AREAS                      │ │
│  │  ┌──────┐  ┌───────┐  ┌────────┐  ┌──────────┐ │ │
│  │  │Method│  │ Heap  │  │ Stack  │  │ PC Reg.  │ │ │
│  │  │ Area │  │       │  │        │  │ Native   │ │ │
│  │  └──────┘  └───────┘  └────────┘  └──────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│                           ↓                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │          EXECUTION ENGINE                        │ │
│  │  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │ │
│  │  │ Interpreter │  │   JIT    │  │  Garbage   │ │ │
│  │  │             │  │ Compiler │  │ Collector  │ │ │
│  │  └─────────────┘  └──────────┘  └────────────┘ │ │
│  └──────────────────────────────────────────────────┘ │
│                           ↓                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │       NATIVE METHOD INTERFACE (JNI)              │ │
│  └──────────────────────────────────────────────────┘ │
│                           ↓                            │
│  ┌──────────────────────────────────────────────────┐ │
│  │       NATIVE METHOD LIBRARIES                    │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Class Loader Subsystem

Responsible for loading class files. It has three main phases:

#### Loading
- **Bootstrap ClassLoader**: Loads core Java classes (rt.jar, JRE classes)
- **Extension ClassLoader**: Loads extension classes (jre/lib/ext)
- **Application ClassLoader**: Loads application-specific classes (classpath)

#### Linking
- **Verification**: Ensures bytecode is valid and doesn't violate security
- **Preparation**: Allocates memory for static variables
- **Resolution**: Replaces symbolic references with direct references

#### Initialization
- Executes static initializers and static blocks

### 2. Runtime Data Areas

#### Method Area (Metaspace in Java 8+)
- Stores class structures, method data, field data, static variables
- Shared among all threads
- Part of non-heap memory

#### Heap
- Stores all objects and instance variables
- Shared among all threads
- Garbage collected
- Divided into Young Generation and Old Generation

#### Stack (Java Stack)
- Thread-private memory area
- Stores frames (local variables, operand stack, frame data)
- Created when thread starts
- LIFO structure

#### Program Counter (PC) Register
- Thread-private
- Stores address of current instruction being executed
- Each thread has its own PC register

#### Native Method Stack
- Thread-private
- Contains native method information
- Used when native methods are called

### 3. Execution Engine

#### Interpreter
- Reads bytecode line by line
- Interprets and executes instructions
- Slow for repeated code

#### Just-In-Time (JIT) Compiler
- Compiles frequently executed bytecode to native machine code
- Optimizes hot spots
- Two compilers: C1 (client) and C2 (server)

#### Garbage Collector
- Automatically manages memory
- Removes unreferenced objects from heap
- Multiple GC algorithms available

### 4. Java Native Interface (JNI)

- Bridge between JVM and native applications
- Allows Java code to call native code (C/C++)
- Enables platform-specific functionality

## Platform Independence

### How Java Achieves Platform Independence

```
Source Code (.java)
        ↓
    Compiler (javac)
        ↓
  Bytecode (.class) ← Platform Independent
        ↓
      ┌─┴─┐
      │JVM│ ← Platform Dependent
      └─┬─┘
        ↓
   Native Code
```

1. **Compilation**: Java source code is compiled to bytecode (not machine code)
2. **Bytecode**: Platform-independent intermediate representation
3. **JVM**: Platform-specific implementation that executes bytecode
4. **Result**: Write once, run anywhere

### Example

```java
// Same .class file runs on all platforms
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, JVM!");
    }
}
```

After compilation:
- Windows JVM interprets bytecode → Windows-specific execution
- Linux JVM interprets bytecode → Linux-specific execution
- macOS JVM interprets bytecode → macOS-specific execution

## JVM Implementations

### 1. HotSpot JVM (Oracle/OpenJDK)
- **Most Popular**: Default JVM for Oracle JDK and OpenJDK
- **Features**: Adaptive optimization, ergonomics, multiple GC options
- **Use Case**: General purpose applications

### 2. OpenJ9 (Eclipse/IBM)
- **Characteristics**: Low memory footprint, fast startup
- **Features**: Ahead-of-Time (AOT) compilation, shared classes
- **Use Case**: Cloud and containerized environments

### 3. GraalVM
- **Characteristics**: Polyglot VM, high performance
- **Features**: AOT native-image compilation, multiple language support
- **Use Case**: Polyglot applications, microservices, serverless

### 4. Azul Zing
- **Characteristics**: Commercial, C4 (Continuously Concurrent Compacting Collector)
- **Features**: Consistent low latency, no GC pauses
- **Use Case**: Low-latency trading systems, real-time applications

### 5. Amazon Corretto
- **Characteristics**: Free, multiplatform, production-ready OpenJDK distribution
- **Features**: Long-term support, security patches
- **Use Case**: AWS environments, general enterprise applications

## Practical Examples

### Example 1: Checking Your JVM Version

```bash
# Check Java version
java -version

# Check JVM details
java -XX:+PrintFlagsFinal -version | grep -i "jvm"
```

### Example 2: Understanding Memory Areas

```java
public class MemoryDemo {
    // Stored in Method Area (static)
    static int staticVar = 100;
    
    // Stored in Heap (instance variable)
    int instanceVar = 200;
    
    public void method() {
        // Stored in Stack (local variable)
        int localVar = 300;
        
        // Object stored in Heap, reference in Stack
        String str = new String("Hello");
        
        System.out.println("Static: " + staticVar);
        System.out.println("Instance: " + instanceVar);
        System.out.println("Local: " + localVar);
        System.out.println("Object: " + str);
    }
    
    public static void main(String[] args) {
        MemoryDemo demo = new MemoryDemo();
        demo.method();
    }
}
```

### Example 3: Viewing Class Loading

```java
public class ClassLoaderDemo {
    public static void main(String[] args) {
        // Print class loaders
        ClassLoaderDemo obj = new ClassLoaderDemo();
        
        System.out.println("ClassLoader: " + 
            obj.getClass().getClassLoader());
        
        System.out.println("Parent ClassLoader: " + 
            obj.getClass().getClassLoader().getParent());
        
        System.out.println("Bootstrap ClassLoader: " + 
            obj.getClass().getClassLoader().getParent().getParent());
        
        // Bootstrap returns null as it's native
    }
}
```

### Example 4: JVM Arguments

```bash
# Set heap size
java -Xms512m -Xmx2048m MyApp

# Enable GC logging
java -Xlog:gc* -jar myapp.jar

# Print JVM configuration
java -XX:+PrintCommandLineFlags -version
```

## Key Takeaways

1. **JVM is a specification**, not an implementation
2. **Three main subsystems**: Class Loader, Memory Areas, Execution Engine
3. **Platform independence** through bytecode compilation
4. **Multiple implementations** available (HotSpot, OpenJ9, GraalVM, etc.)
5. **Memory is organized** into different areas for different purposes
6. **Execution combines** interpretation and compilation (JIT)
7. **JNI enables** interaction with native code

## Practice Questions

1. What's the difference between JVM, JRE, and JDK?
2. Draw the JVM architecture from memory
3. Explain how Java achieves platform independence
4. What are the different runtime data areas?
5. What is the role of the JIT compiler?
6. Which classloader loads java.lang.String?
7. Where are static variables stored?
8. What happens when you run `java MyClass`?

## Next Steps

Proceed to [Module 2: Class Loading Mechanism](./02-classloading.md) to learn how classes are loaded, linked, and initialized in the JVM.

## Further Reading

- [JVM Specification](https://docs.oracle.com/javase/specs/jvms/se17/html/)
- [Oracle JVM Documentation](https://docs.oracle.com/en/java/javase/)
- "Inside the Java Virtual Machine" by Bill Venners
