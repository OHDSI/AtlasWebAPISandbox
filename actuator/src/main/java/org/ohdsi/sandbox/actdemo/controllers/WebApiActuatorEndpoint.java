package org.ohdsi.sandbox.actdemo.controllers;

import org.springframework.boot.actuate.endpoint.annotation.Endpoint;
import org.springframework.boot.actuate.endpoint.annotation.ReadOperation;
import org.springframework.stereotype.Component;

import java.util.HashMap;

@Component
@Endpoint(id="webapi")
public class WebApiActuatorEndpoint {
	@ReadOperation
	public HashMap<String,String> getWebApiInfo() {
		// Actuator info for WebAPI consists of key-value pairs.  This demo doesn't
		// show anything useful other than how to create a custom endpoint.  In a real
		// WebAPI instance, we could return information similar to that provided by the
		// "/info" endpoint, or pretty much anything else that we wanted for a customized
		// WebAPI actuator endpoint.
		var info = new HashMap<String,String>();
		info.put("version", "1.0.0");
		info.put("description", "This is the WebAPI actuator endpoint");
		return info;
	}
}
