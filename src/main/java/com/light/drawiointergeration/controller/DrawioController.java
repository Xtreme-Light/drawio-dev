package com.light.drawiointergeration.controller;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@Slf4j
public class DrawioController {

    private static final Map<String,DrawioFile> data = new HashMap<>();

    @PostMapping("/drawio/saveFile")
    public void saveFile(@RequestBody DrawioFile drawioFile) {
        log.info("接收到请求 {}",drawioFile);
        data.put(drawioFile.getFileId(), drawioFile);
    }

    @GetMapping("/drawio/getFile")
    public DrawioFile getFile(@RequestParam("fileId") Long fileId) {
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
    }
}
