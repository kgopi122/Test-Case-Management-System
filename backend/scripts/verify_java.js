const { executeJava } = require('../services/JavaExecutor');

const runTest = async () => {
    console.log("--- Testing Java Execution ---");

    // Test 1: Hello World
    console.log("\nTest 1: Hello World");
    const code1 = `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`;
    const res1 = await executeJava(code1);
    console.log("Output:", res1.output.trim());
    if (res1.output.trim() === "Hello World") console.log("✅ Passed");
    else console.log("❌ Failed");

    // Test 2: Input/Output
    console.log("\nTest 2: Input/Output");
    const code2 = `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNext()) {
            String input = scanner.next();
            System.out.println("Echo: " + input);
        }
    }
}`;
    const res2 = await executeJava(code2, "TestInput");
    console.log("Output:", res2.output.trim());
    if (res2.output.trim() === "Echo: TestInput") console.log("✅ Passed");
    else console.log("❌ Failed");

    // Test 3: Compilation Error
    console.log("\nTest 3: Compilation Error");
    const code3 = `public class Main { public static void main(String[] args) { System.out.printl("Error"); } }`;
    const res3 = await executeJava(code3);
    if (res3.error && res3.error.includes("error: cannot find symbol")) console.log("✅ Passed (Error detected)");
    else console.log("❌ Failed (Error not detected properly)\n" + res3.error);
};

runTest();
