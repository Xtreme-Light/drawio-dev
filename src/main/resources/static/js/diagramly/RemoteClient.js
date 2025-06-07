/**
 * Copyright (c) 2006-2024, JGraph Ltd
 * Copyright (c) 2006-2024, draw.io AG
 */
//Add a closure to hide the class private variables without changing the code a lot
(function () {

    window.RemoteClient = function (editorUi, authName) {
        DrawioClient.call(this, editorUi, authName);
    };

// Extends DrawioClient
    mxUtils.extend(RemoteClient, DrawioClient);

    /**
     * Default extension for new files.
     */
    RemoteClient.prototype.extension = '.drawio';

    RemoteClient.prototype.maxFileSize = 50000000 /*50MB*/;
    /**
     * 后端api基础地址
     */
    RemoteClient.prototype.baseUrl = "";

    /**
     * 定义保存文件的URL
     */
    RemoteClient.prototype.saveUrl = RemoteClient.prototype.baseUrl + '/drawio/saveFile';
    /**
     * 加载远端文件
     */
    RemoteClient.prototype.loadUrl = RemoteClient.prototype.baseUrl + '/drawio/getFile';

    /**
     * 文件保存
     *
     */
    RemoteClient.prototype.saveFile = function (file, success, error, overwrite, message) {
        var fileId = file.id;
        var fileTitle = file.title;

        var fn = mxUtils.bind(this, function (data) {
            this.writeFile(fileId, fileTitle, data,
                mxUtils.bind(this, function (req) {
                    success(req);
                }), mxUtils.bind(this, function (err) {
                    error(err);
                }), message);
        });

        var fn2 = mxUtils.bind(this, function () {
            if (this.ui.useCanvasForExport && /(\.png)$/i.test(fileTitle)) {
                var p = this.ui.getPngFileProperties(this.ui.fileNode);

                this.ui.getEmbeddedPng(mxUtils.bind(this, function (data) {
                    fn(data);
                }), error, (this.ui.getCurrentFile() != file) ?
                    file.getData() : null, p.scale, p.border);
            } else {
                // 不进行base64加密
                // fn(Base64.encode(file.getData()));
                fn(file.getData());
            }
        });

        if (overwrite) {
            this.writeFile(fileId, fileTitle, data, success, error, message);
        } else {
            fn2();
        }
    };

    /**
     * 自定义错误处理，主要是获取到错误信息
     */
    RemoteClient.prototype.getErrorMessage = function (req, defaultText) {
        try {
            var temp = JSON.parse(req.getText());

            if (temp != null && temp.msg != null) {
                defaultText = temp.msg;
            }
        } catch (e) {
            // ignore
        }

        return defaultText;
    };
    /**
     * 加载文件ID
     */
    RemoteClient.prototype.loadFileId = function () {
        let fileId = localStorage.getItem(".file_id");
        if (fileId) {
            return fileId;
        }
        fileId = 'id-' + new Date().getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem(".file_id", fileId);
        return fileId;
    }
    /**
     * 第一次会通过app.js直接调用该方法
     */
    RemoteClient.prototype.insertFile = function (title, data, success, error, create = true, commitMsg, encoding) {
        if (create) {
            // 生成文件唯一ID
            success(this.createRemoteFile(this.loadFileId(), title, {
                data: data,
                fileName: title,
                encoding: encoding
            }, false))
        } else {
            this.writeFile(this.loadFileId(), title, data, success, error, commitMsg);
        }
    };
    /**
     * Translates this point by the given vector.
     *
     * @param fileId 文件ID
     * @param filename 文件名称
     * @param params 请求的参数
     * @param asLibrary
     * @param base64Encoded 是否base64加密
     */
    RemoteClient.prototype.createRemoteFile = function (fileId, filename, params) {
        var content = params.data;
        if (params.encoding == 'base64') {
            if (/\.jpe?g$/i.test(params.fileName)) {
                content = 'data:image/jpeg;base64,' + content;
            } else if (/\.gif$/i.test(params.fileName)) {
                content = 'data:image/gif;base64,' + content;
            } else {
                if (/\.png$/i.test(params.fileName)) {
                    var xml = this.ui.extractGraphModelFromPng(content);

                    if (xml != null && xml.length > 0) {
                        content = xml;
                    } else {
                        content = 'data:image/png;base64,' + content;
                    }
                } else {
                    content = Base64.decode(content);
                }
            }
        }
        return new RemoteFile(this.ui, content, filename, fileId);
    };
    /**
     * 发送请求
     */
    RemoteClient.prototype.executeRequest = function (req, success, error) {

        const doExecute = mxUtils.bind(this, function () {
            let acceptResponse = true;
            // 设置调用超时时长
            const timeoutThread = window.setTimeout(mxUtils.bind(this, function () {
                acceptResponse = false;
                error({code: App.ERROR_TIMEOUT, message: mxResources.get('timeout')});
            }), this.ui.timeout);

            req.setRequestHeaders = function (request, params) {
                request.setRequestHeader('Content-Type', 'application/json');
            };
            req.send(mxUtils.bind(this, function () {
                window.clearTimeout(timeoutThread);

                if (acceptResponse) {
                    if ((req.getStatus() >= 200 && req.getStatus() <= 299)) {
                        success(req);
                    } else {
                        error({
                            status: req.getStatus(), message: this.getErrorMessage(req,
                                mxResources.get('error') + ' ' + req.getStatus() + ' ' + req.responseText)
                        });
                    }
                }
            }), mxUtils.bind(this, function (err) {
                window.clearTimeout(timeoutThread);
                if (acceptResponse) {
                    error(err);
                }
            }));
        });

        doExecute();

    };

    /**
     * 加载文件逻辑，根据地址栏参数（主要是fileId）加载远端文件数据
     */
    RemoteClient.prototype.getFile = function (urlParam, success, error) {
        var arr = JSON.parse(urlParam);
        var fileId = arr[0];
        if (fileId) {
            // 加载文件重置fileId
            localStorage.setItem(".file_id", fileId);
        }
        var fileName = arr[1];
        var req = new mxXmlRequest(this.loadUrl + "?fileId=" + fileId, null, 'GET');
        this.executeRequest(req, mxUtils.bind(this, function (req) {
            try {
                // 获取成功后，加载文件
                if (req.getText()) {
                    success(this.createRemoteFile(fileId, fileName, JSON.parse(req.getText()), false));
                } else {
                    error({message: '根据{' + fileId + '}加载数据为空'});
                }
            } catch (e) {
                error(e);
            }
        }), error);
    };
    /**
     * 核心的调用远端请求方法，限定所有保存逻辑都走writeFile逻辑
     */
    RemoteClient.prototype.writeFile = function (fileId, fileTitle, data, success, error, commitMsg, encoding) {
        if (data.length >= this.maxFileSize) {
            error({
                message: mxResources.get('drawingTooLarge') + ' (' +
                    this.ui.formatFileSize(data.length) + ' / 1 MB)'
            });
        } else {
            const entity =
                {
                    fileId: fileId,
                    fileName: fileTitle,
                    data: data,
                    commitMsg: commitMsg,
                    encoding: encoding,
                    shareUrl:(window.location.href.indexOf('#')>0)?window.location.href:null
                };
            const req = new mxXmlRequest(this.saveUrl, JSON.stringify(entity), 'POST');
            // 如果是其他类型的文件格式需要做格式转换
            this.executeRequest(req, mxUtils.bind(this, function (req) {
                try {
                    success(this.createRemoteFile(fileId, fileTitle, JSON.parse(req.params), false));
                } catch (e) {
                    error(e);
                }
            }), error);
        }
    };

    /**
     * 提交弹窗
     * @param filename 文件名称
     * @param isNew true 新增 false 修改
     * @param success 成功回调
     * @param cancel 取消
     */
    RemoteClient.prototype.showCommitDialog = function (filename, isNew, success, cancel) {
        // Pauses spinner while commit message dialog is shown
        var resume = this.ui.spinner.pause();
        var dlg = new FilenameDialog(this.ui, mxResources.get((isNew) ? 'addedFile' : 'updateFile',
            [filename]), mxResources.get('ok'), mxUtils.bind(this, function (message) {
            resume(function () {
                success(message);
            });
        }), mxResources.get('commitMessage'), null, null, null, null, mxUtils.bind(this, function () {
            cancel();
        }));

        this.ui.showDialog(dlg.container, 400, 80, true, false);
        dlg.init();
    };
})();

