# Chassis

> Every bot needs one. :white_square_button:

___

## Install

`npm i -S @geut/chassis`

## Usage

```javascript
import {Chassis, EVENTS} from '@geut/chassis';
import SlackService from '@geut/chassis-slack-service';

const credentials = process.env.SLACK_CREDENTIALS;

Chassis.register(
    {
        register: SlackService,
        options: {
            credentials
        }
    }
);

Chassis.sense(EVENTS.message.on, (text, channel) => {
    console.log(`Hi Msg received`)
});

Chassis.trigger('Hi there!', 'aChannel');
```


## API

## Lifecycle

- `onPreStart` - Chassis event
- `onStart` - Chassis event
- `onPostStart` - Chassis event
- `onPreMessageReceived` - Message service event
- `onMessageReceived` - Message service event
- `onPostMessageReceived` - Message service event
- `onPreMessageSent` - Message service event
- `onMessageSent` - Message service event
- `onPostMessageSent` - Message service event
- `onPreStop` - Chassis event
- `onStop` - Chassis event
- `onPostStop` - Chassis event

It is recommended to access lifecycle events through the EVENTS constants. Eg:

```javascript
importe {Chassis, EVENTS} from '@geut/chassis';

// initialize Chassis...

Chassis.on(EVENTS.message.receive.on, cb);
```

## Examples

:soon: In the meantime you can take a look at [Charly](/packages/charly), the official GEUT bot


A [**GEUT**](https://geutstudio.com) project
