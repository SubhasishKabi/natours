const catchAsync = require('../utils/asyncWrapper');
const AppError = require('../utils/appError');
const asyncWrapper = require('../utils/asyncWrapper');
const APIFeatures = require('../utils/apiFeatures');
const { Model } = require('mongoose');

//--------------------DELETE HANDLEFACTORY-----------------------------------//

const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document was found with that ID', 404));
    }
    res.status(204).json({
      status: ' success',
      data: null,
    }); //postman will not display anything
  });

//-----------------UPDATE HANDLER FACTORY--------------------------------//

const updateOne = (Model) =>
  asyncWrapper(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    //console.log(tour);

    if (!doc)
      return next(new AppError('No document was found with that id', 404));

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

//------------------CREATE HANDLERFACTORY----------------------------//

const createOne = (Model) =>
  asyncWrapper(async (req, res, next) => {
    const doc = await Model.create(req.body); //{"name": "Test Tour 3 ", "Duration": 20, "difficulty": " very difficult", "price" : 1000, "rating": 3.2}//re.body in the postman
    res.status(201).json({
      status: 'success',
      data: {
        tour: doc,
      },
    });
  });

//----------------------------GETONE HANDLERFACTORY-------------------------------//

const getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id); //find the tour/review/user
    if (populateOptions) {
      query = query.populate(populateOptions); //populate that
    }

    const doc = await query;

    /*The above process is similar to this =>  const tour = await Tour.findById(req.params.id).populate('reviews')*/

    if (!doc) {
      return next(new AppError('No document was found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

///----------------------------GETALL DATA----------------------------------//////

const getAll = (Model) =>
  asyncWrapper(async (req, res, next) => {

    //this step is for the nested GET reviews. ie. all revies of a single tour
    let filter = {};

    if (req.params.tourId) {
      filter = {
        tour: req.params.tourId,
      };
    }
    //query       //querystring
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitfields()
      .paginate();
    const doc = await features.query //.explain()
    //const doc = await features.query.explain();

    //const tours = await Tour.find(query);
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        doc,
      },
    });
  });

module.exports = { deleteOne, updateOne, createOne, getOne, getAll };
