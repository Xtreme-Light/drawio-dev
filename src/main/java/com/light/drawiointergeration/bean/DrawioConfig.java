package com.light.drawiointergeration.bean;


import jakarta.xml.bind.annotation.XmlAccessType;
import jakarta.xml.bind.annotation.XmlAccessorType;
import jakarta.xml.bind.annotation.XmlRootElement;
import lombok.Data;

import java.util.List;

@Data
public class DrawioConfig {
    /**
     * 使用分号;分割多个library
     * 默认的library有哪些
     */
    private String defaultLibraries;
    /**
     * Defines an array of strings of library keys which will be available in the More Shapes dialog.
     * If you define this as null, all libraries will be visible. If you leave the array empty, no libraries will be visible (e.g. ["general", "uml"])
     * 允许使用的library有哪些
     * null 展示全部
     * [] 不展示
     * ["general", "uml"] 展示 general 和 uml
     */
    private List<String> enabledLibraries;

    private List<Library> libraries;
    /**
     * 是否可以追加自定义library
     */
    private Boolean appendCustomLibraries = true;

    /**
     * 是否可以使用自定义library
     */
    private Boolean enableCustomLibraries = true;

    @XmlRootElement
    @XmlAccessorType(XmlAccessType.FIELD)
    public static final class GraphicDataXml {


    }

    /**
     * 添加自定义的library
     */
    @Data
    public static final class Library {
        private Title title;
        // library 的id
        private List<Entry> entries;

        /**
         * 标题
         */
        @Data
        public static final class Title {
            private String main;
            private String zh;
        }

        @Data
        public static final class Entry {
            /**
             * 唯一ID
             */
            private String id;
            private Title title;
            private Desc desc;
            private List<Lib> libs;

            @Data
            public static final class Desc {
                /**
                 * 用来在库被选中时，展示的详细文案
                 */
                private String main;
                /**
                 * 用来在库被选中时，展示的详细文案
                 * main is the fallback if no string is defined for the current country code (i.e. the default resource)
                 */
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
