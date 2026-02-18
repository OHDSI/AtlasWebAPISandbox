package org.ohdsi.sandbox.spring_authn.security.authz;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.util.Objects;

/**
 * JPA Entity for cohort_definition_sec table
 */
@Entity
@Table(name = "cohort_definition_sec")
@IdClass(CohortDefinitionAccessEntity.CohortDefinitionAccessId.class)
public class CohortDefinitionAccessEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Id
    @Column(name = "cohort_definition_id")
    private Long cohortDefinitionId;

    @Id
    @Column(name = "access_type")
    @Enumerated(EnumType.STRING)
    private AccessType accessType;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getCohortDefinitionId() {
        return cohortDefinitionId;
    }

    public void setCohortDefinitionId(Long cohortDefinitionId) {
        this.cohortDefinitionId = cohortDefinitionId;
    }

    public AccessType getAccessType() {
        return accessType;
    }

    public void setAccessType(AccessType accessType) {
        this.accessType = accessType;
    }

    /**
     * Composite key class for CohortDefinitionAccessEntity
     */
    public static class CohortDefinitionAccessId implements Serializable {
        private Long userId;
        private Long cohortDefinitionId;
        private AccessType accessType;

        public CohortDefinitionAccessId() {
        }

        public CohortDefinitionAccessId(Long userId, Long cohortDefinitionId, AccessType accessType) {
            this.userId = userId;
            this.cohortDefinitionId = cohortDefinitionId;
            this.accessType = accessType;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof CohortDefinitionAccessId)) return false;
            CohortDefinitionAccessId that = (CohortDefinitionAccessId) o;
            return Objects.equals(userId, that.userId) &&
                   Objects.equals(cohortDefinitionId, that.cohortDefinitionId) &&
                   accessType == that.accessType;
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, cohortDefinitionId, accessType);
        }
    }
}
