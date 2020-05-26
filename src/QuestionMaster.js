import inquirer from 'inquirer';
import chalk from 'chalk';
import config from './config';

const defaultOfListQuestion = {
  type: 'list',
  name: 'answer',
};

const goBackAnswer = {
  name: chalk.gray('Go back'),
  value: 'back',
};

export default class QuestionMaster {
  agent = null;

  setAgent(agent) {
    this.agent = agent;
  }

  async selectStation() {
    const { answer } = await inquirer.prompt([
      {
        ...defaultOfListQuestion,
        message: 'What station to use?',
        choices: [
          ...config.get('stations'),
          {
            name: chalk.gray('Exit'),
            value: 'exit',
          },
        ],
      },
    ]);

    return answer;
  }

  async typeXSessionKey() {
    const { answer } = await inquirer.prompt([
      {
        type: 'input',
        name: 'answer',
        message: 'Enter X-Session-Key',
      },
    ]);

    return answer;
  }

  async selectHowToSelectShow() {
    const { answer } = await inquirer.prompt([
      {
        ...defaultOfListQuestion,
        message: 'What show do you want?',
        choices: [
          {
            name: 'List all',
            value: 'all',
          },
          {
            name: 'Select by channels',
            value: 'channels',
          },
          goBackAnswer,
        ],
      },
    ]);

    return answer;
  }

  async selectShows(shows) {
    const questions = shows.map((i) => ({
      name: i.cliName,
      value: i.slug,
    }));
    const { answer } = await inquirer.prompt([
      {
        ...defaultOfListQuestion,
        type: 'checkbox',
        message: 'What show do you want?',
        choices: questions,
      },
    ]);

    return answer;
  }

  async selectPlaylists() {
    const playlists = await this.agent.getPlaylists();
    const questions = playlists.map((i) => ({
      name: i.cliName,
      value: i.id,
    }));
    const { answer } = await inquirer.prompt([
      {
        ...defaultOfListQuestion,
        type: 'checkbox',
        message: 'What playlists do you want?',
        choices: questions,
      },
    ]);

    return answer;
  }

  async selectToDo(station) {
    const { answer } = await inquirer.prompt([
      {
        ...defaultOfListQuestion,
        message: 'What to do?',
        choices: [
          station === 'di' && { name: 'Download shows', value: 'download-shows' },
          station === 'di' && { name: 'Download playlists', value: 'download-playlists' },

          { name: 'Download tracks of channels', value: 'download-channels-tracks' },

          goBackAnswer,
        ].filter(Boolean),
      },
    ]);

    return answer;
  }

  async selectChannel({ message = 'Select channel' } = {}) {
    const channels = await this.agent.getChannels();
    const questionChannels = channels.map((i) => ({
      name: i.key,
      value: i.key,
    }));

    const { answer } = await inquirer.prompt([
      {
        type: 'list',
        pageSize: 20,
        name: 'answer',
        message,
        choices: questionChannels,
      },
    ]);

    return answer;
  }

  async selectChannels({ message = 'Select channels' } = {}) {
    const channels = await this.agent.getChannels();
    const questionChannels = channels.map((i) => ({
      name: i.key,
      value: i.key,
    }));

    const { answer } = await inquirer.prompt([
      {
        type: 'checkbox',
        pageSize: 20,
        name: 'answer',
        message,
        choices: questionChannels,
      },
    ]);

    return answer;
  }

  async howMany({ message = 'How many?' } = {}) {
    const { answer } = await inquirer.prompt([
      {
        type: 'number',
        name: 'answer',
        default: 10,
        message,
      },
    ]);

    return answer;
  }
}
