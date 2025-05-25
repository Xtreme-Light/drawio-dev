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
    RemoteClient.prototype.insertFile = function (filename, data, success, error, asLibrary = false, folderId, base64Encoded = true) {
        const fileId = new Date().getTime();

        if (!asLibrary) {
            // 不进行包装的时候直接进行数据传输
            // 开始构建请求
            const requestBody = {
                filename: filename,
                fileId: fileId,
                data: data,
                base64Encoded: false,
            }
            // TODO 需要考虑如何透传一个文件的唯一ID，而是fileId
            const req = new mxXmlRequest(this.saveUrl, JSON.stringify(requestBody), 'POST');

            this.executeRequest(req, mxUtils.bind(this, function () {
                if (req.getStatus() === 200) {
                    success(req);
                } else {
                    error({message: '请求远端接口失败'});
                }
            }), error);
        } else {
            if (!base64Encoded) {
                data = Base64.encode(data);
            }
            this.writeFile(fileId, filename, base64Encoded,data, mxUtils.bind(this, function (req) {
                try {
                    const msg = JSON.parse(req.getText());
                    success(this.createRemoteFile(fileId, filename,msg.content, asLibrary));
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
     * @param data 请求体的数据
     * @param asLibrary
     */
    RemoteClient.prototype.createRemoteFile = function(fileId, filename,data, asLibrary)
    {
        console.log("当前请求获取到数据为", data);
        // TODO 需要根据导出进行调试
        const meta = {
            id: fileId,
            title: filename,
            data: data,
        };
        var content = data.data;

        if (data.encoding === 'base64')
        {
            if (/\.jpe?g$/i.test(data.name))
            {
                content = 'data:image/jpeg;base64,' + content;
            }
            else if (/\.gif$/i.test(data.name))
            {
                content = 'data:image/gif;base64,' + content;
            }
            else
            {
                if (/\.png$/i.test(data.name))
                {
                    var xml = this.ui.extractGraphModelFromPng(content);

                    if (xml != null && xml.length > 0)
                    {
                        content = xml;
                    }
                    else
                    {
                        content = 'data:image/png;base64,' + content;
                    }
                }
                else
                {
                    content = Base64.decode(content);
                }
            }
        }

        return (asLibrary) ? new RemoteLibrary(this.ui, content, meta) : new RemoteFile(this.ui, content, filename,fileId);
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
     * Checks if the client is authorized and calls the next step.
     */
    RemoteClient.prototype.getFile = function (path, success, error, asLibrary, checkExists) {
        asLibrary = (asLibrary != null) ? asLibrary : false;

        var tokens = path.split('/');
        var org = tokens[0];
        var repo = tokens[1];
        var ref = tokens[2];
        path = tokens.slice(3, tokens.length).join('/');
        var binary = /\.png$/i.test(path);

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
            var rnd = '&t=' + new Date().getTime();
            var req = new mxXmlRequest(this.baseUrl + '/repos/' + org + '/' + repo +
                '/contents/' + path + '?ref=' + ref + rnd, null, 'GET');

            this.executeRequest(req, mxUtils.bind(this, function (req) {
                try {
                    var obj = JSON.parse(req.getText());

                    // Additional request needed to get file contents
                    if (obj.content == '' && obj.git_url != null) {
                        var contentReq = new mxXmlRequest(obj.git_url, null, 'GET');

                        this.executeRequest(contentReq, mxUtils.bind(this, function (contentReq) {
                            var contentObject = JSON.parse(contentReq.getText());

                            if (contentObject.content != '') {
                                obj.content = contentObject.content;
                                obj.encoding = contentObject.encoding;

                                success(this.createGitHubFile(org, repo, ref, obj, asLibrary));
                            } else {
                                error({message: mxResources.get('errorLoadingFile')});
                            }
                        }), error);
                    } else {
                        success(this.createGitHubFile(org, repo, ref, obj, asLibrary));
                    }
                } catch (e) {
                    error(e);
                }
            }), error);
        }
    };
    /**
     * 写入文件
     */
    RemoteClient.prototype.writeFile = function (fileId, fileTitle,base64Encoded, data, success, error) {
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
                    base64Encoded: base64Encoded,
                };
            const req = new mxXmlRequest(this.saveUrl, JSON.stringify(entity), 'POST');
            // 如果是其他类型的文件格式需要做格式转换
            this.executeRequest(req, mxUtils.bind(this, function (req) {
                success(req);
            }), error);
        }
    };
})();

