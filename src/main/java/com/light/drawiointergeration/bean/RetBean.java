package com.light.drawiointergeration.bean;

import lombok.Data;

@Data
public class RetBean {
    public static RetBean success = new RetBean();
    private String code = "200";
    private String msg;
    private Object data;

    public static RetBean success(Object data) {
        RetBean retBean = new RetBean();
        retBean.setData(data);
        return retBean;
    }

    public static RetBean failure(String msg) {
        RetBean retBean = new RetBean();
        retBean.setCode("500");
        retBean.setMsg(msg);
        return retBean;
    }
}
