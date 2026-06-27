import { setGlobalOptions } from 'firebase-functions/v2';

setGlobalOptions({
  region: 'asia-south1',
  maxInstances: 20,
});

export { setUserRole } from './callable/setUserRole.js';
export { createBooking } from './callable/createBooking.js';
export { acceptBooking } from './callable/acceptBooking.js';
export { placeBid } from './callable/placeBid.js';
export { chooseWinner } from './callable/chooseWinner.js';
export { updateBookingStatus } from './callable/updateBookingStatus.js';
