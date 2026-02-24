package org.ohdsi.sandbox.spring_authn.cohortdefinition;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.ohdsi.sandbox.spring_authn.security.authz.AuthorizationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Demo controller for cohort definition operations with entity-level
 * authorization.
 * 
 * This controller demonstrates the authorization model without actual CRUD
 * operations.
 * Authorization checks are performed via @PreAuthorize expressions that invoke
 * custom SpEL methods (isOwner, hasEntityAccess, isPermitted).
 */
@RestController
@RequestMapping("/api/cohorts")
public class CohortController {

  private static final Logger log = LoggerFactory.getLogger(CohortController.class);
  private final AuthorizationService authorizationService;
  private final CohortDefinitionRepository cohortRepository;

  public CohortController(AuthorizationService authorizationService,
      CohortDefinitionRepository cohortRepository) {
    this.authorizationService = authorizationService;
    this.cohortRepository = cohortRepository;
  }

  /**
   * Public list - anyone can see cohort names
   * No authorization required
   */
  @GetMapping
  public List<CohortDefinitionListProjection> listCohorts() {
    List<CohortDefinitionWithAccess> cohorts = cohortRepository.findAllWithAccessHints(authorizationService.getCurrentPrincipal().getUserId());
    return cohorts.stream()
        .map(c -> {
          var def = c.getCohortDefinition();
          return new CohortDefinitionListProjection(
              def.getId(),
              def.getName(),
              c.getCanRead(),
              c.getCanWrite());
        })
        .collect(Collectors.toList());
  }

  /**
   * Read full definition - owner, global read permission, or granted READ access
   * Authorization: isOwner OR isPermitted('read:cohort') OR hasEntityAccess(READ)
   */
  @PreAuthorize("isOwner(#id, COHORT_DEFINITION) or isPermitted('read:cohort') or isPermitted('write:cohort') or hasEntityAccess(#id, COHORT_DEFINITION, anyOf(READ, WRITE))")
  @GetMapping("/{id}")
  public Map<String, Object> getCohort(@PathVariable Long id) {
    String username = authorizationService.getCurrentLogin();
    log.info("getCohort({}) authorized for user: {}", id, username);
    return Map.of(
        "message", "Authorization succeeded for READ operation",
        "cohortId", id,
        "user", username);
  }

  /**
   * Update cohort - owner, global write permission, or granted WRITE access
   * Authorization: isOwner OR isPermitted('write:cohort') OR
   * hasEntityAccess(WRITE)
   * Note: WRITE access implies READ (can't update without seeing current state)
   */
  @PreAuthorize("isOwner(#id, COHORT_DEFINITION) or " +
      "isPermitted('write:cohort') or " +
      "hasEntityAccess(#id, COHORT_DEFINITION, WRITE)")
  @PutMapping("/{id}")
  public Map<String, Object> updateCohort(@PathVariable Long id,
      @RequestBody Map<String, Object> cohort) {
    String username = authorizationService.getCurrentLogin();
    log.info("updateCohort({}) authorized for user: {}", id, username);
    return Map.of(
        "message", "Authorization succeeded for UPDATE operation",
        "cohortId", id,
        "user", username);
  }

  /**
   * Delete cohort - owner, global write permission, or granted WRITE access
   * Authorization: isOwner OR isPermitted('write:cohort') OR
   * hasEntityAccess(WRITE)
   * Design decision: WRITE permission includes delete capability
   */
  @PreAuthorize("isOwner(#id, COHORT_DEFINITION) or " +
      "isPermitted('write:cohort') or " +
      "hasEntityAccess(#id, COHORT_DEFINITION, WRITE)")
  @DeleteMapping("/{id}")
  public Map<String, Object> deleteCohort(@PathVariable Long id) {
    String username = authorizationService.getCurrentLogin();
    log.info("deleteCohort({}) authorized for user: {}", id, username);
    return Map.of(
        "message", "Authorization succeeded for DELETE operation",
        "cohortId", id,
        "user", username);
  }

  /**
   * Create cohort - any authenticated user with write permission
   * Authorization: isAuthenticated AND isPermitted('write:cohort')
   * Note: In real implementation, created_by_id would be set to current user
   */
  @PreAuthorize("isAuthenticated() and isPermitted('write:cohort')")
  @PostMapping
  public Map<String, Object> createCohort(@RequestBody Map<String, Object> cohort) {
    String username = authorizationService.getCurrentLogin();
    log.info("createCohort() authorized for user: {}", username);
    return Map.of(
        "message", "Authorization succeeded for CREATE operation",
        "user", username,
        "note", "In production, created_by_id would be set to current user ID");
  }
}
