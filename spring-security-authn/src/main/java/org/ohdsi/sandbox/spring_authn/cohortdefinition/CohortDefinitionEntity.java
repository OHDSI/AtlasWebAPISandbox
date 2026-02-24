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

import java.io.Serializable;
import java.util.Date;
import java.util.Objects;
import jakarta.persistence.Access;
import jakarta.persistence.AccessType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedAttributeNode;
import jakarta.persistence.NamedEntityGraph;
import jakarta.persistence.NamedSubgraph;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.GenerationType;
import org.ohdsi.sandbox.spring_authn.security.authz.UserEntity;

/**
 * JPA Entity for Cohort Definitions
 * 
 * @author cknoll1
 */
@Entity(name = "CohortDefinition")
@Table(name = "cohort_definition")
@NamedEntityGraph(name = "CohortDefinition.withDetail", attributeNodes = {
    @NamedAttributeNode(value = "details", subgraph = "detailsGraph") }, subgraphs = {
        @NamedSubgraph(name = "detailsGraph", type = CohortDefinitionDetails.class, attributeNodes = {
            @NamedAttributeNode(value = "expression") }) })
public class CohortDefinitionEntity implements Serializable {

  private static final long serialVersionUID = 1L;

  @Id
  @SequenceGenerator(name = "cohort_definition_seq", sequenceName = "cohort_definition_sequence", allocationSize = 1)
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "cohort_definition_seq")
  @Access(AccessType.PROPERTY)
  private Integer id;

  private String name;

  private String description;

  @Enumerated(EnumType.STRING)
  @Column(name = "expression_type")
  private ExpressionType expressionType;

  @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = false, orphanRemoval = true, mappedBy = "definition")
  @JoinColumn(name = "id")
  private CohortDefinitionDetails details;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "created_by_id", updatable = false)
  private UserEntity createdBy;
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "modified_by_id")
  private UserEntity modifiedBy;
  @Column(name = "created_date", updatable = false)
  private Date createdDate;
  @Column(name = "modified_date")
  private Date modifiedDate;

  public Integer getId() {
    return id;
  }

  public void setId(Integer id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public CohortDefinitionEntity setName(String name) {
    this.name = name;
    return this;
  }

  public String getDescription() {
    return description;
  }

  public CohortDefinitionEntity setDescription(String description) {
    this.description = description;
    return this;
  }

  public ExpressionType getExpressionType() {
    return expressionType;
  }

  public CohortDefinitionEntity setExpressionType(ExpressionType expressionType) {
    this.expressionType = expressionType;
    return this;
  }

  public UserEntity getCreatedBy() {

    return createdBy;
  }

  public void setCreatedBy(UserEntity createdBy) {

    this.createdBy = createdBy;
  }

  public UserEntity getModifiedBy() {

    return modifiedBy;
  }

  public void setModifiedBy(UserEntity modifiedBy) {

    this.modifiedBy = modifiedBy;
  }

  public Date getCreatedDate() {

    return createdDate;
  }

  public void setCreatedDate(Date createdDate) {

    this.createdDate = createdDate;
  }

  public Date getModifiedDate() {

    return modifiedDate;
  }

  public void setModifiedDate(Date modifiedDate) {

    this.modifiedDate = modifiedDate;
  }

  public CohortDefinitionDetails getDetails() {
    return this.details;
  }

  public CohortDefinitionEntity setDetails(CohortDefinitionDetails details) {
    this.details = details;
    return this;
  }

  @Override
  public boolean equals(final Object o) {

    if (this == o)
      return true;
    if (!(o instanceof CohortDefinitionEntity))
      return false;
    final CohortDefinitionEntity that = (CohortDefinitionEntity) o;
    return Objects.equals(getId(), that.getId());
  }

  @Override
  public int hashCode() {

    return Objects.hash(getId());
  }

}
