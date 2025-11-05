package org.ohdsi.sandbox.spotless_demo;

import java.lang.RuntimeException;
import java.util.*;

public class MalformattedExample {

    public void printNames() {
        List<String> names = List.of("Tony Stark", "Carol Danvers", "Steve Rodgers");
            System.out.println("Names: " + names);
    }
}
