# Spotless Maven Plugin Demo

Demonstrates how we could use the [maven-spotless-plugin](https://github.com/diffplug/spotless/tree/main/plugin-maven#-spotless-keep-your-code-spotless-with-maven) to enforce formatting standards in Java files (`*.java`), Maven files (`pom.xml`), and Markdown files (`*.md`). [The plugin supports a plethora of other file types and formatting tools as well](https://github.com/diffplug/spotless/tree/main/plugin-maven#table-of-contents).

> Note: The purpose of this branch is more to advocate for the use of the maven-spotless-plugin (and the formatting tools it supports) to enforce a consistent set of formatting rules, and not necessarily the formatting opinions themselves.

## Reporting Violations

[MalformattedExample.java](src/main/java/org/ohdsi/sandbox/spotless_demo/MalformattedExample.java) contains code that is malformatted (based on the formatting rules chosen for this example). Spotless can show the malformatted code by running:
```shell
./mvnw spotless:check
```

## Auto Fixing Violations

Spotless automatically fix the formatting violations in [MalformattedExample.java](src/main/java/org/ohdsi/sandbox/spotless_demo/MalformattedExample.java) by running:
```shell
./mvnw spotless:apply
```

## Auto Detecting Violations

The `spotless:check` goal has been bound to the `test` phase (although any Maven phase could be chosen), so violations will also be reported by running:

```shell
./mvnw test
```

## Java Formatting

This branch demonstrates the use of the [Google Java Format standard](https://github.com/google/google-java-format) on Java source files. This demo [is configured to enforce](./pom.xml):
1. Import statement order
2. Forbid wildcard imports
3. Remove unused imports
4. Trim trailing whitespace
5. End files with a newline character

Formatting can be disabled for certain blocks of code (where custom formatting makes the code more readable). This is achieved with:

```java
// spotless:off
anExample()
    .of()
    .disabling()
    .spotless();
// spotless:on
```

## Maven POM file Formatting

This branch demonstrates the use of the Sortpom Maven Plugin to enforce:
1. Line separator character (`\n`)
2. Don't expand empty elements (i.e. prefer `<example/>` over `<example></example>`)
3. Enforce a space when closing empty elements (i.e. prefer `<example />` over `<example/>`)
