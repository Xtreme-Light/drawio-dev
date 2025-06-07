// Copyright (c) 2006-2020, JGraph Ltd
/**
 */
RemoteFile = function (ui, data, title, id) {
    DrawioFile.call(this, ui, data);

    this.title = title;
    this.id = id;
    if (this.id) {
        localStorage.setItem(".file_id", this.id);
    }
    this.mode = App.MODE_REMOTE;
    this.peer = this.ui.remote;
};

//Extends mxEventSource
mxUtils.extend(RemoteFile, DrawioFile);

/**
 * Translates this point by the given vector.
 *
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
RemoteFile.prototype.isAutosave = function () {
    return false;
};

/**
 *
 */
RemoteFile.prototype.getMode = function () {
    return this.mode;
};

/**
 *
 */
RemoteFile.prototype.getId = function () {
    return this.id;
};

/**
 *
 */
RemoteFile.prototype.getTitle = function () {
    return this.title;
};


RemoteFile.prototype.isRenamable = function () {
    return false;
};
/**
 * Translates this point by the given vector.
 *
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
RemoteFile.prototype.save = function (revision, success, error, unloading, overwrite, message) {
    this.doSave(this.getId(), this.getTitle(), success, error, unloading, overwrite, message);
};
RemoteFile.prototype.saveAs = function (id, title, success, error) {
    this.doSave(id, title, success, error);
};
/**
 * Translates this point by the given vector.
 *
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
RemoteFile.prototype.doSave = function (id, title, success, error, unloading, overwrite, message) {
    DrawioFile.prototype.save.apply(this, [null, mxUtils.bind(this, function () {
        this.saveFile(id, title, false, success, error, unloading, overwrite, message);
    }), error, unloading, overwrite]);
};
RemoteFile.prototype.getHash = function () {
    // 定制一个开头
    return encodeURIComponent('X' + JSON.stringify([this.id, this.title]));
};


RemoteFile.prototype.saveFile = function (id, revision, success, error, unloading, overwrite, message) {
    if (!this.isEditable()) {
        if (success != null) {
            success();
        }
    } else if (!this.savingFile) {
        // 重复保存逻辑
        const doSave = mxUtils.bind(this, function (message) {
            // Sets shadow modified state during save
            this.savingFileTime = new Date();
            this.setShadowModified(false);
            this.savingFile = true;
            this.ui.pickFolder(this.getMode(), mxUtils.bind(this, function (folderId) {
                this.peer.insertFile(this.getTitle(), this.getData(), mxUtils.bind(this, function (file) {
                    // Checks for changes during save
                    this.setModified(this.getShadowModified());
                    this.savingFile = false;
                    if (success != null) {
                        if (typeof success === 'function') {
                            success();
                        } else {
                            error("插入文件失败");
                        }
                    }
                    this.ui.fileLoaded(file);
                }), mxUtils.bind(this, function () {
                    this.savingFile = false;
                    if (error != null) {
                        error();
                    }
                }), false, message, null);
            }));
        });
        // commit提交窗口
        this.peer.showCommitDialog(this.title, true, mxUtils.bind(this, function (message) {
            console.log("保存文件 " + this.title + " 到remote远端");
            doSave(message);
            console.log("保存文件 " + this.title + " 到remote远端 成功");
        }), error);
    } else if (error != null) {
        error({code: App.ERROR_BUSY});
    }
};