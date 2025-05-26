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
    RemoteClient.prototype.baseUrl = "drawio";

    RemoteClient.prototype.baseHostUrl = "http://127.0.0.1";

    /**
     * 定义保存文件的URL
     */
    RemoteClient.prototype.saveUrl = RemoteClient.prototype.baseUrl + '/saveFile';
    /**
     * 加载远端文件
     */
    RemoteClient.prototype.loadUrl = RemoteClient.prototype.baseUrl + '/getFile';

    /**
     * 文件保存
     *
     * @param {number} dx X-coordinate of the translation.
     * @param {number} dy Y-coordinate of the translation.
     */
    RemoteClient.prototype.saveFile = function (file, success, error, overwrite, message) {
        var fileId = file.id;
        var fileTitle = file.title;

        var fn = mxUtils.bind(this, function (data) {
            this.writeFile(fileId, fileTitle, true, data,
                mxUtils.bind(this, function (req) {
                    // console.log(JSON.parse(req.getText()));
                    success();
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
                fn(Base64.encode(file.getData()));
            }
        });

        if (overwrite) {
            var req = new mxXmlRequest(this.saveUrl, JSON.stringify({
                data: data,
                fileId: fileId,
                fileTitle: fileTitle,
                fileType: 'png',
                commitMsg: message
            }), 'POST');
            this.executeRequest(req, success, error);
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
     * 文件保存到远端核心方法
     * @param filename 需要保存的文件名称
     * @param data 需要保存的数据
     * @param success 保存成功回调
     * @param error 保存失败回调
     * @param asLibrary
     * @param folderId
     * @param base64Encoded
     */
    RemoteClient.prototype.insertFile = function (title, data, success, error, asLibrary = false, folderId, base64Encoded = true, id, commitMsg) {
        var fileId = id ? id : 'id-' + new Date().getTime().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
        if (!asLibrary) {
            // 不进行包装的时候直接进行数据传输
            // 开始构建请求


            // 生成文件唯一ID
            const requestBody = {
                filename: title,
                fileId: fileId,
                data: data,
                commitMsg: commitMsg
            }
            const req = new mxXmlRequest(this.saveUrl, JSON.stringify(requestBody), 'POST');

            this.executeRequest(req, mxUtils.bind(this, function () {
                if (req.getStatus() === 200) {
                    success(new RemoteFile(this.ui, data, title, fileId));
                } else {
                    error({message: '请求远端接口失败'});
                }
            }), error);
        } else {
            if (!base64Encoded) {
                data = Base64.encode(data);
            }
            this.writeFile(fileId, title, base64Encoded, data, mxUtils.bind(this, function (req) {
                try {
                    const msg = JSON.parse(req.getText());
                    success(this.createRemoteFile(fileId, title, msg.content, asLibrary));
                } catch (e) {
                    error(e);
                }
            }), error);
        }

    };
    /**
     * Translates this point by the given vector.
     *
     * @param fileId 文件ID
     * @param filename 文件名称
     * @param data 返回的数据
     * @param asLibrary
     */
    RemoteClient.prototype.createRemoteFile = function (fileId, filename, data, asLibrary) {
        // TODO 需要根据导出进行调试
        const meta = {
            id: data.fileId,
            title: data.filename,
            data: data.data,
        };
        var content = data.data;
        if (data.encoding === 'base64') {
            if (/\.jpe?g$/i.test(data.name)) {
                content = 'data:image/jpeg;base64,' + content;
            } else if (/\.gif$/i.test(data.name)) {
                content = 'data:image/gif;base64,' + content;
            } else {
                if (/\.png$/i.test(data.name)) {
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

        return (asLibrary) ? new RemoteLibrary(this.ui, content, meta) : new RemoteFile(this.ui, content, filename, fileId);
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

            // TODO 设置请求头
            req.setRequestHeaders = function (request, params) {
                request.setRequestHeader('Content-Type', 'application/json');
            };
            req.mode = App.MODE_REMOTE;
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
     * 获取文件
     */
    RemoteClient.prototype.getFile = function (path, success, error, asLibrary, checkExists) {
        asLibrary = (asLibrary != null) ? asLibrary : false;
        var arr = JSON.parse(path);
        var fileId = arr[0];
        var fileName = arr[1];
        var binary = /\.png$/i.test(fileName);

        // Handles .vsdx, Gliffy and PNG+XML files by creating a temporary file
        if (!checkExists && (/\.v(dx|sdx?)$/i.test(path) || /\.gliffy$/i.test(path) ||
            /\.pdf$/i.test(path) || (!this.ui.useCanvasForExport && binary))) {
            // Should never be null
            if (_token != null) {
                var url = this.baseUrl + '/repos/' + org + '/' + repo +
                    '/contents/' + path + '?ref=' + ref;
                var headers = {'Authorization': 'token ' + _token};
                tokens = path.split('/');
                var name = (tokens.length > 0) ? tokens[tokens.length - 1] : path;
                this.ui.convertFile(url, name, null, this.extension, success, error, null, headers);
            } else {
                error({message: mxResources.get('accessDenied')});
            }
        } else {
            // Adds random parameter to bypass cache
            // var rnd = '&t=' + new Date().getTime();
            var req = new mxXmlRequest(this.loadUrl + "?fileId=" + fileId, null, 'GET');

            this.executeRequest(req, mxUtils.bind(this, function (req) {
                try {
                    // 获取成功后，加载文件
                    success(this.createRemoteFile(fileId, fileName, JSON.parse(req.getText()), false));
                } catch (e) {
                    error(e);
                }
            }), error);
        }
    };
    /**
     * 写入文件
     */
    RemoteClient.prototype.writeFile = function (fileId, fileTitle, base64Encoded, data, success, error, message) {
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
                    encoding: base64Encoded ? "base64" : "",
                    commitMsg: message
                };
            const req = new mxXmlRequest(this.saveUrl, JSON.stringify(entity), 'POST');
            // 如果是其他类型的文件格式需要做格式转换
            this.executeRequest(req, mxUtils.bind(this, function (req) {
                success(req);
            }), error);
        }
    };
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

