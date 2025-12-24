package com.invoiceapp.backend.service.ecb;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

import java.util.List;

// A container for all DTOs related to ECB XML parsing.
public class EcbDtos {

    private static final String ECB_NS = "http://www.ecb.int/vocabulary/2002-08-01/eurofxref";
    private static final String GESMES_NS = "http://www.gesmes.org/xml/2002-08-01";

    @JacksonXmlRootElement(localName = "Envelope", namespace = GESMES_NS)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Envelope {
        @JacksonXmlProperty(localName = "Cube", namespace = ECB_NS)
        public Cube_Outer Cube;
    }

    public static class Cube_Outer {
        @JacksonXmlProperty(localName = "Cube", namespace = ECB_NS)
        public Cube_Date Cube;
    }

    public static class Cube_Date {
        @JacksonXmlProperty(isAttribute = true)
        public String time;

        @JacksonXmlElementWrapper(useWrapping = false)
        @JacksonXmlProperty(localName = "Cube", namespace = ECB_NS)
        public List<Cube_Rate> rates;
    }

    public static class Cube_Rate {
        @JacksonXmlProperty(isAttribute = true)
        public String currency;

        @JacksonXmlProperty(isAttribute = true)
        public String rate;
    }
}
