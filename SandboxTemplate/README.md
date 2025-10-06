# Sandbox Template

This project serves as a template to create sandbox POCs for WebAPI.  The pom includes the following:

- Spring Boot 3.5 (via parent pom)
- Tomcat Embed 10.1
- Actuator
- Spring DevTools

# Using the template

The purpose of this template is to make it quick and easy to get set up with a Maven project.   To get started:

1. Copy contents of SandboxTemplate into a new folder (appropriately named for your Sandbox project).
2. Rename the template package `src/main/ohdsi/sandbox/template` to a package that reflects your sandbox project.
3. The template contains a test folder `test/java/org/ohdsi/sandbox` with a file `.gitkeep` which is not used in the project, but keeps the folder
  structure for git.
4. Add any additional resources and modify `application.yaml` as needed.  We adopted YAML format for application properties.
5. Add any dependencies required for your sandbox to pom.xml `<dependency>` nodes.
6. Modify the copy README.md to include information about the purpose and technical considerations of your sandbox project.





