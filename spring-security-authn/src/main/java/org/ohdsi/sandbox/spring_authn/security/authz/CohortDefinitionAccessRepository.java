package org.ohdsi.sandbox.spring_authn.security.authz;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for cohort_definition_sec table
 */
@Repository
public interface CohortDefinitionAccessRepository extends JpaRepository<CohortDefinitionAccessEntity, CohortDefinitionAccessEntity.CohortDefinitionAccessId> {

    /**
     * Check if a user has specific access to a cohort definition
     */
    @Query("""
        SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END
        FROM CohortDefinitionAccessEntity c
        JOIN UserRoleEntity ur
            ON ur.role.id = c.roleId
        WHERE ur.user.id = :userId
        AND c.cohortDefinitionId = :cohortDefinitionId
        AND c.accessType = :accessType
    """)
    boolean hasAccess(@Param("userId") Long userId, 
                      @Param("cohortDefinitionId") Long cohortDefinitionId,
                      @Param("accessType") AccessType accessType);

    /**
     * Get the owner (created_by_id) of a cohort definition
     */
    @Query("SELECT cd.createdBy.id FROM CohortDefinition cd WHERE cd.id = :cohortDefinitionId")
    Long getCreatedById(@Param("cohortDefinitionId") Long cohortDefinitionId);
}
