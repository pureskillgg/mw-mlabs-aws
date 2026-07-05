import { Agent as HttpAgent } from 'node:http'

import { v4 as uuidv4 } from 'uuid'
import { SQSClient } from '@aws-sdk/client-sqs'
import { NodeHttpHandler } from '@smithy/node-http-handler'

const getDockerHost = () => {
  const dockerHost = process.env.DOCKER_HOST
  return dockerHost ? new URL(process.env.DOCKER_HOST).hostname : 'localhost'
}

const port = 4100

const baseClientOptions = {
  region: 'eu-west-1',
  credentials: {
    accessKeyId: 'id',
    secretAccessKey: 'secret'
  }
}

export const getEndpoint = () => {
  const host = getDockerHost()
  return `http://${host}:${port}`
}

export const setupContext = async (t) => {
  const endpoint = getEndpoint()
  const name = uuidv4()
  const url = [endpoint, 'queue', name].join('/')

  // A fresh, keep-alive-disabled request handler per test so the SQS client
  // leaves no lingering free-socket timers and the AVA worker exits promptly.
  t.context.clientOptions = {
    ...baseClientOptions,
    endpoint,
    requestHandler: new NodeHttpHandler({
      httpAgent: new HttpAgent({ keepAlive: false })
    })
  }
  const sqsClient = new SQSClient(t.context.clientOptions)

  t.context.queueConfig = {
    name,
    url,
    sqsClient
  }
}
