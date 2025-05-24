/**
 * Copyright (c) 2006-2024, JGraph Ltd
 * Copyright (c) 2006-2024, draw.io AG
 */
//Add a closure to hide the class private variables without changing the code a lot
(function ()
{

    var _token = null;

    window.RemoteClient = function(editorUi, authName)
    {
        DrawioClient.call(this, editorUi, authName || 'ghauth');
    };

// Extends DrawioClient
    mxUtils.extend(RemoteClient, DrawioClient);

    /**
     * Specifies if thumbnails should be enabled. Default is true.
     * LATER: If thumbnails are disabled, make sure to replace the
     * existing thumbnail with the placeholder only once.
     */
    // RemoteClient.prototype.clientId = (window.location.hostname == 'test.draw.io') ? 'Iv1.1218f5567fbc258a' : window.DRAWIO_GITHUB_ID;

    /**
     * Default extension for new files.
     */
    RemoteClient.prototype.extension = '.drawio';

    /**
     * Base URL for API calls.
     */
    RemoteClient.prototype.baseUrl = "api调用后端地址";

    RemoteClient.prototype.baseHostUrl = "后端主地址";

    RemoteClient.prototype.redirectUri = window.DRAWIO_SERVER_URL + 'github2';

    /**
     * Maximum file size of the GitHub REST API.
     */
    RemoteClient.prototype.maxFileSize = 50000000 /*50MB*/;

    /**
     * Name for the auth token header.
     */
    RemoteClient.prototype.authToken = 'token';

    RemoteClient.prototype.setToken = function(token)
    {
        _token = token;
    };


    /**
     * Authorizes the client, gets the userId and calls <open>.
     */
    RemoteClient.prototype.getErrorMessage = function(req, defaultText)
    {
        try
        {
            var temp = JSON.parse(req.getText());

            if (temp != null && temp.message != null)
            {
                defaultText = temp.message;
            }
        }
        catch (e)
        {
            // ignore
        }

        return defaultText;
    };



    /**
     * Authorizes the client, gets the userId and calls <open>.
     */
    RemoteClient.prototype.executeRequest = function(req, success, error, ignoreNotFound, returnNotFound)
    {
        var doExecute = mxUtils.bind(this, function(failOnAuth)
        {
            var acceptResponse = true;

            var timeoutThread = window.setTimeout(mxUtils.bind(this, function()
            {
                acceptResponse = false;
                error({code: App.ERROR_TIMEOUT, retry: fn});
            }), this.ui.timeout);

            var temp = this.authToken + ' ' + _token;

            req.setRequestHeaders = function(request, params)
            {
                request.setRequestHeader('Authorization', temp);
            };

            req.send(mxUtils.bind(this, function()
            {
                window.clearTimeout(timeoutThread);

                var authorizeApp = mxUtils.bind(this, function()
                {
                    // Pauses spinner while showing dialog
                    var resume = this.ui.spinner.pause();

                    this.showAuthorizeDialog(mxUtils.bind(this, function()
                    {
                        resume();
                        fn();
                    }), mxUtils.bind(this, function()
                    {
                        this.ui.hideDialog();
                        error({name: 'AbortError'});
                    }));
                });

                if (acceptResponse)
                {
                    if ((req.getStatus() >= 200 && req.getStatus() <= 299) ||
                        (ignoreNotFound && req.getStatus() == 404))
                    {
                        success(req);
                    }
                    else if (req.getStatus() === 401)
                    {
                        if (!failOnAuth)
                        {
                            this.authenticate(function()
                            {
                                doExecute(true);
                            }, error);
                        }
                        else
                        {
                            error({code: req.getStatus(), message: mxResources.get('accessDenied'), retry: mxUtils.bind(this, function()
                                {
                                    this.authenticate(function()
                                    {
                                        fn(true);
                                    }, error);
                                })});
                        }
                    }
                    else if (req.getStatus() === 403)
                    {
                        var tooLarge = false;

                        try
                        {
                            var temp = JSON.parse(req.getText());

                            if (temp != null && temp.message == 'Resource not accessible by integration')
                            {
                                authorizeApp();
                            }
                            else
                            {
                                if (temp != null && temp.errors != null && temp.errors.length > 0)
                                {
                                    tooLarge = temp.errors[0].code == 'too_large';
                                }

                                error({message: mxResources.get((tooLarge) ? 'drawingTooLarge' : 'forbidden')});
                            }
                        }
                        catch (e)
                        {
                            error({message: mxResources.get((tooLarge) ? 'drawingTooLarge' : 'forbidden')});
                        }
                    }
                    else if (req.getStatus() === 404)
                    {
                        if (returnNotFound)
                        {
                            error({code: req.getStatus(), message: this.getErrorMessage(req, mxResources.get('fileNotFound'))});
                        }
                        else
                        {
                            authorizeApp();
                        }
                    }
                    else if (req.getStatus() === 409)
                    {
                        // Special case: flag to the caller that there was a conflict
                        error({code: req.getStatus(), status: 409});
                    }
                    else
                    {
                        error({code: req.getStatus(), message: this.getErrorMessage(req, mxResources.get('error') + ' ' + req.getStatus())});
                    }
                }
            }), mxUtils.bind(this, function(err)
            {
                window.clearTimeout(timeoutThread);

                if (acceptResponse)
                {
                    error(err);
                }
            }));
        });

        var fn = mxUtils.bind(this, function(failOnAuth)
        {
            if (this.user == null)
            {
                this.updateUser(function()
                {
                    fn(true);
                }, error, failOnAuth);
            }
            else
            {
                doExecute(failOnAuth);
            }
        });

        if (_token == null)
        {
            this.authenticate(function()
            {
                fn(true);
            }, error);
        }
        else
        {
            fn(false);
        }
    };

    /**
     * Checks if the client is authorized and calls the next step.
     */
    RemoteClient.prototype.getLibrary = function(path, success, error)
    {
        this.getFile(path, success, error, true);
    };


    /**
     * Translates this point by the given vector.
     *
     * @param {number} dx X-coordinate of the translation.
     * @param {number} dy Y-coordinate of the translation.
     */
    RemoteClient.prototype.insertFile = function(filename, data, success, error, asLibrary, folderId, base64Encoded)
    {
        asLibrary = (asLibrary != null) ? asLibrary : false;

        var tokens = folderId.split('/');
        var org = tokens[0];
        var repo = tokens[1];
        var ref = tokens[2];
        var path = tokens.slice(3, tokens.length).join('/');

        if (path.length > 0)
        {
            path = path + '/';
        }

        path = path + filename;

        this.checkExists(org + '/' + repo + '/' + ref + '/' + path, true, mxUtils.bind(this, function(checked, sha)
        {
            if (checked)
            {
                // Does not insert file here as there is another writeFile implicit via fileCreated
                if (!asLibrary)
                {
                    success(new GitHubFile(this.ui, data, {'org': org, 'repo': repo, 'ref': ref,
                        'name': filename, 'path': path, 'sha': sha, isNew: true}));
                }
                else
                {
                    if (!base64Encoded)
                    {
                        data = Base64.encode(data);
                    }

                    this.showCommitDialog(filename, true, mxUtils.bind(this, function(message)
                    {
                        this.writeFile(org, repo, ref, path, message, data, sha, mxUtils.bind(this, function(req)
                        {
                            try
                            {
                                var msg = JSON.parse(req.getText());
                                success(this.createGitHubFile(org, repo, ref, msg.content, asLibrary));
                            }
                            catch (e)
                            {
                                error(e);
                            }
                        }), error);
                    }), error);
                }
            }
            else
            {
                error();
            }
        }))
    };




    /**
     * Translates this point by the given vector.
     *
     * @param {number} dx X-coordinate of the translation.
     * @param {number} dy Y-coordinate of the translation.
     */
    RemoteClient.prototype.saveFile = function(file, success, error, overwrite, message)
    {
        var org = file.meta.org;
        var repo = file.meta.repo;
        var ref = file.meta.ref;
        var path = file.meta.path;

        var fn = mxUtils.bind(this, function(sha, data)
        {
            this.writeFile(org, repo, ref, path, message, data, sha,
                mxUtils.bind(this, function(req)
                {
                    delete file.meta.isNew;
                    success(JSON.parse(req.getText()).content.sha);
                }), mxUtils.bind(this, function(err)
                {
                    error(err);
                }));
        });

        var fn2 = mxUtils.bind(this, function()
        {
            if (this.ui.useCanvasForExport && /(\.png)$/i.test(path))
            {
                var p = this.ui.getPngFileProperties(this.ui.fileNode);

                this.ui.getEmbeddedPng(mxUtils.bind(this, function(data)
                {
                    fn(file.meta.sha, data);
                }), error, (this.ui.getCurrentFile() != file) ?
                    file.getData() : null, p.scale, p.border);
            }
            else
            {
                fn(file.meta.sha, Base64.encode(file.getData()));
            }
        });

        if (overwrite)
        {
            this.getSha(org, repo, path, ref, mxUtils.bind(this, function(sha)
            {
                file.meta.sha = sha;
                fn2();
            }), error);
        }
        else
        {
            fn2();
        }
    };
})();

