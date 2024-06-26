import * as amqp from 'amqplib/callback_api';

import { configService, HttpServer, Rabbitmq } from '../../../../config/env.config';
import { Logger } from '../../../../config/logger.config';
import { Events } from '../../../types/wa.types';

const logger = new Logger('AMQP');

const parseEvtName = (evt: string) => evt.replace(/_/g, '.').toLowerCase();

const globalQueues: { [key: string]: Events[] } = {
  contacts: [Events.CONTACTS_SET, Events.CONTACTS_UPDATE, Events.CONTACTS_UPSERT],
  messages: [
    Events.MESSAGES_DELETE,
    Events.MESSAGES_SET,
    Events.MESSAGES_UPDATE,
    Events.MESSAGES_UPSERT,
    Events.MESSAGING_HISTORY_SET,
    Events.SEND_MESSAGE,
  ],
  chats: [Events.CHATS_DELETE, Events.CHATS_SET, Events.CHATS_UPDATE, Events.CHATS_UPSERT],
  groups: [Events.GROUPS_UPDATE, Events.GROUPS_UPSERT, Events.GROUP_PARTICIPANTS_UPDATE],
  others: [], // All other events not included in the above categories
};

let amqpChannel: amqp.Channel | null = null;

export const initAMQP = () => {
  return new Promise<void>((resolve, reject) => {
    const rabbitConfig = configService.get<Rabbitmq>('RABBITMQ');
    amqp.connect(rabbitConfig.URI, (error, connection) => {
      if (error) {
        reject(error);
        return;
      }

      connection.createChannel((channelError, channel) => {
        if (channelError) {
          reject(channelError);
          return;
        }

        channel.assertExchange(rabbitConfig.EXCHANGE_NAME || 'evolution_exchange', 'topic', {
          durable: true,
          autoDelete: false,
        });

        amqpChannel = channel;

        logger.info('AMQP initialized');
        resolve();
      });
    });
  });
};

export const getAMQP = (): amqp.Channel | null => {
  return amqpChannel;
};

export const initGlobalQueues = () => {
  logger.info('Initializing global queues');
  const events = configService.get<Rabbitmq>('RABBITMQ').EVENTS;

  if (!events) {
    logger.warn('No events to initialize on AMQP');
    return;
  }

  const eventKeys = Object.keys(events);

  eventKeys.forEach((event) => {
    if (events[event] === false) return;

    const queueName = `${event.replace(/_/g, '.').toLowerCase()}`;
    const amqp = getAMQP();
    const exchangeName = 'evolution_exchange';

    amqp.assertExchange(exchangeName, 'topic', {
      durable: true,
      autoDelete: false,
    });

    amqp.assertQueue(queueName, {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    amqp.bindQueue(queueName, exchangeName, event);
  });
};

export const initQueues = (instanceName: string, events: string[]) => {
  if (!events || !events.length) return;
  const rabbitConfig = configService.get<Rabbitmq>('RABBITMQ');

  const rabbitMode = rabbitConfig.MODE || 'isolated';
  let exchangeName = rabbitConfig.EXCHANGE_NAME || 'evolution_exchange';

  const receivedEvents = events.map(parseEvtName);
  if (rabbitMode === 'isolated') {
    exchangeName = instanceName;

    receivedEvents.forEach((event) => {
      amqpChannel.assertExchange(exchangeName, 'topic', {
        durable: true,
        autoDelete: false,
      });

      const queueName = `${instanceName}.${event}`;
      amqpChannel.assertQueue(queueName, {
        durable: true,
        autoDelete: false,
        arguments: { 'x-queue-type': 'quorum' },
      });

      amqpChannel.bindQueue(queueName, exchangeName, event);
    });
  } else if (rabbitMode === 'single') {
    amqpChannel.assertExchange(exchangeName, 'topic', {
      durable: true,
      autoDelete: false,
    });

    const queueName = 'evolution';
    amqpChannel.assertQueue(queueName, {
      durable: true,
      autoDelete: false,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    receivedEvents.forEach((event) => {
      amqpChannel.bindQueue(queueName, exchangeName, event);
    });
  } else if (rabbitMode === 'global') {
    const queues = Object.keys(globalQueues);

    const addQueues = queues.filter((evt) => {
      if (evt === 'others') {
        return receivedEvents.some(
          (e) =>
            !Object.values(globalQueues)
              .flat()
              .includes(e as Events),
        );
      }
      return globalQueues[evt].some((e) => receivedEvents.includes(e));
    });

    addQueues.forEach((event) => {
      amqpChannel.assertExchange(exchangeName, 'topic', {
        durable: true,
        autoDelete: false,
      });

      const queueName = event;
      amqpChannel.assertQueue(queueName, {
        durable: true,
        autoDelete: false,
        arguments: {
          'x-queue-type': 'quorum',
        },
      });

      if (globalQueues[event].length === 0) {
        // Other events
        const otherEvents = Object.values(globalQueues).flat();
        for (const subEvent in Events) {
          const eventCode = Events[subEvent];
          if (otherEvents.includes(eventCode)) continue;
          if (!receivedEvents.includes(eventCode)) continue;
          amqpChannel.bindQueue(queueName, exchangeName, eventCode);
        }
      } else {
        globalQueues[event].forEach((subEvent) => {
          amqpChannel.bindQueue(queueName, exchangeName, subEvent);
        });
      }
    });
  } else {
    throw new Error('Invalid RabbitMQ mode');
  }
};

export const removeQueues = (instanceName: string, events: string[]) => {
  if (!events || !events.length) return;

  const rabbitConfig = configService.get<Rabbitmq>('RABBITMQ');
  const rabbitMode = rabbitConfig.MODE || 'isolated';
  let exchangeName = rabbitConfig.EXCHANGE_NAME || 'evolution_exchange';

  const receivedEvents = events.map(parseEvtName);
  if (rabbitMode === 'isolated') {
    exchangeName = instanceName;
    receivedEvents.forEach((event) => {
      amqpChannel.assertExchange(exchangeName, 'topic', {
        durable: true,
        autoDelete: false,
      });

      const queueName = `${instanceName}.${event}`;
      amqpChannel.deleteQueue(queueName);
    });
    amqpChannel.deleteExchange(instanceName);
  }
};

interface SendEventData {
  instanceName: string;
  wuid: string;
  event: string;
  apiKey?: string;
  data: any;
}

export const sendEventData = async ({ data, event, wuid, apiKey, instanceName }: SendEventData) => {
  const rabbitConfig = configService.get<Rabbitmq>('RABBITMQ');
  let exchangeName = rabbitConfig.EXCHANGE_NAME || 'evolution_exchange';
  const rabbitMode = rabbitConfig.MODE || 'isolated';
  if (rabbitMode === 'isolated') exchangeName = instanceName;

  amqpChannel.assertExchange(exchangeName, 'topic', {
    durable: true,
    autoDelete: false,
  });

  let queueName = event;
  if (rabbitMode === 'single') {
    queueName = 'evolution';
  } else if (rabbitMode === 'global') {
    let eventName = '';

    Object.keys(globalQueues).forEach((key) => {
      if (globalQueues[key].includes(event as Events)) {
        eventName = key;
      }
      if (eventName === '' && key === 'others') {
        eventName = key;
      }
    });
    queueName = eventName;
  } else if (rabbitMode === 'isolated') {
    queueName = `${instanceName}.${event}`;
  }

  amqpChannel.assertQueue(queueName, {
    durable: true,
    autoDelete: false,
    arguments: { 'x-queue-type': 'quorum' },
  });
  amqpChannel.bindQueue(queueName, exchangeName, event);

  const serverUrl = configService.get<HttpServer>('SERVER').URL;
  const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
  const localISOTime = new Date(Date.now() - tzoffset).toISOString();
  const now = localISOTime;

  const message = {
    event,
    instance: instanceName,
    data,
    server_url: serverUrl,
    date_time: now,
    sender: wuid,
  };

  if (apiKey) {
    message['apikey'] = apiKey;
  }

  logger.log({
    queueName,
    exchangeName,
    event,
  });
  await amqpChannel.publish(exchangeName, event, Buffer.from(JSON.stringify(message)));
};
