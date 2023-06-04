const express = require('express');
//const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

//start express app
const app = express();

app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://*.mapbox.com'],
      scriptSrc: [
        "'self'",
        'cdnjs.cloudflare.com',
        'https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js',
        'http://localhost:3000/worker.js',
        'https://js.stripe.com/v3/',
        "'unsafe-inline'",
        "'unsafe-eval'",
      ],
      connectSrc: [
        "'self'",
        'http://localhost:3000',
        'ws://localhost:51442/',
        'ws://localhost:50243/',
        'blob:',
      ],
    },
  })
);

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'ws://localhost:50243/',
    'ws://localhost:51442/',
  ],
  credentials: true,
};

app.use(cors(corsOptions));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public'))); //loclahost:3000/overview.html

//The line app.use(helmet()) uses the Helmet middleware to secure your Express application.
//Helmet is a JavaScript library that helps you secure your Express application by setting several HTTP headers.
//It acts as a middleware for Express and similar technologies, automatically adding or removing HTTP headers to comply with web security standards.

//console.log(process.env.NODE_ENV)

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//GET /api/v1/tours 200 3.630 ms - 15080. dev returns this

//Global middlewares

//limit requests from the same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});

app.use('/api', limiter);

//Body parsers reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//data sanitization against NoSQl query injection

app.use(mongoSanitize());
// {
//   // "email": {"$gt": ""},
//   // "password": "pass12345" we can login with this AND to prevent this we need data sanitization
// }

app.use(xss());
//this will clean any user input malicious html codes

app.use(
  hpp({
    whiteList: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxgroupSize',
      'difficulty',
      'price',
    ],
  })
);
//prevents parameter pollution

app.use(compression());

/*

app.use((req, res, next) => {
  //console.log('Hello from the middleware!!');
  console.log(req.cookies);
  next();
});

*/

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(`Request received at: ${req.requestTime}`);
  //console.log(req.headers)
  next();
});

// ROUTES FOR SERVER SIDE RENDERING

app.use('/', viewRouter);

//routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//Error Handling

app.all('*', (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on the server`, 404));
});

//global error handling middleware

app.use(globalErrorHandler);

module.exports = app;

//meta(http-equiv="Content-Security-Policy", content="default-src 'self' https://*.mapbox.com; connect-src 'self' ws://localhost:50243/ https://api.mapbox.com; script-src 'self' cdnjs.cloudflare.com api.mapbox.com https://js.stripe.com ; worker-src 'self' blob:; img-src 'self' data: https://*.mapbox.com",)

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'", 'https://*.mapbox.com'],
//       scriptSrc: [
//         "'self'",
//         'cdnjs.cloudflare.com',
//         'https://api.mapbox.com',
//         'https://js.stripe.com',
//         'https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.js',
//         'http://localhost:3000/worker.js',
//       ],
//       connectSrc: [
//         "'self'",
//         'http://localhost:3000',
//         'ws://localhost:51442/',
//         'ws://localhost:50243/',
//         'blob:',
//       ],
//     },
//   })
// );

//meta(http-equiv="Content-Security-Policy", content="default-src 'self' https://*.mapbox.com; connect-src 'self' ws://localhost:50243/ https://api.mapbox.com; script-src 'self' cdnjs.cloudflare.com api.mapbox.com https://js.stripe.com/v3 ; worker-src 'self' blob:; img-src 'self' data: https://*.mapbox.com",)
