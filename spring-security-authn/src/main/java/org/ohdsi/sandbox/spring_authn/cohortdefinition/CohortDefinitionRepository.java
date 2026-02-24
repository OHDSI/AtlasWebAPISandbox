/*
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.ohdsi.sandbox.spring_authn.cohortdefinition;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

/**
 *
 * @author cknoll1
 */
public interface CohortDefinitionRepository extends CrudRepository<CohortDefinitionEntity, Integer> {
  Page<CohortDefinitionEntity> findAll(Pageable pageable);

  // Bug in hibernate, findById should use @EntityGraph, but details are not being
  // fetched. Workaround: mark details Fetch.EAGER,
  // but means findAll() will eager load definitions (what the @EntityGraph was
  // supposed to solve)
  @EntityGraph(value = "CohortDefinition.withDetail", type = EntityGraph.EntityGraphType.LOAD)
  @Query("select cd from CohortDefinition cd LEFT JOIN FETCH cd.createdBy LEFT JOIN FETCH cd.modifiedBy where cd.id = ?1")
  CohortDefinitionEntity findOneWithDetail(Integer id);

  @Query("select cd from CohortDefinition AS cd LEFT JOIN FETCH cd.createdBy LEFT JOIN FETCH cd.modifiedBy")
  List<CohortDefinitionEntity> list();

  @Query("select count(cd) from CohortDefinition AS cd WHERE cd.name = :name and cd.id <> :id")
  int getCountCDefWithSameName(@Param("id") Integer id, @Param("name") String name);

  @Query("SELECT cd FROM CohortDefinition cd WHERE cd.name LIKE ?1 ESCAPE '\\'")
  List<CohortDefinitionEntity> findAllByNameStartsWith(String pattern);

  Optional<CohortDefinitionEntity> findByName(String name);

  /**
   * Returns a projection of cohort definitions including per-user authorization
   * hints (canRead/canWrite).
   * The query uses subselects against CohortDefinitionAccessEntity to provide
   * coarse-grained hints and
   * also treats the creator (cd.createdBy.id) as owner (implicit read/write).
   */
  @Query("""
      SELECT
        cd         AS cohortDefinition,
        CASE
          WHEN (
            (cd.createdBy.id = :userId)
            OR (
              (SELECT COUNT(ca)
                FROM CohortDefinitionAccessEntity ca
                JOIN UserRoleEntity ur ON ur.role.id = ca.roleId                  
                WHERE ur.user.id = :userId
                  AND ca.cohortDefinitionId = cd.id
                  AND ca.accessType IN (org.ohdsi.sandbox.spring_authn.security.authz.AccessType.READ, org.ohdsi.sandbox.spring_authn.security.authz.AccessType.WRITE)
              ) > 0
            )
          ) THEN true
          ELSE false
        END AS canRead,
        CASE
          WHEN (
            (cd.createdBy.id = :userId)
            OR (
              (SELECT COUNT(ca2)
                FROM CohortDefinitionAccessEntity ca2
                JOIN UserRoleEntity ur2 ON ur2.role.id = ca2.roleId  
                WHERE ur2.user.id = :userId
                  AND ca2.cohortDefinitionId = cd.id
                  AND ca2.accessType = org.ohdsi.sandbox.spring_authn.security.authz.AccessType.WRITE
              ) > 0
            )
          ) THEN true
          ELSE false
        END AS canWrite
      FROM CohortDefinition cd
      LEFT JOIN FETCH cd.createdBy LEFT JOIN FETCH cd.modifiedBy
      """)
  List<CohortDefinitionWithAccess> findAllWithAccessHints(@Param("userId") Long userId);

}
