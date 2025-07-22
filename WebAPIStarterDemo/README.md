# WebAPI Starter Demo

This sandbox project demonstrates a maven project (with necessary dependencies) for the following setup:

- JDK 21
- Spring Boot 3.5
- Tomcat Embed 10.1
- Flyway 11.7 with 3 migrations
- Actuator to shutdown the app
- An echo REST controller

The following sections will provide the details and considerations made when bulding it.

# Technical Details

## JDK and Spring Boot

I chose to download the JDK 21 from [Adoptium](https://adoptium.net/).  It seems to have active development, current build status, and frequent releases.  

For Spring Boot, version 3.5, which was initlaly released May 22, 2025.  3.5.3 (which is referenced in this sandbox project) was released June 20th.

## Embedded Postgres

To make the demo more self-contained, I leveraged Opentable's `otj-pg-embedded` library that spawns a PG instance into a temporary locaton. In order to get the Spring Boot hot-reload to work without starting a new PG instance every save, the `PgHolder` that contains a static reference to a running PG instance in the VM was exported into a stand-alone sandbox project `pg-embed`.  Details about the considerations related to this choice will be discussed in the `Launching Application` section.

The DB starts off with a default schema `webapi_sandbox` which can be reerenced in any other sandbox project.   I didn't put enough effort in to make this configurable, but that's something we could put energy into if we wanted.

To use this PG holder in your own sandbox, add this dependency:

```
<dependency>
  <groupId>org.ohdsi.sandbox</groupId>
  <artifactId>pg-embed</artifactId>
  <version>1.0.0</version>
  <type>jar</type>
</dependency>
```

And in the `main()` method of your class, you can trigger the load and JVM hooks by accessing the static class:

```
public static void main(String[] args) {
  //debugExitSetup();
  // for demo purposes, we will launch the embedded PG prior to launching the spring app
  EmbeddedPostgres pg = PgHolder.getPostgres(); // this will init PG outside of spring reloaded class loader

  SpringApplication.run(WebApiStarterDemoApplication.class, args);
}
```


## Flyway

Spring boot 3.5.3 referenes Flyway 11.7.  This demo demonstrates 2 SQL and 1 Java migration.  After starting up the app, you can query the `flyway_schema_history` to see the order of applied migrations (and you will see Sql-Java-Sql deployed).

## Compiling

To ensure consistent builds across different environments, we included the [Maven Wrapper](https://maven.apache.org/tools/wrapper/), a small script and set of supporting files that download and use a specific Maven version defined in maven-wrapper.properties. When present, modern IDEs like NetBeans, IntelliJ IDEA, and VS Code automatically detect and prefer the wrapper (./mvnw or mvnw.cmd) over any globally installed Maven version. This eliminates version mismatches and ensures that all developers and CI systems use the same Maven configuration without requiring separate installation steps.

## Debugging

To enable interactive debugging within NetBeans, we customized the project's run configuration by adding specific JVM arguments to the debug action. This included enabling the JDWP agent with parameters like -Xdebug -Xrunjdwp:transport=dt_socket,server=n,address=${jpda.address} to allow the debugger to attach on a known port. Additionally, to support Spring Boot's behavior and allow smooth reloads and profiling, we configured properties such as spring-boot.run.jvmArguments to pass these flags through the Maven spring-boot:run goal. This setup ensured we could set breakpoints and inspect the application in real time while still supporting hot reload and reproducible behavior within the IDE.

Similar steps would be taken in VS Code to launch the process with the necessary debug hooks.

## Hot Reload

Hot reloading was made possible by configuring NetBeans with "Compile on Save" enabled, which triggers class recompilation directly into the target/classes directory. Spring Boot's DevTools or file-watching mechanism observes this directory and automatically reloads the application context when changes are detected. While this setup greatly accelerates development, it introduced a problem: the embedded Postgres instance (managed by PgHolder) was being repeatedly restarted with every reload. The root cause was that the embedded database class was located within the Spring Boot application's classpath, causing it to reload alongside the main application. To resolve this, we externalized the PG management logic into a separate library. The Spring Boot app no longer directly references PgHolder; instead, JDBC connection information is passed via system properties. The library retrieves and sets these using System.getProperty() and System.setProperty() calls. This separation ensures that the embedded Postgres instance remains initialized only once, regardless of how often the Spring container restarts.

## Spring Actuators

During development, an issue arose with the debugging workflow: terminating the debug session in the IDE forcibly killed the process without triggering Spring Boot’s graceful shutdown hooks—or even standard JVM shutdown hooks. As a result, the embedded Postgres instance remained running in memory, orphaned after the JVM was disposed. To address this, Spring Boot’s Actuator module was enabled with the shutdown endpoint exposed. Before stopping the debug session, a curl command could be issued to hit the /actuator/shutdown endpoint, allowing the application to terminate cleanly and trigger all shutdown hooks, including the one managing the Postgres lifecycle. This ensured proper resource cleanup. One tradeoff of this approach was that the shutdown procedure caused InterruptedExceptions to ripple through the application threads, which ultimately led the process to exit with a non-zero status—something to be aware of during automated testing or when monitoring logs.  However, this only is an issue when there is a forced shutdown of the process. Any unit tests or CI pipelines should let the JVM flow through a normal lifecycle.

The command in this demo to shutdown the app is:

```
curl -u admin:demo -X POST http://localhost:8080/actuator/shutdown
```

Since this doesn't seem to incur significant overhead to the buld times or runtime performance, we could investigate the use of actuators for other purposes in WebAPI.

## The Echo REST controller

The core purpose of the demo application (aside from the JDK21 and Flyway migration) is to expose a simple REST endpoint using Spring Boot that echoes back a message provided as a URL parameter. Spring Boot streamlines the development of web applications by auto-configuring the underlying framework and embedding a servlet container, allowing developers to focus on writing minimal boilerplate code. In this case, a single controller class was defined using the @RestController annotation to handle incoming HTTP GET requests. The controller maps a route `/echo` and reads a query parameter named `message`. When accessed, the endpoint simply returns the value of that message parameter as the HTTP response body. This kind of controller is useful for validating connectivity, exploring request handling, or serving as a foundation for more advanced behavior.

