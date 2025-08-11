package org.ohdsi.sandbox.secdemo.cohortdefinition;

public class CohortDefinition {
    public CohortDefinition() {}

    public CohortDefinition(
            Long id,
            String name,
            String description,
            ExpressionType expressionType,
            SecUser createdBy) {
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
    private SecUser createdBy;

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

    public SecUser getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(SecUser createdBy) {
        this.createdBy = createdBy;
    }
}
