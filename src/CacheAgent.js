import fs from 'fs-extra';
import _ from 'lodash';
import os from 'os';
import path from 'path';

export default class CacheAgent {
  cache = null;

  cacheLocation = path.resolve(os.homedir(), '.rt-downloader', 'cache');

  getCacheFilePath() {
    return path.resolve(this.cacheLocation, 'store');
  }

  async prepareCache() {
    if (!this.cache) {
      try {
        await fs.mkdirp(this.cacheLocation);
        this.cache = await fs.readJson();
      } catch (e) {
        this.cache = {};
      }
    }
  }

  async getItem(location) {
    await this.prepareCache();

    return _.get(this.cache, location);
  }

  async setItem(location, data) {
    await this.prepareCache();

    _.set(this.cache, location, data);

    await fs.writeJson(this.getCacheFilePath(), this.cache);
  }

  async clearCache() {
    await this.prepareCache();

    this.cache = {};

    await fs.writeJson(this.getCacheFilePath(), this.cache);
  }
}
