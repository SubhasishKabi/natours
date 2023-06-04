const express = require('express');
const router = express.Router();
//const fs = require('fs');

const tourController = require('../controllers/toursController');
const authController = require('../controllers/authController');
//const reviewController = require('../controllers/reviewController')

const reviewRouter = require('../routes/reviewRoutes');

// NESTED ROUTES

router.use('/:tourId/reviews', reviewRouter);

//router.get('/tours-within/:distance/center/:latlng/unit/:unit',tourController.getToursWithin). //This is the same as below

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);


router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances)  

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlans
  );

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
//.post(checkBody, tourController.createTour);
//.post(tourController.checkBody,  tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourPhotos,
    tourController.resizeTourPhotos,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

// router
//   .route('/:tourId/reviews')
//   .post(authController.protect,authController.restrictTo('user'), reviewController.creatReview)

/*This is confusing and messy as we put a route for creating a review inside a "tour" router. Hence we will use nested routes(using middlewares*/

module.exports = router;

// app.get('/api/v1/tours', getAllTours);

// app.post('/api/v1/tours', createTour);

// app.get('/api/v1/tours/:_id', getSingleTour);

// app.patch('/api/v1/tours/:_id', updateTour);

// app.delete('/api/v1/tours/:_id', deleteTour);

//---------------------------------------------------------------------------------------------------------------------------------------/////////////
//param middleware

// router.param('_id', (req, res, next, val) => {
//   console.log(`Tour id is: ${val}`);
//   if (req.params._id > tourController.tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// });

//create tour middleware

// const checkBody = (req, res, next) => {
//   if(!req.body.name || !req.body.price){
//     return res.status(400).json({
//       status: "fail",
//       Message: "Missing name or price"
//     })
//   }
//   next()
// }

//router.param('_id', tourController.checkID)

//we were trying to import checkID from tourController.js. but there was some problem. hence we used it directly

// exports.checkID = (req, res, next, val) =>{
//     //const id = req.params._id ;
//     console.log(`Tour id is: ${val}`)

//     if (req.params._id  > tours.length) {
//       return res.status(404).json({
//         status: 'fail',
//         message: 'Invalid ID',
//       });

//     }
//     next();

// }
