const Review = require('../models/reviewModel');
//const asyncWrapper = require('../utils/asyncWrapper');
//const AppError = require('../utils/appError');
const handlerFactory = require("./handlerFactory")



const setTourUserIds = (req,res,next) => {
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }

  if (!req.body.user) {
    req.body.user = req.user.id;
  }

  next()
}

const getAllReviews = handlerFactory.getAll(Review)

const creatReview = handlerFactory.createOne(Review)

const updateReview = handlerFactory.updateOne(Review)

const deleteReview = handlerFactory.deleteOne(Review)

const getOneReview = handlerFactory.getOne(Review,{path: 'user'})

module.exports = { getAllReviews, creatReview , deleteReview, updateReview,setTourUserIds, getOneReview}, getAllReviews;

/////--------------------------------------ROUGH---------------------------------------------///////////////

//this was used when we didn't use nested routes

// const creatReview = asyncWrapper(async (req, res, next) => {
//   if (req.body.user === req.user.id) {   //we found that if a user is logged in but he used the id of an admin in req.body, an review is created
//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//       status: 'success',
//       data: {
//         newReview,
//       },
//     });
//   } else{
//     next(new AppError('Id of the logged in user is not same as the one you provided', 401));
//   }
// });



//----------------------------CREATE REVIEW-----------------------------------//

// const creatReview = asyncWrapper(async (req, res, next) => {
//   if (!req.body.tour) {
//     req.body.tour = req.params.tourId;
//   }

//   if (!req.body.user) {
//     req.body.user = req.user.id;
//   }
//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       newReview,
//     },
//   });
// });



////----------------------------------GET ALL REVIEWS----------------------------------//////////////////////////

/*const getAllReviews = asyncWrapper(async (req, res, next) => {

  let filter = {}

  if(req.params.tourId){
    filter = {
      tour : req.params.tourId
    }
  }

  //if theres no params, we will get all the tours' reviews. this is general method to find a reviews
  //if theres is a param, we will only get that tour's revies

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews,
    },
  });
});*/