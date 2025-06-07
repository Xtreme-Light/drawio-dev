package com.light.drawiointergeration.controller;

import com.light.drawiointergeration.bean.DrawioConfig;
import com.light.drawiointergeration.bean.RetBean;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@Slf4j
public class DrawioController {

    private static final Map<String, DrawioFile> data = new HashMap<>();

    @PostMapping("/saveFile")
    public void saveFile(@RequestBody DrawioFile drawioFile) {
        log.info("接收到保存文件请求 {}", drawioFile);
        data.put(drawioFile.getFileId(), drawioFile);
    }

    @GetMapping("/getFile")
    public DrawioFile getFile(@RequestParam("fileId") String fileId) {
        log.info("接收到加载文件请求 {}", fileId);
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

    @GetMapping("/config")
    public RetBean getConfig() {
        log.info("接收到加载配置请求");

        RetBean retBean = new RetBean();
        DrawioConfig drawioConfig = new DrawioConfig();
        drawioConfig.setDefaultLibraries(null);
        drawioConfig.setEnabledLibraries(null);
        retBean.setData(drawioConfig);
        return retBean;
    }
}
