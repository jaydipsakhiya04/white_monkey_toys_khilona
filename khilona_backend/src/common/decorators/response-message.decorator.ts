import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';

/** Sets the human readable `message` of the success envelope for a handler. */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);
