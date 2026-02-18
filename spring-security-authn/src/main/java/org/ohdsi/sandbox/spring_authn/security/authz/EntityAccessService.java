package org.ohdsi.sandbox.spring_authn.security.authz;

import org.springframework.stereotype.Service;

/**
 * Service that encapsulates access to entity-specific security repositories.
 * This keeps AuthorizationService clean by delegating entity-specific queries.
 */
@Service
public class EntityAccessService {

    private final CohortDefinitionAccessRepository cohortDefAccessRepo;
    // Add more repositories as new entities are added

    public EntityAccessService(CohortDefinitionAccessRepository cohortDefAccessRepo) {
        this.cohortDefAccessRepo = cohortDefAccessRepo;
    }

    /**
     * Check if a user has specific access to an entity via {entity}_sec table
     * 
     * @param userId The user ID to check
     * @param entityId The entity ID to check
     * @param entityType The type of entity (e.g., COHORT_DEFINITION)
    * @param accessType The type of access (READ, WRITE)
     * @return true if the user has the specified access
     */
    public boolean hasEntityAccess(Long userId, Long entityId, 
                                   EntityType entityType, AccessType accessType) {
        return switch(entityType) {
            case COHORT_DEFINITION -> cohortDefAccessRepo.hasAccess(userId, entityId, accessType);
            case CONCEPT_SET -> false; // TODO: implement when ConceptSetAccessRepository exists
        };
    }

    /**
     * Get the owner (created_by_id) of an entity
     * 
     * @param entityId The entity ID
     * @param entityType The type of entity
     * @return The user ID of the owner, or null if not found
     */
    public Long getOwnerId(Long entityId, EntityType entityType) {
        return switch(entityType) {
            case COHORT_DEFINITION -> cohortDefAccessRepo.getCreatedById(entityId);
            case CONCEPT_SET -> null; // TODO: implement when ConceptSetRepository exists
        };
    }
}
