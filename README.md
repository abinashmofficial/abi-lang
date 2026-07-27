# AbiLang (`.abi`)

AbiLang is a simple, easy-to-learn, lightweight programming language named after you (**Abinash**). It is built in TypeScript and is designed to run seamlessly in both CLI (terminal) and Web (browser) environments.

---

## Language Syntax & Features

### 1. Variables
Assign values dynamically using standard syntax. No variable declarations like `var`, `let`, or `const` are required:
```
name = "Abinash"
age = 21
pi = 3.14159
```

### 2. Print Output
Print message logs or variables to the console/terminal:
```
print "Hello, world!"
print name
print 10 + 20 * 2
```

### 3. Input Prompts
Ask questions and store the responses in variables. It supports both string and number automatic parsing:
```
user_input = input "What is your favorite number? "
print "You selected: " + user_input
```

### 4. Conditionals (`if` / `else`)
Brace-based conditional blocks. Parentheses around conditions are optional, matching modern standards:
```
score = input "Enter score: "
if score >= 90 {
    print "Grade A"
} else if score >= 80 {
    print "Grade B"
} else {
    print "Grade F"
}
```

### 5. Loops (`while`)
Run a block of code repeatedly while a condition is true:
```
count = 1
while count <= 5 {
    print "Iteration: " + count
    count = count + 1
}
```

### 6. Object-Oriented Programming (OOP) & Classes
Define structured classes with class methods, member variables (using `this`), and visibility-based access control (`public`, `private`, `protected`):
```
class Controller {
    public func init(name) {
        this.name = name
    }

    public func index() {
        this.log_access()
        return view("index")
    }

    private func log_access() {
        print "Internal action logged for: " + this.name
    }
}

# Instantiate class
c = Controller()
c.init("HomeController")

# Call public method
c.index() 
```

Visibility rules:
* `public`: Methods are accessible from any context.
* `private` / `protected`: Methods are restricted and only accessible from within methods of the class instance. External access attempts will throw a runtime error.

Class inheritance is supported via the `extends` keyword:
```
class BaseController {
    public func greet() {
        print "Hello from Base"
    }
}

class HomeController extends BaseController {
    public func index() {
        this.greet()
    }
}
```

### 7. Try / Catch / Finally
Handle runtime exceptions safely using standard block scopes:
```
try {
    print undefined_variable
} catch (e) {
    print "Caught error: " + e
} finally {
    print "Cleanup actions completed"
}
```

### 8. Built-in Database & Debug Helpers
Simulated Laravel-like rich debugging and database interactions:
* `db_connect(config)`: Mock database connection.
* `db_create(table, data)`: Create records (returns the created record with generated ID).
* `db_update(table, id, data)`: Update records.
* `db_delete(table, id)`: Delete records.
* `db_fetch(table, query)`: Fetch mock record lists.
* `dx(value)`: Dump and die — prints a rich dark-styled structured dump of the value and **halts execution immediately** (Laravel-style).
* `log_core(value)`: Lightweight logger for logic/script files — outputs `[CORE LOG] value`.
* `log_view(value)`: Lightweight logger for template/screen files — outputs `[VIEW LOG] value`.

---

## 9. AbiLang UI Component Architecture (`.abx`) vs React / Vue / Blade

AbiLang UI (`.abx`) combines the clean component modularity of **React JS**, single-file components of **Vue**, and zero-boilerplate rendering of **Laravel Blade**.

### React-style Clean Script Exports (No `context` Mutation Needed)
Instead of assigning state to `context.propName = value`, export constants and reactive state directly using standard ES `export` syntax:

```html
render Header from "layout/header"
render LandingBody from "components/landing_body"
render Footer from "layout/footer"

<script prepare>
    const fs = require('fs');
    const path = require('path');

    function loadMessages(langCode = process.env.APP_LANG || 'en') {
        try {
            const langFile = path.resolve(`abicore/lang/${langCode}/messages.json`);
            if (fs.existsSync(langFile)) {
                return JSON.parse(fs.readFileSync(langFile, 'utf8'));
            }
            return JSON.parse(fs.readFileSync(path.resolve('abicore/lang/en/messages.json'), 'utf8'));
        } catch {
            return { title: "AbiLang", subtitle: "Welcome" };
        }
    }

    // Export props directly (React / ES Module Style)
    export const lang = loadMessages();
    export const profileName = "Abinash";
    export const profileRole = "Lead Platform Architect";
</script>

<Header />
<LandingBody />
<Footer />
```

---

## 10. Why AbiLang? (Comparison with Other Languages)

| Feature | **AbiLang** (`.abi`, `.abx`) | **React / JavaScript** | **Python** | **PHP / Blade** |
| :--- | :--- | :--- | :--- | :--- |
| **Variable Declaration** | **Zero-boilerplate** (`x = 10`) | Mandatory (`const`/`let`) | Direct (`x = 10`) | Dollar signs (`$x = 10`) |
| **Component Setup** | Direct `export const varName` | Hook wrappers (`useState`) | N/A | PHP Tags `<?php ?>` |
| **Component Ingestion** | Top-level `render Comp from "path"` | `import Comp from './path'` | N/A | `@include('path')` |
| **Single File Component** | `<script>` + `<style>` + `<JSX>` | Requires JSX + CSS Modules | N/A | Separate HTML / PHP |
| **Learning Curve & Speed** | **Ultra-Fast & Instant** | High (Babel/Webpack/Vite build) | Easy (Server-only) | Medium |

---

## Development & Execution

### System Requirements
* Node.js (v18+)

### 1. Installation & Setup
Clone the repository and install the project dependencies:
```bash
git clone https://github.com/abinashmofficial/abi-lang.git
cd abi-lang
npm install
```

### 2. Compile & Bundle
Compile the compiler/interpreter and bundle the playground web files:
```bash
npm run build
```

### 3. Running in CLI (Terminal)

* **Launch Interactive REPL Session**:
  ```bash
  npm run cli
  ```
  Type lines of code (e.g., `print 10 + 20` or `name = input "name? "`) and hit Enter. Type `exit` to quit.

* **Execute an AbiLang Script File (.abi)**:
  * **macOS / Linux**:
    ```bash
    npm run cli path/to/script.abi
    ```
  * **Windows (PowerShell / Command Prompt)**:
    ```powershell
    npm run cli path\to\script.abi
    ```

### 4. Running Web Playground (Browser)
1. Launch the local web server:
   ```bash
   npm run web
   ```
2. Open the URL in your browser:
   * **[http://127.0.0.1:8080](http://127.0.0.1:8080)**

### 5. Mobile Deployment (Android & iOS)

AbiLang can be deployed to mobile viewports in two ways:

* **Capacitor Native Wrapper (Visual App)**:
  Bundle the web sandbox playground directly into a native Android/iOS mobile application:
  ```bash
  npm install @capacitor/core @capacitor/cli
  npx cap init AbiLang com.abinash.abilang --web-dir=web
  npm install @capacitor/android @capacitor/ios
  npx cap add android
  npx cap add ios
  npx cap sync
  npx cap open android # Opens in Android Studio
  npx cap open ios     # Opens in Xcode
  ```

* **React Native Embedding (Engine Core)**:
  Embed the minified compiler core straight inside native JavaScript engines:
  1. Copy `web/dist/abilang.min.js` to your React Native assets.
  2. Import the IIFE module: `import './assets/abilang.min.js';`
  3. Instantiate the execution wrapper: `const interpreter = new global.AbiLang.Interpreter(mobileIO);`

---

## Project Structure

* `src/` - The compiler/interpreter source code (using the `.abi` file extension!)
  * `types.abi` - Tokens & AST type definitions
  * `lexer.abi` - Lexical scanner
  * `parser.abi` - Recursive descent parser
  * `interpreter.abi` - Evaluation and Runtime Environment
  * `cli.abi` - Terminal runner & REPL
  * `index.abi` - Main library entry point
* `web/` - Visual Web Playground files
  * `index.html` - Playground webpage layout
  * `style.css` - Premium styling (dark mode, layout, animations)
  * `app.js` - Connecting the compiler inputs to the UI outputs
  * `dist/abilang.min.js` - Minified compiler/interpreter bundle
* `examples/` - Example script files
