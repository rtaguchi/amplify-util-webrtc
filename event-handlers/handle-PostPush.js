const chalk = require('chalk');
const fs = require('fs');
const AWS = require('aws-sdk')

let projectMeta;
let localParam
let cloudParam

async function run(context, args) {
  projectMeta = context.amplify.getProjectMeta();
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
    localParam = context.amplify.readJsonFile(localParamJson)
    if (onCloud) {
      cloudParam = context.amplify.readJsonFile(cloudParamJson)
      if (localParam.channelName != cloudParam.channelName || localParam.ttl != cloudParam.ttl){
        console.log(chalk.yellow('Updating WebRTC settings on the cloud.'))
        await deleteWebRTC(context, cloudParam, cloudParamJson)
        await createWebRTC(context, localParam, cloudParamJson)
        console.log(chalk.green('Successfully updated WebRTC settings on the cloud.'))        
      } else {

        console.log(chalk.green('No changes to WebRTC settings.'))
      }
    } else {
      console.log(chalk.green('Creating WebRTC settings on the cloud.'))
      await createWebRTC(context, localParam, cloudParamJson)
      console.log(chalk.green('Successfully created WebRTC settings on the cloud.'));
    }
  } else {
    if (onCloud) {
      cloudParam = context.amplify.readJsonFile(cloudParamJson)
      console.log(chalk.yellow('Deleting WebRTC settings on the cloud.'))
      await deleteWebRTC(context, cloudParam, cloudParamJson)
      console.log(chalk.green('Successfully deleted WebRTC settings on the cloud.'));
    } else {
    }
  }
}

async function createWebRTC(context, localParam, cloudParamJson){
  const awsConfig = getAWSConfig(context)

  try {
    const params = {
      ChannelName: localParam.channelName,
      ChannelType: 'SINGLE_MASTER',
      SingleMasterConfiguration: {
        MessageTtlSeconds: localParam.ttl
      }
    }
    const kinesisvideo = new AWS.KinesisVideo(awsConfig);
    const kinesisRes = await kinesisvideo.createSignalingChannel(params).promise()

    const policyJson = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "kinesisvideo:GetSignalingChannelEndpoint",
            "kinesisvideo:ConnectAsMaster",
            "kinesisvideo:GetIceServerConfig",
            "kinesisvideo:ConnectAsViewer"
          ],
          "Resource": kinesisRes.ChannelARN
        }
      ]
    }
    const createPolicyParams = {
      PolicyDocument: JSON.stringify(policyJson),
      PolicyName: localParam.channelName + '-policy'
    }
    const iamC = new AWS.IAM(awsConfig)
    const createRes = await iamC.createPolicy(createPolicyParams).promise()

    const attachPolicyParams = {
      PolicyArn: createRes.Policy.Arn,
      RoleName: projectMeta.providers.awscloudformation.AuthRoleName
    }
    const iamA = new AWS.IAM(awsConfig)
    await iamA.attachRolePolicy(attachPolicyParams).promise()

    const cloudParam = {
      channelName: localParam.channelName,
      ttl: localParam.ttl,
      channelArn: kinesisRes.ChannelARN,
      policyName: localParam.channelName + '-policy',
      policyArn: createRes.Policy.Arn
    }
    fs.writeFileSync(cloudParamJson, JSON.stringify(cloudParam, null, 4));
    await generateAWSExportsWebRTC(context, cloudParam.channelArn)

  } catch(err) {
    console.error(err)
  }
}

async function deleteWebRTC(context, cloudParam, cloudParamJson){
  const awsConfig = getAWSConfig(context)
  const kinesisvideo = new AWS.KinesisVideo(awsConfig);
  const iam = new AWS.IAM(awsConfig)

  try{
    await kinesisvideo.deleteSignalingChannel({ChannelARN: cloudParam.channelArn}).promise()
    await iam.detachRolePolicy({
      PolicyArn: cloudParam.policyArn, 
      RoleName: projectMeta.providers.awscloudformation.AuthRoleName
    }).promise()
    await iam.deletePolicy({PolicyArn: cloudParam.policyArn}).promise()

    fs.unlinkSync(cloudParamJson)
    extinguishAWSExportsWebRTC(context)
  } catch(err) {
    console.error(err)
  }
}

function getAWSConfig(context) {
  let provider;
  if (typeof context.amplify.getPluginInstance === 'function') {
    provider = context.amplify.getPluginInstance(context, 'awscloudformation');
  } else {
    console.log('Falling back to old version of getting AWS SDK. If you see this error you are running an old version of Amplify. Please update as soon as possible!');
    provider = getPluginInstanceShim(context, 'awscloudformation');
  }

  return provider;
}

async function generateAWSExportsWebRTC(context, channelArn) {
  const projectConfig = context.amplify.getProjectConfig();
  const amplifyMeta = context.amplify.getProjectMeta();
  const props = {};

  const filePath = getFilePath(projectConfig);

  props.region = amplifyMeta.providers.awscloudformation.Region
  props.channelArn = channelArn

  if (projectConfig.frontend === 'javascript') {
    const copyJobs = [
      {
        dir: __dirname,
        template: '../utils/aws-webrtc-exports.js.ejs',
        target: filePath,
      },
    ];
    await context.amplify.copyBatch(context, copyJobs, props);
  } else {
    fs.writeFileSync(filePath, JSON.stringify(props, null, 4));
  }
}

function extinguishAWSExportsWebRTC(context){
  const projectConfig = context.amplify.getProjectConfig();
  const filePath = getFilePath(projectConfig);
  fs.unlinkSync(filePath)
}

function getFilePath(projectConfig){
  if (projectConfig.frontend === 'ios') {
    return './aws-webrtc-exports.json';
  } else if (projectConfig.frontend === 'android') {
    return `./${projectConfig.android.config.ResDir}/aws-webrtc-exports.json`;
  } else if (projectConfig.frontend === 'javascript') {
    return `./${projectConfig.javascript.config.SourceDir}/aws-webrtc-exports.js`;
  } else {
    // Default location in json. Worst case scenario
    return './aws-webrtc-exports.json';
  }
}

module.exports = {
  run,
};
