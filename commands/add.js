const inquirer = require('inquirer');
const fs = require('fs');
const chalk = require('chalk');
const questions = require('../questions/questions.json');

let projectMeta;

module.exports = {
  name: 'add',
  run: async (context) => {
    projectMeta = context.amplify.getProjectMeta();
    const backendDir = context.amplify.pathManager.getBackendDirPath();
    const paramDir = `${backendDir}/webrtc`;
    const localParamJson = `${paramDir}/onLocal.json`

    if (fs.existsSync(localParamJson)){
      console.log(chalk.yellow('WebRTC already exists. If you want to change, remove and add again.'));
      return
    }

    while (!checkIfAuthExists(context)) {
      if (
        await context.amplify.confirmPrompt.run(
          'You need to add auth (Amazon Cognito) to your project in order to add WebRTC. Do you want to add auth now?'
        )
      ) {
        try {
          const { add } = require('amplify-category-auth');
          await add(context);
        } catch (e) {
          context.print.error('The Auth plugin is not installed in the CLI. You need to install it to use this feature');
          break;
        }
        break;
      } else {
        process.exit(0);
      }
    }
    const result = await serviceQuestions(context);

    if (!fs.existsSync(paramDir)) {
      fs.mkdirSync(paramDir)
    } 

    try {
      fs.writeFileSync(localParamJson, JSON.stringify(result, null, 4));
      console.log(chalk.green('Successfully added resource.'));
    } catch(err) {
      console.log(chalk.red(err));
    }
  },
};


async function serviceQuestions(context) {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();

  const { add } = questions;

  // question dictionaries taken by inquirer
  // signaling channel name
  const scNameQuestion = [
    {
      type: add[0].type,
      name: add[0].key,
      message: add[0].question,
      validate: amplify.inputValidation(add[0]),
      default: projectMeta.providers.awscloudformation.StackName + '-SC'
    }
  ];

  // TTL value of an existing signaling channel
  const ttlQuestion = [
    {
      type: add[1].type,
      name: add[1].key,
      message: add[1].question,
      validate: amplify.inputValidation(add[1]),
      default: '60',
    }
  ];

  const answers = Object.assign(await inquirer.prompt(scNameQuestion), await inquirer.prompt(ttlQuestion)); 
  return answers;
}

function checkIfAuthExists(context) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authExists = true;
      }
    });
  }
  return authExists;
}
