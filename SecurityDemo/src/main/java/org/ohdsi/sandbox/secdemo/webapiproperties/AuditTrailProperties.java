package org.ohdsi.sandbox.secdemo.webapiproperties;

public class AuditTrailProperties {
    private Boolean enabled;

    private String logFile;

    private String extraLogFile;

    public Boolean getEnabled() {
        return enabled;
    }
    public Boolean enabled() {
        return enabled;
    }
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public String getLogFile() {
        return logFile;
    }
    public String logFile() {
        return logFile;
    }
    public void setLogFile(String logFile) {
        this.logFile = logFile;
    }

    public String getExtraLogFile() {
        return extraLogFile;
    }
    public String extraLogFile() {
        return extraLogFile;
    }
    public void setExtraLogFile(String extraLogFile) {
        this.extraLogFile = extraLogFile;
    }
}
