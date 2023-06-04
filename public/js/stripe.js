import axios from 'axios';
import Stripe from 'stripe';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  //console.log('Booking tour');
  const stripe = Stripe(
    'pk_test_51NEXtVSCCdNvnVqQ4vw43NWNd8pV3Sf24p2QgwdqbZUsrfoUbP9rHTzHivYdehm3r2FYvFXl8vIS3A0nChUVtGIh00kiop6nC9'
  );
  //console.log(stripe);
  try {
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    //console.log(session);

    // redirect to checkout

    // await stripe.redirectToCheckout({
    //     sessionId: session.data.session.id
    // })

    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
