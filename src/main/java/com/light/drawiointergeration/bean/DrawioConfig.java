package com.light.drawiointergeration.bean;

import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Data;

import java.util.List;

@Data
public class DrawioConfig {
    // 使用分号;分割多个library
    private String defaultLibraries;
    private List<String> enabledLibraries;

    private List<Library> libraries;

    @XmlRootElement
    @XmlAccessorType(XmlAccessType.FIELD)
    public static final class GraphicDataXml {


    }
    @Data
    public static final class Library {
        private Title title;
        // library 的id
        private List<Entry> entries;

        @Data
        public static final class Title {
            private String main;
            private String zh;
        }

        @Data
        public static final class Entry {
            private String id;
            private Title title;
            private Desc desc;
            private List<Lib> libs;

            @Data
            public static final class Desc {
                private String main;
                private String zh;
            }

            @Data
            public static final class Lib {
                private Title title;
                private List<GraphicData> data;

                @Data
                public static final class GraphicData {
                    /**
                     * @see GraphicDataXml
                     */
                    private String xml;
                    private double w;
                    private double h;
                    private String aspect;
                }
            }
        }
    }
}
