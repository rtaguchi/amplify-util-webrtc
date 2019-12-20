const fs = require('fs');
const chalk = require('chalk');

module.exports = {
  name: 'remove',
  run: async (context) => {
    projectMeta = context.amplify.getProjectMeta();
    const backendDir = context.amplify.pathManager.getBackendDirPath();
    const paramDir = `${backendDir}/webrtc/`;
    const localParamJson = `${paramDir}/onLocal.json`

    if (!fs.existsSync(localParamJson)){
      console.log(chalk.yellow('WebRTC does not exist.'));
      return
    }

    const answer = await context.amplify.confirmPrompt.run('Are you sure you want to delete the resource? This action deletes all files related to this resource from the backend directory.')
    if (answer) {
      try {
        fs.unlinkSync(localParamJson)
        console.log(chalk.green('Successfully removed resource.'));
      } catch(err) {
        console.log(chalk.red(err));
      }
    }
  }
};
