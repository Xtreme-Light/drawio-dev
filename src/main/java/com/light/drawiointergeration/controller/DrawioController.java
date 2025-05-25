package com.light.drawiointergeration.controller;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Slf4j
public class DrawioController {


    @PostMapping("/drawio/saveFile")
    public void saveFile(@RequestBody DrawioFile drawioFile) {
        log.info("接收到请求 {}",drawioFile);
    }
    @Data
    public static class DrawioFile {
        private Long fileId;
        private String fileName;
        private String fileType;
        private boolean base64Encoded;
        private String data;
    }
}
