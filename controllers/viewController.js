const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const asyncwrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/appError')
const User = require('../models/userModel')


const getOverview = asyncwrapper(async (req, res, next) => {
  const tours = await Tour.find(); //returns an array

  res.status(200).render('overview', {
    title: 'All tours',
    tours,
  });
});

const getTour = asyncwrapper(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if(!tour) {
    return next( new AppError('There is no tour with that name', 404))
  }


  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render('tour', {
      title: tour.name,
      tour,
    });
});

const getLoginForm = (req, res) => {
  res
    .status(200)
    .render('login', {
      title: 'Log in to your account',
    });
};

const signUpForm = (req, res) => {
  res
    .status(200)
    .render('signup', {
      title: 'Create your account',
    });
};

const getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account'
  })
}

const updateUserData =asyncwrapper( async (req, res, next) => {
  //console.log('UPDATING USER!!' ,req.body)

  const updatedUser = await User.findByIdAndUpdate(req.user.id, {
    name: req.body.name,
    email: req.body.email
  },
  {
    new: true,
    runValidators: true
  })

  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser
  })

})


const getMyTours = asyncwrapper( async (req, res, next) => {
  const bookings = await Booking.find({user: req.user.id}) 

  const tourIDs = bookings.map(el => el.tour)
  //console.log(tourIDs)
  const tours = await Tour.find({_id : {$in: tourIDs}})
  //console.log(tours)

  res.status(200).render('overview', {
    title: 'My Tours',
    tours 
  })

})


module.exports = { getOverview, getTour, getLoginForm , getAccount, updateUserData, getMyTours, signUpForm};
