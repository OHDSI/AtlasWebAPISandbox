package org.ohdsi.sandbox.external_config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class ConfigController {

    @Value("${app.name:Unknown App}")
    private String appName;

    @Value("${app.environment:unknown}")
    private String environment;

    @Value("${app.customMessage:No message configured.}")
    private String customMessage;

    @GetMapping("/echo")
    public Map<String, String> echoConfig() {
        return Map.of(
            "appName", appName,
            "environment", environment,
            "customMessage", customMessage
        );
    }
}
