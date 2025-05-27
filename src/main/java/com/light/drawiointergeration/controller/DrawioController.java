package com.light.drawiointergeration.controller;

import com.light.drawiointergeration.bean.RetBean;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@Slf4j
public class DrawioController {

    private static final Map<String, DrawioFile> data = new HashMap<>();

    @PostMapping("/drawio/saveFile")
    public void saveFile(@RequestBody DrawioFile drawioFile) {
        log.info("接收到请求 {}", drawioFile);
        data.put(drawioFile.getFileId(), drawioFile);
    }

    @GetMapping("/drawio/getFile")
    public DrawioFile getFile(@RequestParam("fileId") String fileId) {
        return data.get(fileId);
    }

    @Data
    public static class DrawioFile {
        private String fileId;
        private String fileName;
        private String fileType;
        /**
         * base64 ?
         */
        private String encoding;
        private String data;
        private String commitMsg;
        /**
         * 文件类型
         */
        private String mimeType;
    }

    @GetMapping("/drawio/config")
    public RetBean getConfig() {
        RetBean retBean = new RetBean();

        retBean.setData("{\n" +
                "    \"defaultLibraries\": \"basic;flowchart;体系\",\n" +
                "    \"enabledLibraries\": [\n" +
                "        \"basic\",\n" +
                "        \"flowchart\",\n" +
                "        \"体系\"\n" +
                "    ],\n" +
                "    \"defaultCustomLibraries\": [\n" +
                "        \"体系\"\n" +
                "    ],\n" +
                "    \"appendCustomLibraries\": true,\n" +
                "    \"libraries\": [\n" +
                "        {\n" +
                "            \"title\": {\n" +
                "                \"main\": \"业务架构\"\n" +
                "            },\n" +
                "            \"entries\": [\n" +
                "                {\n" +
                "                    \"id\": \"体系\",\n" +
                "                    \"title\": {\n" +
                "                        \"main\": \"业务体系\",\n" +
                "                        \"zh\": \"业务体系\"\n" +
                "                    },\n" +
                "                    \"desc\": {\n" +
                "                        \"main\": \"业务架构下的第一层级，业务体系\",\n" +
                "                        \"zh\": \"业务架构下的第一层级，业务体系\"\n" +
                "                    },\n" +
                "                    \"libs\": [\n" +
                "                        {\n" +
                "                            \"title\": {\n" +
                "                                \"main\": \"业务体系\",\n" +
                "                                \"zh\": \"业务体系\"\n" +
                "                            },\n" +
                "                            \"data\": [\n" +
                "                                {\n" +
                "                                    \"xml\": \"<mxGraphModel><root><mxCell id=\\\"0\\\"/><mxCell id=\\\"1\\\" parent=\\\"0\\\"/><mxCell id=\\\"2\\\" archId=\\\"B20250527\\\" archType='业务'  value=\\\"新增业务\\\" style=\\\"rounded=1;whiteSpace=wrap;html=1;\\\" vertex=\\\"1\\\" parent=\\\"1\\\"><mxGeometry width=\\\"120\\\" height=\\\"60\\\" as=\\\"geometry\\\"/></mxCell></root></mxGraphModel>\",\n" +
                "                                    \"w\": 120,\n" +
                "                                    \"h\": 60,\n" +
                "                                    \"aspect\": \"fixed\",\n" +
                "                                    \"title\": \"新增业务\"\n" +
                "                                },\n" +
                "                                {\n" +
                "                                    \"xml\": \"<mxGraphModel><root><mxCell id=\\\"0\\\"/><mxCell id=\\\"1\\\" parent=\\\"0\\\"/><mxCell id=\\\"2\\\" archId=\\\"B20250527\\\" archType='能力'  value=\\\"新增能力\\\" style=\\\"rounded=1;whiteSpace=wrap;html=1;\\\" vertex=\\\"1\\\" parent=\\\"1\\\"><mxGeometry width=\\\"120\\\" height=\\\"60\\\" as=\\\"geometry\\\"/></mxCell></root></mxGraphModel>\",\n" +
                "                                    \"w\": 120,\n" +
                "                                    \"h\": 60,\n" +
                "                                    \"aspect\": \"fixed\",\n" +
                "                                    \"title\": \"新增能力\"\n" +
                "                                }\n" +
                "                            ]\n" +
                "                        }\n" +
                "                    ]\n" +
                "                }\n" +
                "            ]\n" +
                "        }\n" +
                "    ]\n" +
                "}");
        return retBean;
    }
}
