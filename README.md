# Amplify WebRTC Plugin

An open source plugin for the Amplify CLI that makes it easy to incorporate **real-time two-way** video streaming into your web applications powered by [AWS Amplify](https://aws-amplify.github.io/) and [Amazon Kinesis Video Streams](https://aws.amazon.com/kinesis/video-streams/).

## Installation Guide

To get started install the Amplify CLI via the getting started guide on the [Amplify-CLI Github repo](https://github.com/aws-amplify/amplify-cli/).

Now, install this Amplify WebRTC plugin through manually:

1. Clone this repo onto your local machine
1. Open the terminal and navigate to the repo you just cloned
1. Run this command: 
```
npm install -g
```

## Usage

To use this plugin you just need to configure a project using `amplify init`.

Note: If you aren't developing a mobile/web app then it doesn't matter what language you choose.


### amplify webrtc add

Command to configure the params for setting up a real-time livestream. Run `amplify push` to create the resources in the cloud. (NOT `amplify webrtc push`)

### amplify webrtc remove

Command to remove a setting that you have made. To remove from the cloud you must run `amplify push`.

## License

This library is licensed under the Apache 2.0 License. 
