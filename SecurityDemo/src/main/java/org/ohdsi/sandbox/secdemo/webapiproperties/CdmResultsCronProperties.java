package org.ohdsi.sandbox.secdemo.webapiproperties;

public class CdmResultsCronProperties {
    String expression;

    Boolean warmAllCaches;

    public String getExpression() {return expression;}
    public String expression() {return expression;}
    public void setExpression(String expression) {this.expression = expression;}

    public Boolean getWarmAllCaches() {return warmAllCaches;}
    public Boolean warmAllCaches() {return warmAllCaches;}
    public void setWarmAllCaches(Boolean warmAllCaches) {this.warmAllCaches = warmAllCaches;}
}
