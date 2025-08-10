package org.ohdsi.sandbox.secdemo.domain;

// The CohortDefinition domain object (not an entity, it knows nothing about
// persistence technology).
public class CohortDefinitionDomain {
    public CohortDefinitionDomain() {}

    public CohortDefinitionDomain(
            Long id,
            String name,
            String description,
            ExpressionType expressionType,
            UserDomain createdBy) {
        setId(id);
        setName(name);
        setDescription(description);
        setExpressionType(expressionType);
        setCreatedBy(createdBy);
    }

    private Long id;
    private String name;
    private String description;
    private ExpressionType expressionType;
    private UserDomain createdBy;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        if (id == null || id < 0) {
            throw new IllegalArgumentException("Invalid cohort definition id: " + id);
        }
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Cohort definition name cannot be null or blank: ");
        }
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ExpressionType getExpressionType() {
        return expressionType;
    }

    public void setExpressionType(ExpressionType expressionType) {
        this.expressionType = expressionType;
    }

    public UserDomain getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UserDomain createdBy) {
        this.createdBy = createdBy;
    }
}
