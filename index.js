const path = require('path');

async function executeAmplifyCommand(context) {
  try {
    const commandsDirPath = path.normalize(path.join(__dirname, 'commands'));
    const commandPath = path.join(commandsDirPath, context.input.command);
    const commandModule = require(commandPath);
    await commandModule.run(context);
  } catch(err) {
    console.error(err)
  }
}

async function handleAmplifyEvent(context, args) {
  try {
    const eventHandlersDirPath = path.normalize(path.join(__dirname, 'event-handlers'));
    const eventHandlerPath = path.join(eventHandlersDirPath, `handle-${args.event}`);
    const eventHandlerModule = require(eventHandlerPath);
    await eventHandlerModule.run(context, args)
  } catch(err) {
    console.error(err)
  }
}

module.exports = {
  executeAmplifyCommand,
  handleAmplifyEvent,
};