# External Configuration Demo

The purpose of this project is to demonstrate a method of externalizing the application configuration so that no rebuild step is required in order to update configuration of a WebAPI deployment.

## Background

In the 2.x line of WebAPI, the Maven build process uses resource filtering to inject application configuration into the `application.properties` file of the application.   While we were able to give clear instructions on how to build the project and create custom maven profiles with the application settings, it requires additional overhead of an implementer to install JDKs and Maven tools in order to get started.   The hope is that we can provide instructions on maintaining environment-specific settings in external configuration or environment variables so that we can deploy a pre-built WAR once, and let people deploy it easily.

##  External Configuration Options

Using the Spring Boot Framework for configuration, there are several options:

- embedded in the classpath under src/main/resources
- external config files
  - config/application.yaml (In the same folder as the WAR {tomcat deployments})
  - A path specified via --spring.config.location=/path/to/config.yaml.
  - An environment variable (SPRING_CONFIG_LOCATION).  
- ENV Variables (ex: SPRING_DATASOURCE_URL)
- JVM system properties (-Dspring.datasource.url=...)

To externalize configuration, a default set of configuration can be provided in the WAR path (src/main/resources) and then other overrides can be provided though external files, environment variables or JVM launch properties.

This demo will suggest different ways of launching or deploying an application with parameters pointing to external configuration files, and using environment variables.

## Application properties in YAML format (application.yaml)

Another change from 2.x is using the `.yaml` format from `.properties`.  We will show configuration using this format, and consider some of the implications of shifting to this format.

# Overview 

Demonstrates how to externalize configuration for a Spring Boot 3.5 web service without using profiles.
Both developers and production deployments specify an **external configuration path** using
`spring.config.additional-location`, allowing consistent behavior across environments.

## 📘 Overview

This simple app exposes a REST endpoint that echoes configuration values read from YAML.

```bash
GET /api/config/echo
```

Example output:
```json
{
  "appName": "OHDSI Sandbox External Config Example",
  "environment": "developer",
  "customMessage": "Hello from your external configuration file!"
}
```

---

## ⚙️ Configuration Strategy

- The app always loads `src/main/resources/application.yaml` as embedded defaults.
- If `spring.config.additional-location` is provided, Spring loads the external file(s) **on top of** the embedded one.
- External values override internal ones.

Example:
```bash
-Dspring.config.additional-location=file:./config/application.yaml
```

---

## 🧑‍💻 Running in VS Code

Create `config/application.yaml` at project root, then in `.vscode/launch.json`:

```json
{
  "configurations": [
    {
      "type": "java",
      "name": "Debug External Config App",
      "request": "launch",
      "mainClass": "org.ohdsi.sandbox.external_config.ExternalConfigDemoApp",
      "projectName": "external-config",
      "vmArgs": "-Dspring.config.additional-location=file:./config/local-config.yaml"
    }  
  ]
}
```

---

## 🧩 Running in NetBeans

1. Right-click the project → **Properties** → **Run**.
2. Under *VM Options*, add:
   ```
   -Dspring.config.additional-location=file:./config/local-config.yaml
   ```
3. Run or Debug from IDE.

---

## 🚀 Running via Maven

```bash
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.config.additional-location=file:./config/local-config.yaml"
```

*_Note_*: If the external config (under ./config) is named `application.yaml`, it will be used automatically!

---

## 🧱 Deploying to Tomcat

1. **Package the WAR**
   ```bash
   mvn clean package
   ```
2. **Place external config** at `/some/path/webapi/config/local-config.yaml`.
3. **Tomcat context.xml**
   ```xml
   <Context>
       <Environment name="spring.config.additional-location"
                    value="file:/some/path/webapi/config/local-config.yaml"
                    type="java.lang.String"
                    override="false"/>
   </Context>
   ```
4. Deploy the WAR and context.xml via Tomcat Manager.

---

## 🧠 Notes

- `spring.config.location` *replaces* the defaults.
- `spring.config.additional-location` *adds to* the defaults (recommended).
- Always prefix with `file:` when using absolute paths.
- Keep a sample config (`config/application-sample.yaml`) under version control.











