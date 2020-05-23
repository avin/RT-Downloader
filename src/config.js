import path from 'path';
import os from 'os';
import fs from 'fs-extra';

class Config {
  _state = {
    // Proxy
    proxy: null,

    // Simulating user-agent
    userAgent:
      'USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',

    // Auth session (grab from browser)
    xSessionKey: '',

    // List of all radio-stations
    stations: [
      { name: 'DI.FM', value: 'di' },
      { name: 'RadioTunes', value: 'radiotunes' },
      { name: 'JazzRadio', value: 'jazzradio' },
      { name: 'ClassicalRadio', value: 'classicalradio' },
      { name: 'RockRadio', value: 'rockradio' },
      { name: 'ZenRadio', value: 'zenradio' },
    ],
  };

  getConfigFilePath() {
    return path.resolve(os.homedir(), '.rt-downloader', 'config.json');
  }

  async prepareConfigFolder() {
    await fs.mkdirp(path.resolve(os.homedir(), '.rt-downloader'));
  }

  async loadConfig() {
    await this.prepareConfigFolder();

    try {
      Object.assign(this._state, await fs.readJson(this.getConfigFilePath()));
    } catch (e) {
      await this.updateConfig({});
    }
  }

  async updateConfig(newConfigState) {
    await this.prepareConfigFolder();

    Object.assign(this._state, newConfigState);

    await fs.writeJson(this.getConfigFilePath(), this._state, { spaces: 4 });
  }

  get(key) {
    return this._state[key];
  }
}

const config = new Config();

export default config;
