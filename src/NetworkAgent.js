import request from 'request-promise';
import chalk from 'chalk';
import fs from 'fs-extra';
import _ from 'lodash';
import sanitizeFileName from 'sanitize-filename';
import config from './config';
import CacheAgent from './CacheAgent';

export default class NetworkAgent {
  station = null;

  constructor(options) {
    Object.assign(this, options);
    this.cache = new CacheAgent();
  }

  /**
   * Get common options for request command
   * @private
   */
  _getCommonRequestOptions() {
    return {
      json: true,
      proxy: config.get('proxy'),
      headers: {
        'user-agent': config.get('userAgent'),
        'x-session-key': config.get('xSessionKey'),
      },
    };
  }

  /**
   * Get channels list
   */
  async getChannels() {
    const cacheChannels = await this.cache.getItem([this.station, 'channels']);
    if (cacheChannels) {
      return cacheChannels;
    }

    const data = await request({
      method: 'GET',
      url: `https://www.jazzradio.com/_papi/v1/${this.station}/currently_playing`,
      ...this._getCommonRequestOptions(),
    });

    const result = data.map((i) => ({
      id: i.channel_id,
      key: i.channel_key,
    }));

    await this.cache.setItem([this.station, 'channels'], result);

    return result;
  }

  /**
   * Get shows list
   */
  async getShows({ ofChannel } = {}) {
    const cacheShows = await this.cache.getItem([this.station, 'shows']);
    let finalResults = [];

    if (cacheShows) {
      finalResults = cacheShows;
    } else {
      console.info(
        chalk.gray(
          'It may take some time to grab shows-list for the first time (up to 5-10 minutes)...',
        ),
      );

      let inProgress = true;
      let page = 1;
      const perPage = 5;

      while (inProgress) {
        let { results } = await request({
          method: 'GET',
          url: `https://www.di.fm/_papi/v1/${this.station}/shows?page=${page}&per_page=${perPage}`,
          ...this._getCommonRequestOptions(),
        });

        results = results.map((i) => ({
          ...i,
          cliName: `[${chalk.gray(i.slug)}]\t\t ${chalk.bold(i.name)} ${i.artists_tagline}`,
        }));

        finalResults = [...finalResults, ...results];
        if (results.length < perPage) {
          inProgress = false;
        } else {
          page += 1;
        }
      }

      await this.cache.setItem([this.station, 'shows'], finalResults);
    }

    if (ofChannel) {
      finalResults = finalResults.filter((i) => i.channels.some((c) => c.key === ofChannel));
    }

    return finalResults;
  }

  /**
   * Get show-episodes
   */
  async getShowEpisodes(show, { limit = 10 } = {}) {
    let finalResults = [];

    let inProgress = true;
    let page = 1;
    const perPage = 5;

    while (inProgress) {
      const results = await request({
        method: 'GET',
        url: `https://www.di.fm/_papi/v1/${this.station}/shows/${show}/episodes?page=${page}&per_page=${perPage}`,
        ...this._getCommonRequestOptions(),
      });

      finalResults = [...finalResults, ...results];
      if (results.length < perPage || results.length >= limit) {
        inProgress = false;
      } else {
        page += 1;
      }
    }

    return finalResults.slice(0, limit);
  }

  async downloadShowEpisodes({ episodes, showSlug }) {
    process.stdout.write('Downloading: ');

    for (const episode of episodes) {
      const url = _.get(episode, ['tracks', 0, 'content', 'assets', 0, 'url']);
      const ext = _.last(url.split('?')[0].split('.'));
      const trackName = sanitizeFileName(_.get(episode, ['tracks', 0, 'track']));

      try {
        await this.downloadFile({
          url,
          location: `./downloads/shows/${showSlug}`,
          fileName: `${trackName}.${ext}`,
        });
        process.stdout.write('.');
      } catch (e) {
        process.stdout.write('X');
      }
    }

    process.stdout.write('\nDone!\n\n');
  }

  /**
   * Get show-episodes
   */
  async getPlaylists() {
    const cacheShows = await this.cache.getItem([this.station, 'playlists']);
    let finalResults = [];

    if (cacheShows) {
      finalResults = cacheShows;
    } else {
      console.info(
        chalk.gray(
          'It may take some time to get playlists for the first time (up to 5 minutes)...',
        ),
      );

      let inProgress = true;
      let page = 1;
      const perPage = 12;

      while (inProgress) {
        let { results } = await request({
          method: 'GET',
          url: `https://www.di.fm/_papi/v1/di/search/playlists?order_by=newest_sort+desc&page=${page}&per_page=${perPage}`,
          ...this._getCommonRequestOptions(),
        });

        results = results.map((i) => ({
          ...i,
          cliName: `${chalk.bold(i.name)} ${chalk.gray(
            `[${i.duration} - ${i.track_count} tracks]`,
          )}`,
        }));

        finalResults = [...finalResults, ...results];
        if (results.length < perPage) {
          inProgress = false;
        } else {
          page += 1;
        }
      }

      await this.cache.setItem([this.station, 'playlists'], finalResults);
    }

    return finalResults;
  }

  async downloadPlaylistTracks({ playlistId, playlistName, listLength = 1 }) {
    let inProgress = true;
    let total = 0;

    process.stdout.write('Downloading: ');

    while (inProgress) {
      const data = await request({
        method: 'POST',
        url: `https://www.di.fm/_papi/v1/di/playlists/${playlistId}/play`,
        ...this._getCommonRequestOptions(),
      });

      for (const track of data.tracks) {
        await this.markTrackAsPlayed({ playlistId, trackId: track.id });

        const url = _.get(track, ['content', 'assets', 0, 'url']);
        const ext = _.last(url.split('?')[0].split('.'));
        const trackName = sanitizeFileName(track.track);

        try {
          await this.downloadFile({
            url,
            location: `./downloads/playlists/${playlistName}`,
            fileName: `${trackName}.${ext}`,
          });
          process.stdout.write('.');
        } catch (e) {
          process.stdout.write('X');
        }
        total += 1;

        if (total >= listLength) {
          inProgress = false;
          break;
        }
      }
    }

    process.stdout.write('\nDone!\n\n');
  }

  async downloadChannelTracks({ channelId, channelName, limit = 1 }) {
    let inProgress = true;
    let total = 0;

    process.stdout.write('Downloading: ');

    while (inProgress) {
      const data = await request({
        method: 'GET',
        url: `https://www.di.fm/_papi/v1/di/routines/channel/${channelId}`,
        ...this._getCommonRequestOptions(),
      });

      for (const track of data.tracks) {
        await this.markTrackAsPlayed({ channelId, trackId: track.id });

        const url = _.get(track, ['content', 'assets', 0, 'url']);
        const ext = _.last(url.split('?')[0].split('.'));
        const trackName = sanitizeFileName(track.track);

        try {
          await this.downloadFile({
            url,
            location: `./downloads/channels/${channelName}`,
            fileName: `${trackName}.${ext}`,
          });
          process.stdout.write('.');
        } catch (e) {
          process.stdout.write('X');
        }
        total += 1;

        if (total >= limit) {
          inProgress = false;
          break;
        }
      }
    }

    process.stdout.write('\nDone!\n\n');
  }

  async markTrackAsPlayed({ playlistId, channelId, trackId }) {
    return request({
      method: 'POST',
      url: `https://www.di.fm/_papi/v1/di/listen_history`,
      body: {
        playlist_id: playlistId,
        track_id: trackId,
        channel_id: channelId,
      },
      ...this._getCommonRequestOptions(),
    });
  }

  /**
   * Download file
   * @param url - file url
   * @param fileName - file name (without directory)
   * @param location - directory to store file
   */
  async downloadFile({ url, fileName, location = './downloads' }) {
    url = url.replace(/^\/\//, 'https://');
    await fs.mkdirp(location);
    fileName = fileName || `unknown-${+new Date()}`;

    const target = `${location}/${fileName}`;

    // Do not download already downloaded file
    if (await fs.pathExists(target)) {
      return false;
    }

    const res = await request({
      method: 'GET',
      url,
      encoding: null,
      ...this._getCommonRequestOptions(),
      json: undefined,
    });
    const buffer = Buffer.from(res, 'utf8');

    await fs.writeFile(target, buffer);

    return true;
  }
}
