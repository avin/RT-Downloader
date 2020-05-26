import figlet from 'figlet';
import chalk from 'chalk';
import yargs from 'yargs';
import config from './config';
import NetworkAgent from './NetworkAgent';
import QuestionMaster from './QuestionMaster';
import CacheAgent from './CacheAgent';

(async function main(firstRun) {
  await config.loadConfig();

  const { argv } = yargs.option('clear', {
    alias: 'c',
    type: 'boolean',
    description: 'Clear cache',
  });

  const qm = new QuestionMaster();

  if (firstRun) {
    if (!config.get('xSessionKey')) {
      const key = await qm.typeXSessionKey();
      if (!key) {
        return process.exit();
      }

      await config.updateConfig({ xSessionKey: key });
    }

    // Clear cache
    if (argv.c) {
      const cacheAgent = new CacheAgent();
      await cacheAgent.clearCache();
      console.info(chalk.green('Cache has been cleared successfully!'));
      process.exit(0);
    }

    // Print welcome message
    console.info(chalk.green(figlet.textSync('RT-Downloader')));
  }

  // Select station to work with and init agent for it
  const station = await qm.selectStation();
  if (station === 'exit') {
    process.exit(0);
  }

  const agent = new NetworkAgent({
    station,
  });
  qm.setAgent(agent);

  /**
   * Download playlists
   * @param playlistIds
   */
  async function downloadPlaylists({ playlistIds }) {
    const playlists = await agent.getPlaylists();

    for (const playlistId of playlistIds) {
      const playList = playlists.find((i) => i.id === playlistId);
      console.info(`\nPlaylist: ${chalk.bold(playList.slug)}`);

      await agent.downloadPlaylistTracks({
        playlistId,
        playlistName: playList.slug,
        listLength: playList.track_count,
      });
    }
  }

  /**
   * Download channels tracks
   * @param channelKeys
   * @param howMany
   */
  async function downloadChannelsTracks({ channelKeys, howMany }) {
    for (const channelKey of channelKeys) {
      const channel = (await agent.getChannels()).find((i) => i.key === channelKey);

      console.info(`\nChannel: ${chalk.bold(channel.key)}`);
      await agent.downloadChannelTracks({
        channelId: channel.id,
        channelName: channel.key,
        limit: howMany,
        isStrongLimit: true,
        isShowDone: false,
      });
    }
  }

  async function downloadShows({ showsList, howMany }) {
    for (const show of showsList) {
      console.info(`\nShow: ${chalk.bold(show)}`);

      const episodes = await agent.getShowEpisodes(show, { limit: howMany });
      await agent.downloadShowEpisodes({ episodes, showSlug: show });
    }
  }

  /**
   * Main
   */
  return (async function whatToDo() {
    const toDo = await qm.selectToDo(station);

    switch (toDo) {
      case 'download-shows': {
        const howToSelectShow = await qm.selectHowToSelectShow();
        let shows;
        switch (howToSelectShow) {
          case 'all': {
            shows = await agent.getShows();
            break;
          }
          case 'channels': {
            const channel = await qm.selectChannel();
            shows = await agent.getShows({ ofChannel: channel });
            break;
          }
          case 'back': {
            return whatToDo();
          }
          default:
            throw new Error('unknown answer');
        }

        const showsList = await qm.selectShows(shows);

        const howMany = await qm.howMany({
          message: 'How many recent episodes to download?',
        });

        await downloadShows({ showsList, howMany });

        break;
      }
      case 'download-playlists': {
        const playlistIds = await qm.selectPlaylists();

        await downloadPlaylists({ playlistIds });
        break;
      }
      case 'download-channels-tracks': {
        const channelKeys = await qm.selectChannels();

        const howMany = await qm.howMany({
          message: 'How many tracks to download?',
        });

        await downloadChannelsTracks({ channelKeys, howMany });

        console.info(`\nDone!\n`);
        break;
      }
      case 'back': {
        return main();
      }
      default:
    }

    return whatToDo();
  })();
})(true);
