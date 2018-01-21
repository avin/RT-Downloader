import request from 'request-promise';
import fs from 'fs-extra';
import getSize from 'get-folder-size';
import config from '../config/config';

config.filesPerChannel = config.filesPerChannel || 10;
config.maxSizePerChannel = config.maxSizePerChannel || 0;

const getFolderSize = folder =>
    new Promise((resolve, reject) =>
        getSize(folder, function(err, size) {
            if (err) {
                reject(err);
            }
            resolve(size);
        }),
    );

(async () => {
    for (const channel of config.channels) {
        process.stdout.write(`\n${channel.name}: `);
        let downloadedCount = 0;
        const folder = `data/audio/${channel.name}`;
        await fs.ensureDir(folder);

        while (
            downloadedCount <= config.filesPerChannel &&
            !(config.maxSizePerChannel && (await getFolderSize(folder)) > config.maxSizePerChannel)
        ) {
            const tracksData = await request({
                method: 'GET',
                url: `https://www.radiotunes.com/_papi/v1/radiotunes/routines/channel/${channel.id}?audio_token=${config.token}&_=${+new Date()}`,
                json: true,
                proxy: config.proxy,
                headers: {
                    'user-agent': config.userAgent,
                    'x-session-key': config.xSessionKey,
                },
            });

            if (tracksData.tracks) {
                for (const track of tracksData.tracks) {
                    const url = track.content.assets[0].url;

                    const name = `${track.display_artist} - ${track.display_title}.mp4`.replace(
                        /[`~!@#$^&*?;:'"<>{}\[\]\\\/]/gi,
                        '',
                    );

                    //Read history
                    const historyFolder = `data/db`;
                    const historyFile = `${historyFolder}/${channel.id}`;
                    let history = [];
                    try {
                        await fs.ensureDir(historyFolder);
                        let content = await fs.readFile(historyFile);

                        history = JSON.parse(content);
                    } catch (err) {}

                    //If file does not exist in history
                    if (!history.includes(track.id)) {
                        const fileName = `${folder}/${name}`;

                        //Let's download it
                        const res = await request({
                            method: 'GET',
                            url: `http:${url}`,
                            encoding: null,
                            proxy: config.proxy,
                        });
                        const buffer = Buffer.from(res, 'utf8');

                        //Save to disk
                        try {
                            await fs.writeFile(fileName, buffer);
                            downloadedCount += 1;
                        } catch (err) {
                            console.log('Oops! File write error: ', err.message);
                        }

                        //Add record to history
                        history.push(track.id);
                        await fs.writeFile(historyFile, JSON.stringify(history), 'utf8'); // write it back

                        process.stdout.write(`+`);

                        if (downloadedCount > config.filesPerChannel) {
                            break;
                        }

                        if (config.maxSizePerChannel && (await getFolderSize(folder)) > config.maxSizePerChannel) {
                            break;
                        }
                    }
                }
            }
        }

        process.stdout.write('\n');
    }
})();
