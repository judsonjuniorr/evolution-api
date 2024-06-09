import { JSONSchema7 } from 'json-schema';
import { v4 } from 'uuid';

import { Events } from './validate.schema';

const isNotEmpty = (...propertyNames: string[]): JSONSchema7 => {
  const properties = {};
  propertyNames.forEach(
    (property) =>
      (properties[property] = {
        minLength: 1,
        description: `The "${property}" cannot be empty`,
      }),
  );
  return {
    if: {
      propertyNames: {
        enum: [...propertyNames],
      },
    },
    then: { properties },
  };
};

export const webhookSchema: JSONSchema7 = {
  $id: v4(),
  type: 'object',
  properties: {
    enabled: { type: 'boolean' },
    url: { type: 'string' },
    webhookByEvents: { type: 'boolean' },
    webhookBase64: { type: 'boolean' },
    events: {
      type: 'array',
      minItems: 0,
      items: {
        type: 'string',
        enum: Events,
      },
    },
  },
  required: ['enabled', 'url'],
  ...isNotEmpty('enabled', 'url'),
};