const AppError = require('../utils/appError.js');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400); //the AppError errors have onlt this.isOperational property
};

const handleDuplicateErrorDB = (err) => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0]; //this is used to match values from a string.
  //console.log(value)

  const message = `Duplicate field value: ${value}. Please provide another value`;
  return new AppError(message, 400);
};
//'E11000 duplicate key error collection: natours.tours index: name_1 dup key: { name: "The Snow Adventurer" }'
//extracting "The snow adventure" from the above text
//const value will give an array containing the quotes text

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message); //Object.values() is an built in javascript method that returns an array containing the values of an object's enumerable properties

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  return new AppError('Invalid Token. Please login again', 401);
};

const handleJWTExpiredError = (err) => {
  return new AppError('Token Expired. Please login again', 401);
};

//DEVELOPMENT error
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    //for backend . ie postman
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    //for frontend. ie rendering webpages
    console.error('ERROR!!!', err);

    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

//PRODUCTION errors

const sendErrorProd = (err, req, res) => {

  // 1) BAckend error handling

  if (req.originalUrl.startsWith('/api')) {
    // 1) Operational , trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // 2)programming or other errors. dont leak details
    console.error('ERROR!!!', err);

    //send generic message
    return res.status(500).json({
      status: 'error',
      message: 'something went very wrong',
    });
  }

  //Front end error handling i.e rendering webpages

  if(err.isOperational){
    //1) operational error and hence can leak details
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    })
  }

  // 2) Programming error. do not leak details
  console.error('ERROR', err)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again'
  })
};

const GlobalErrorHandler = (err, req, res, next) => {
  //console.log(err.name);
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //let error = {...err};

    if (err.name === 'CastError') {
      //this is not a validaton error
      err = handleCastErrorDB(err);
    }

    if (err.code === 11000) {
      err = handleDuplicateErrorDB(err); //unique is not a validaton error
    }

    if (err.name === 'ValidationError') {
      err = handleValidationErrorDB(err);
    }

    if (err.name === 'JsonWebTokenError') err = handleJWTError(err);

    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError(err);

    sendErrorProd(err, req, res);
  }
};

module.exports = GlobalErrorHandler;

//ERR.STACK

// Error: cant find /api/v1/to on the server
//     at C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\app.js:55:8
//     at Layer.handle [as handle_request] (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\layer.js:95:5)
//     at next (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\route.js:144:13)
//     at next (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\route.js:140:7)
//     at next (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\route.js:140:7)
//     at next (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\route.js:140:7)
//     at next (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\route.js:140:7)
//     at next (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\route.js:140:7)
//     at next (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\route.js:140:7)
//     at Route.dispatch (C:\Users\91760\Desktop\complete-node-bootcamp-master\4-natours\starter\node_modules\express\lib\router\route.js:114:3)
