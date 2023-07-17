const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncWrapper = require('../utils/asyncWrapper');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const handlerFactory = require('./handlerFactory');

const getcheckoutSession = asyncWrapper(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, //it is a query string
    //success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`http://www.natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });

  // 3) Create session as response

  res.status(200).json({
    status: 'success',
    session,
  });
});

const createBookingCheckout = asyncWrapper( async (req, res, next) => {

  const {tour, user, price}= req.query //here tour is the object id

  if(!tour && !user && !price){
    return next()
  }

  await Booking.create({tour, user, price})

  res.redirect(req.originalUrl.split('?')[0])

})

// const createBookingCheckout = async (session) => {

//   const tour = session.client_reference_id
//   const user = (await User.findOne({email: session.customer_email})).id
//   const price = session.line_items[0].price_data.unit_amount/100
//   await Booking.create({tour, user, price}) 

// };

// const webhookCheckout = (req, res, next) => {
//   const signature = req.headers['stripe-signature']; 

//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body, 
//       signature,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     return res.status(400).send(`Webhook error: ${err.message}`);
//   }

//   if (event.type === 'checkout.session.completed') {
//     createBookingCheckout(event.data.object);
//   }

//   res.status(200).json({recieved: true})
// };

const createBooking = handlerFactory.createOne(Booking);
const getBooking = handlerFactory.getOne(Booking);
const getAllBooking = handlerFactory.getAll(Booking);
const updateBooking = handlerFactory.updateOne(Booking);
const deleteBooking = handlerFactory.deleteOne(Booking);

module.exports = {
  getcheckoutSession,
  createBookingCheckout,
  createBooking,
  getBooking,
  getAllBooking,
  updateBooking,
  deleteBooking,
  // webhookCheckout,
};
