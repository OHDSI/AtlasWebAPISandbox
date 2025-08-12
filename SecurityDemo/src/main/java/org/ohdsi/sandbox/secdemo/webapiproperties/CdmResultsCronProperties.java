package org.ohdsi.sandbox.secdemo.webapiproperties;

import jakarta.validation.constraints.NotBlank;

public class CdmResultsCronProperties {
    @NotBlank(message="webapi.cdm-results.cron.expression must have a value")
    String expression;

    @NotBlank(message="webapi.cdm-results.cron.warmAllCaches must have a value")
    Boolean warmAllCaches;

    public String getExpression() {return expression;}
    public String expression() {return expression;}
    public void setExpression(String expression) {this.expression = expression;}

    public Boolean getWarmAllCaches() {return warmAllCaches;}
    public Boolean warmAllCaches() {return warmAllCaches;}
    public void setWarmAllCaches(Boolean warmAllCaches) {this.warmAllCaches = warmAllCaches;}
}
