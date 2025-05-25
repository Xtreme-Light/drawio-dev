// Copyright (c) 2006-2020, JGraph Ltd
/**
 */
RemoteFile = function(ui, data, title,id)
{
	DrawioFile.call(this, ui, data);

	this.title = title;
	this.id = id;
	this.mode = App.MODE_REMOTE;
};

//Extends mxEventSource
mxUtils.extend(RemoteFile, DrawioFile);

/**
 * Translates this point by the given vector.
 * 
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
RemoteFile.prototype.isAutosave = function()
{
	return false;
};

/**
 * 
 */
RemoteFile.prototype.getMode = function()
{
	return this.mode;
};

/**
 *
 */
RemoteFile.prototype.getId = function()
{
	return this.id;
};

/**
 * 
 */
RemoteFile.prototype.getTitle = function()
{
	return this.title;
};


RemoteFile.prototype.isRenamable = function()
{
	return false;
};
/**
 * Translates this point by the given vector.
 *
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
RemoteFile.prototype.save = function(revision, success, error, unloading, overwrite, message)
{
	this.doSave(this.getId(),this.getTitle(), success, error, unloading, overwrite, message);
};
RemoteFile.prototype.saveAs = function(id,title, success, error)
{
	this.doSave(id,title, success, error);
};
/**
 * Translates this point by the given vector.
 *
 * @param {number} dx X-coordinate of the translation.
 * @param {number} dy Y-coordinate of the translation.
 */
RemoteFile.prototype.doSave = function(id,title, success, error, unloading, overwrite, message)
{
	// Forces update of data for new extensions
	var prev = this.meta.name;
	this.meta.name = title;

	DrawioFile.prototype.save.apply(this, [null, mxUtils.bind(this, function()
	{
		this.meta.name = prev;
		this.saveFile(title, false, success, error, unloading, overwrite, message);
	}), error, unloading, overwrite]);
};

RemoteFile.prototype.saveFile = function(title, revision, success, error, unloading, overwrite, message)
{
	if (!this.isEditable())
	{
		if (success != null)
		{
			success();
		}
	}
	else if (!this.savingFile)
	{
		var doSave = mxUtils.bind(this, function(message)
		{
			if (this.getTitle() == title)
			{
				try
				{
					// Sets shadow modified state during save
					this.savingFileTime = new Date();
					this.setShadowModified(false);
					this.savingFile = true;

					var savedEtag = this.getCurrentEtag();
					var savedData = this.data;

					this.peer.saveFile(this, mxUtils.bind(this, function(etag)
						{
							// Checks for changes during save
							this.setModified(this.getShadowModified());
							this.savingFile = false;
							this.setDescriptorEtag(this.meta, etag);

							this.fileSaved(savedData, savedEtag, mxUtils.bind(this, function()
							{
								this.contentChanged();

								if (success != null)
								{
									success();
								}
							}), error);
						}),
						mxUtils.bind(this, function(err)
						{
							this.savingFile = false;

							if (this.isConflict(err))
							{
								this.inConflictState = true;

								if (error != null)
								{
									// Adds commit message to save after
									// conflict has been resolved
									err.commitMessage = message;
									error(err);
								}
							}
							else if (error != null)
							{
								error(err);
							}
						}), overwrite, message);
				}
				catch (e)
				{
					this.savingFile = false;

					if (error != null)
					{
						error(e);
					}
					else
					{
						throw e;
					}
				}
			}
			else
			{
				// Sets shadow modified state during save
				this.savingFileTime = new Date();
				this.setShadowModified(false);
				this.savingFile = true;

				this.ui.pickFolder(this.getMode(), mxUtils.bind(this, function(folderId)
				{
					this.peer.insertFile(title, this.getData(), mxUtils.bind(this, function(file)
					{
						// Checks for changes during save
						this.setModified(this.getShadowModified());
						this.savingFile = false;

						if (success != null)
						{
							success();
						}

						this.ui.fileLoaded(file);
					}), mxUtils.bind(this, function()
					{
						this.savingFile = false;

						if (error != null)
						{
							error();
						}
					}), false, folderId, message);
				}));
			}
		});

		if (message != null)
		{
			doSave(message);
		}
		else
		{
			this.peer.showCommitDialog(this.meta.name,
				this.getDescriptorEtag(this.meta) == null ||
				this.meta.isNew, mxUtils.bind(this, function(message)
				{
					doSave(message);
				}), error);
		}
	}
	else if (error != null)
	{
		error({code: App.ERROR_BUSY});
	}
};