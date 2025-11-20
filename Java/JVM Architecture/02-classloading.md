# Module 2: Class Loading Mechanism

## Table of Contents
1. [Introduction](#introduction)
2. [Class Loading Process](#class-loading-process)
3. [Class Loaders Hierarchy](#class-loaders-hierarchy)
4. [Loading Phase](#loading-phase)
5. [Linking Phase](#linking-phase)
6. [Initialization Phase](#initialization-phase)
7. [Class Loader Delegation Model](#class-loader-delegation-model)
8. [Custom Class Loaders](#custom-class-loaders)
9. [Practical Examples](#practical-examples)
10. [Key Takeaways](#key-takeaways)

## Introduction

Class loading is the process of loading class files into memory. The JVM doesn't load all classes at once; instead, it uses lazy loading - classes are loaded when they're first referenced.

### Why Understanding Class Loading Matters

- Debug ClassNotFoundException and NoClassDefFoundError
- Understand application startup performance
- Create custom class loaders for plugins or modules
- Implement hot deployment
- Isolate different versions of the same class

## Class Loading Process

The class loading process consists of three main phases:

```
┌─────────────────────────────────────────────┐
│          CLASS LOADING PROCESS              │
│                                             │
│  1. LOADING                                 │
│     ├─ Locate .class file                  │
│     ├─ Read bytecode                       │
│     └─ Create Class object                 │
│              ↓                              │
│  2. LINKING                                 │
│     ├─ Verification                         │
│     │   └─ Validate bytecode                │
│     ├─ Preparation                          │
│     │   └─ Allocate memory for statics     │
│     └─ Resolution                           │
│         └─ Replace symbolic references     │
│              ↓                              │
│  3. INITIALIZATION                          │
│     └─ Execute static initializers         │
└─────────────────────────────────────────────┘
```

## Class Loaders Hierarchy

JVM uses three built-in class loaders organized in a parent-child hierarchy:

```
        ┌──────────────────────┐
        │  Bootstrap           │  (Native C/C++)
        │  ClassLoader         │  Loads: rt.jar, core Java classes
        │  (null)              │  Location: JRE/lib
        └──────────┬───────────┘
                   │ parent
        ┌──────────▼───────────┐
        │  Extension/          │  (Java)
        │  Platform ClassLoader│  Loads: Extension classes
        │                      │  Location: JRE/lib/ext
        └──────────┬───────────┘
                   │ parent
        ┌──────────▼───────────┐
        │  Application/        │  (Java)
        │  System ClassLoader  │  Loads: Application classes
        │                      │  Location: Classpath
        └──────────────────────┘
```

### 1. Bootstrap ClassLoader

```java
// Example: Bootstrap loads core classes
String str = "Hello";  // String class loaded by Bootstrap

// Verify
System.out.println(String.class.getClassLoader());  // Output: null
// null indicates Bootstrap ClassLoader (native implementation)
```

**Characteristics:**
- Implemented in native code (C/C++)
- Loads core Java API classes from `$JAVA_HOME/jre/lib`
- Loads `rt.jar`, `resources.jar`, etc.
- Parent of all class loaders
- Returns `null` when queried

### 2. Extension/Platform ClassLoader

```java
// Example: Extension loads extended classes
import javax.crypto.Cipher;  // Loaded by Extension ClassLoader

// Verify
System.out.println(Cipher.class.getClassLoader());
// Output: jdk.internal.loader.ClassLoaders$PlatformClassLoader
```

**Characteristics:**
- Java implementation: `sun.misc.Launcher$ExtClassLoader` (Java 8)
- Java 9+: `PlatformClassLoader`
- Loads from `$JAVA_HOME/jre/lib/ext`
- Or paths specified by `java.ext.dirs`

### 3. Application/System ClassLoader

```java
// Example: Application loads your custom classes
public class MyApp {
    public static void main(String[] args) {
        System.out.println(MyApp.class.getClassLoader());
        // Output: jdk.internal.loader.ClassLoaders$AppClassLoader
    }
}
```

**Characteristics:**
- Java implementation: `sun.misc.Launcher$AppClassLoader`
- Loads classes from application classpath
- Environment variable: `CLASSPATH`
- Default class loader for your application

## Loading Phase

### What Happens During Loading

1. **Locate**: Find the binary representation (.class file)
2. **Read**: Read the byte stream
3. **Create**: Create a `java.lang.Class` object in heap

```java
// Loading example
public class LoadingDemo {
    public static void main(String[] args) throws Exception {
        // Class is loaded when first referenced
        System.out.println("Before loading");
        
        // This triggers loading
        Class<?> clazz = Class.forName("java.util.ArrayList");
        
        System.out.println("After loading: " + clazz.getName());
    }
}
```

### When Classes Are Loaded

Classes are loaded when:
- Creating instance with `new`
- Calling static method
- Accessing static field
- Using reflection (`Class.forName()`)
- Loading subclass (parent loaded first)
- JVM startup (main class)

```java
public class LazyLoadingDemo {
    static {
        System.out.println("LazyLoadingDemo loaded");
    }
    
    static class InnerClass {
        static {
            System.out.println("InnerClass loaded");
        }
    }
    
    public static void main(String[] args) {
        System.out.println("Main started");
        // InnerClass not yet loaded
        
        new InnerClass();  // NOW InnerClass is loaded
    }
}

// Output:
// LazyLoadingDemo loaded
// Main started
// InnerClass loaded
```

## Linking Phase

Linking consists of three steps: Verification, Preparation, and Resolution.

### 1. Verification

Ensures the class file is correctly formatted and doesn't violate security.

**Checks performed:**
- File format verification
- Metadata verification
- Bytecode verification
- Symbolic reference verification

```java
// Example: This would fail verification
// (Invalid bytecode)
public class InvalidBytecode {
    public void method() {
        // Manipulated .class file with invalid operand stack operations
        // JVM will throw VerifyError
    }
}
```

**Common verification errors:**
- `VerifyError`: Bytecode verification failed
- `ClassFormatError`: Invalid class file format
- `UnsupportedClassVersionError`: Class compiled with newer Java version

### 2. Preparation

Allocates memory for static variables and assigns default values.

```java
public class PreparationDemo {
    // During Preparation phase:
    static int number;        // Assigned 0
    static String text;       // Assigned null
    static boolean flag;      // Assigned false
    static Object obj;        // Assigned null
    
    // These values are assigned during Initialization, not Preparation
    static int initialized = 100;
    static String name = "Java";
}
```

**Default Values Assigned:**
- `int`, `short`, `byte`, `long`: `0`
- `float`, `double`: `0.0`
- `boolean`: `false`
- `reference types`: `null`

### 3. Resolution

Replaces symbolic references in the constant pool with direct references (memory addresses).

```java
public class A {
    public void method() {
        B b = new B();  // Symbolic reference to class B
        b.display();    // Symbolic reference to method display()
    }
}

class B {
    public void display() {
        System.out.println("Hello from B");
    }
}

// During Resolution:
// "B" (symbolic) → Memory address of class B (direct)
// "display()" (symbolic) → Memory address of method (direct)
```

## Initialization Phase

The final phase where static initializers and static blocks are executed.

### Initialization Order

```java
public class InitializationOrder {
    // 1. Static variables in order of declaration
    static int a = 10;
    
    // 2. Static blocks in order of appearance
    static {
        System.out.println("First static block: a = " + a);
        b = 20;
    }
    
    static int b;
    
    static {
        System.out.println("Second static block: b = " + b);
    }
    
    // Instance variables (during object creation)
    int x = 100;
    
    // Instance initializer block
    {
        System.out.println("Instance block: x = " + x);
    }
    
    // Constructor
    public InitializationOrder() {
        System.out.println("Constructor");
    }
    
    public static void main(String[] args) {
        System.out.println("Main method");
        new InitializationOrder();
    }
}

// Output:
// First static block: a = 10
// Second static block: b = 20
// Main method
// Instance block: x = 100
// Constructor
```

### Parent-Child Initialization

```java
class Parent {
    static {
        System.out.println("Parent static block");
    }
    
    {
        System.out.println("Parent instance block");
    }
    
    public Parent() {
        System.out.println("Parent constructor");
    }
}

class Child extends Parent {
    static {
        System.out.println("Child static block");
    }
    
    {
        System.out.println("Child instance block");
    }
    
    public Child() {
        System.out.println("Child constructor");
    }
    
    public static void main(String[] args) {
        new Child();
    }
}

// Output:
// Parent static block      ← Parent class initialized first
// Child static block       ← Then child class
// Parent instance block    ← Parent instance initialization
// Parent constructor
// Child instance block     ← Child instance initialization
// Child constructor
```

## Class Loader Delegation Model

The delegation model is a security feature where class loaders delegate loading to parent before attempting to load themselves.

### How Delegation Works

```
Request to load class "com.example.MyClass"
                ↓
    ┌───────────────────────┐
    │ Application CL        │
    │ Checks if loaded?     │ No → Delegate to parent
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ Extension CL          │
    │ Checks if loaded?     │ No → Delegate to parent
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ Bootstrap CL          │
    │ Checks if loaded?     │ No → Try to load
    │ Can't find it         │ Return failure
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ Extension CL          │
    │ Try to load           │ Can't find it
    └───────────┬───────────┘
                ↓
    ┌───────────────────────┐
    │ Application CL        │
    │ Try to load           │ SUCCESS! ✓
    └───────────────────────┘
```

### Delegation Example

```java
public class DelegationDemo {
    public static void main(String[] args) {
        ClassLoader appCL = DelegationDemo.class.getClassLoader();
        ClassLoader extCL = appCL.getParent();
        ClassLoader bootCL = extCL.getParent();
        
        System.out.println("Application CL: " + appCL);
        System.out.println("Extension CL: " + extCL);
        System.out.println("Bootstrap CL: " + bootCL);  // null
        
        // Try loading String (bootstrap)
        try {
            Class<?> stringClass = appCL.loadClass("java.lang.String");
            System.out.println("String loaded by: " + 
                stringClass.getClassLoader());  // null (Bootstrap)
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }
}
```

### Why Delegation Model?

1. **Security**: Prevents malicious code from replacing core classes
2. **Avoid Duplication**: Classes loaded once at highest level
3. **Consistency**: Same class definition across application

```java
// This won't work - you can't override java.lang.String
package java.lang;

public class String {
    // Your malicious implementation
    // Will be ignored - Bootstrap loads official String first
}
```

## Custom Class Loaders

Create custom class loaders for specific use cases.

### Basic Custom Class Loader

```java
import java.io.*;

public class CustomClassLoader extends ClassLoader {
    private String classPath;
    
    public CustomClassLoader(String classPath) {
        this.classPath = classPath;
    }
    
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] classData = loadClassData(name);
            if (classData == null) {
                throw new ClassNotFoundException();
            }
            return defineClass(name, classData, 0, classData.length);
        } catch (IOException e) {
            throw new ClassNotFoundException();
        }
    }
    
    private byte[] loadClassData(String name) throws IOException {
        String fileName = classPath + File.separator + 
                         name.replace('.', File.separatorChar) + ".class";
        
        try (InputStream is = new FileInputStream(fileName);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = is.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }
            return baos.toByteArray();
        }
    }
    
    public static void main(String[] args) throws Exception {
        CustomClassLoader loader = new CustomClassLoader("./classes");
        Class<?> clazz = loader.loadClass("com.example.MyClass");
        Object obj = clazz.getDeclaredConstructor().newInstance();
        System.out.println("Loaded: " + obj.getClass().getName());
    }
}
```

### Hot Swap Class Loader

```java
public class HotSwapClassLoader extends ClassLoader {
    private String classPath;
    
    public HotSwapClassLoader(String classPath) {
        super(HotSwapClassLoader.class.getClassLoader());
        this.classPath = classPath;
    }
    
    @Override
    public Class<?> loadClass(String name) throws ClassNotFoundException {
        // For our classes, don't delegate to parent
        if (name.startsWith("com.example.hotswap")) {
            return findClass(name);
        }
        // For other classes, use delegation
        return super.loadClass(name);
    }
    
    // ... implement findClass similar to above
}
```

### Use Cases for Custom Class Loaders

1. **Plugin Systems**: Load plugins dynamically
2. **Hot Deployment**: Reload classes without restart
3. **Class Isolation**: Different versions of same class
4. **Encrypted Classes**: Decrypt before loading
5. **Network Loading**: Load classes from remote server

## Practical Examples

### Example 1: Understanding Class Loading Timing

```java
public class LoadingTimingDemo {
    static {
        System.out.println("LoadingTimingDemo class loaded");
    }
    
    public static void main(String[] args) {
        System.out.println("Main started");
        
        // Helper not loaded yet
        System.out.println("Before Helper reference");
        
        // This loads Helper class
        Helper.doSomething();
        
        System.out.println("After Helper reference");
    }
}

class Helper {
    static {
        System.out.println("Helper class loaded");
    }
    
    public static void doSomething() {
        System.out.println("Helper doing something");
    }
}

// Output:
// LoadingTimingDemo class loaded
// Main started
// Before Helper reference
// Helper class loaded
// Helper doing something
// After Helper reference
```

### Example 2: ClassNotFoundException vs NoClassDefFoundError

```java
// ClassNotFoundException - class not found at runtime
public class ClassNotFoundDemo {
    public static void main(String[] args) {
        try {
            Class.forName("com.example.NonExistentClass");
        } catch (ClassNotFoundException e) {
            System.out.println("ClassNotFoundException: " + e.getMessage());
        }
    }
}

// NoClassDefFoundError - class was present at compile time but not at runtime
public class NoClassDefErrorDemo {
    public static void main(String[] args) {
        // Assuming DependentClass was available during compilation
        // but its .class file is missing at runtime
        DependentClass obj = new DependentClass();  // NoClassDefFoundError
    }
}
```

### Example 3: Class Loader Hierarchy Exploration

```java
public class ClassLoaderExplorer {
    public static void main(String[] args) {
        // Explore class loader hierarchy
        printClassLoader("String", String.class);
        printClassLoader("ArrayList", java.util.ArrayList.class);
        printClassLoader("This class", ClassLoaderExplorer.class);
        
        // Print all classes loaded by current class loader
        System.out.println("\nAll loaded classes:");
        ClassLoader cl = ClassLoaderExplorer.class.getClassLoader();
        System.out.println(cl);
    }
    
    private static void printClassLoader(String name, Class<?> clazz) {
        System.out.println(name + " loaded by: " + clazz.getClassLoader());
    }
}
```

### Example 4: Preventing Class Unloading

```java
public class ClassUnloadingDemo {
    public static void main(String[] args) throws Exception {
        ClassLoader cl = new CustomClassLoader("./classes");
        Class<?> clazz = cl.loadClass("com.example.MyClass");
        Object instance = clazz.getDeclaredConstructor().newInstance();
        
        System.out.println("Class loaded: " + clazz.getName());
        
        // Remove all references
        instance = null;
        clazz = null;
        cl = null;
        
        // Suggest garbage collection
        System.gc();
        Thread.sleep(1000);
        
        System.out.println("After GC - class may be unloaded");
        // Class might be unloaded if no references exist
    }
}
```

## Key Takeaways

1. **Three Phases**: Loading, Linking (Verification, Preparation, Resolution), Initialization
2. **Three Class Loaders**: Bootstrap, Extension/Platform, Application/System
3. **Delegation Model**: Child delegates to parent before loading
4. **Lazy Loading**: Classes loaded only when first referenced
5. **Static First**: Static initialization happens before instance initialization
6. **Parent Before Child**: Parent class initialized before child class
7. **Security**: Delegation prevents core class replacement
8. **Custom Loaders**: Enable plugins, hot deployment, class isolation

## Common Issues and Solutions

### Issue 1: ClassNotFoundException
**Cause**: Class not found in classpath
**Solution**: Check classpath, verify JAR files, check package names

### Issue 2: NoClassDefFoundError
**Cause**: Class was present at compile time but missing at runtime
**Solution**: Ensure all dependencies are packaged, check class loading order

### Issue 3: LinkageError
**Cause**: Same class loaded by different class loaders
**Solution**: Review class loader hierarchy, ensure single class loader for shared classes

### Issue 4: OutOfMemoryError: Metaspace
**Cause**: Too many classes loaded, memory leak in class loaders
**Solution**: Increase metaspace size, fix class loader leaks

## Practice Questions

1. What are the three phases of class loading?
2. Explain the class loader delegation model
3. When is a class initialized?
4. What's the difference between ClassNotFoundException and NoClassDefFoundError?
5. Why does `String.class.getClassLoader()` return null?
6. How would you implement hot deployment using custom class loaders?
7. What happens during the Preparation phase?
8. In what order are static blocks executed in parent and child classes?

## Next Steps

Proceed to [Module 3: Memory Management](./03-memory-management.md) to learn about JVM memory organization and runtime data areas.

## Further Reading

- [JVM Specification - Class Loading](https://docs.oracle.com/javase/specs/jvms/se17/html/jvms-5.html)
- [Understanding Class Loaders](https://docs.oracle.com/javase/tutorial/ext/basics/load.html)
- "Java Performance: The Definitive Guide" by Scott Oaks (Chapter on Class Loading)
