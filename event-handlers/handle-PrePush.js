const chalk = require('chalk');
const fs = require('fs');

async function run(context, args) {
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const paramDir = `${backendDir}/webrtc`;
  const localParamJson = `${paramDir}/onLocal.json`
  const cloudParamJson = `${paramDir}/onCloud.json`

  try {
    onLocal = fs.existsSync(localParamJson)
    onCloud = fs.existsSync(cloudParamJson)
  } catch(err) {
    console.log(chalk.red(err))
  }


  if (onLocal) {
    if (onCloud) {
      const localParam = context.amplify.readJsonFile(localParamJson)
      const cloudParam = context.amplify.readJsonFile(cloudParamJson)
      if (localParam.channelName != cloudParam.channelName || localParam.ttl != cloudParam.ttl){
        console.log(chalk.yellow('\nThis action updates WebRTC settings on the cloud.'))
      } else {
        console.log(chalk.green('\nWebRTC settings exists on the cloud.'))
      }
    } else {
      console.log(chalk.green('\nThis action creates WebRTC settings on the cloud.'))
    }
  } else {
    if (onCloud) {
      console.log(chalk.yellow('\nThis action deletes WebRTC settings on the cloud.'))
    } else {
    }
  }
}

module.exports = {
  run,
};
