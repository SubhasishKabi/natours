const crypto = require('crypto');
const User = require('../models/userModel');
const { promisify } = require('util');
const asyncWrapper = require('../utils/asyncWrapper');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

//CREATE a JWT token

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    //{id: id} can be written as only {id}
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// SEND THE JWT TOKEN AS A RESPONSE

// What is a cookie??? It is a small piece of text that the server can send to client  and when the client recieves the cookie, it wil automatically
//save and send it back along with all future requests to the same server

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.cookie('jwt', token, cookieOptions);

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.password = undefined; //hides the password but the password remains the same

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const signup = asyncWrapper(async (req, res, next) => {
  //const newUser = await User.create(req.body) //we create a new user using all the data coming with the body . the problem is anyone can specify the role as an admin
  //i.e everyone can basically register as an admin. this is a serious security flaw

  console.log(req.body)
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password, //when we are signed up, we are already login
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt, 
    photo: req.body.photo,
    role: req.body.role,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  const token = signToken(newUser._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  newUser.password = undefined;

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });

  //createSendToken(newUser, 201, res)
});

///----------------------------------------LOGIN--------------------------------------////////////////

const login = asyncWrapper(async (req, res, next) => {
  //const email = req.body.email
  const { email, password } = req.body;

  //1) Check email and password exist or not'

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 404));
  }

  const user = await User.findOne({ email }).select('+password'); //explicitly selects password altough we have hidden password in the schema
  // console.log(user.id) //64690ddcf202478624571f78
  // console.log(user._id) //new ObjectId("64690ddcf202478624571f78")

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or Password', 401));
  }

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});

//////-----------------------------------------PROTECT-----------------------------------------/////////////////////

const protect = asyncWrapper(async (req, res, next) => {
  //1) Getting token and check if it's there

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //console.log(token);
  //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0Njc5YjY1MDk5ZjRlYzZjZWRmZDg5NSIsImlhdCI6MTY4NDUxNTk2MCwiZXhwIjoxNjkyMjkxOTYwfQ.oTgxh96kOF91ZsvDbkZaI

  if (!token) {
    return next(new AppError('You are not logged in! Please log in.', 401));
  }

  //2) verification of token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);
  //{ id: '64679b65099f4ec6cedfd895', iat: 1684515960, exp: 1692291960 }

  //3)check if user still exists or not

  //this is the situation if sometimes the token gets stolen and the user then deletes the account

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does not exist', 401)
    );
  }

  //4) Check if user changed password after token was issued

  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Login again', 401)
    );
  }

  req.user = currentUser; //req.user is a built in javascript property
  res.locals.user = currentUser; //this is to pass the values into pug template

  //console.log(req.user)

  next();
});

///-----------------------------------------IF USER IS LOGGED IN---------------------------------------////

const isloggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //console.log(decoded);
      //{ id: '64679b65099f4ec6cedfd895', iat: 1684515960, exp: 1692291960 }

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next(); //in this case user is not logged in
      }

      //4) Check if user changed password after token was issued

      if (currentUser.passwordChangedAfter(decoded.iat)) {
        return next(); //in this case user is not logged in
      }

      res.locals.user = currentUser;
      //console.log(res.locals.user)
      //we can access .user variable in the pug template by this method
      // i.e we can say passing data to pug template
      return next();
    } catch (error) {
      return next();
    }
  }

  next();
};

////------------------------------------------LOG OUT----------------------------------------------------------/////////////////

const logout = (req, res) => {
  res.cookie('jwt', 'logged out', {
    //send a random text as a token istead of the original token
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

////-------------------------------------------AUTHORIZE--------------------------------------//////////////////////

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have the permission to perform this action',
          403
        )
      );
    }
    next();
  };
};

////////////////-----------------FORGOT PASSWORD-------------------------------------/////////////////////////////

const forgotPassword = asyncWrapper(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  // 2) Generate the random reset token

  const resetToken = user.createPasswordResetToken(); //this token is not same as jwt also this token is. this function creates two new fields. reset token and reset expires
  await user.save({ validateBeforeSave: false });

  // 3) send it to mail

  //console.log(resetURL)

  //console.log(message)

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your Password reset token (VALID FOR 10 mins)',
    //   message,
    // });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error send the email. Try again later', 500)
    );
  }
});

////////////-----------------------------------RESET PASSWORD------------------------------------------------------//////////////////////////

const resetPassword = asyncWrapper(async (req, res, next) => {
  // 1) Get User based on the token

  const hashedToken = crypto //the password reset token is not the same as jwt token
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 404));
  }

  user.password = req.body.password; //password reset
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined; // the reset token and its expiry field was deleted after updating
  user.passwordResetExpires = undefined; // these two fields are created after forgotPassword is used

  await user.save();

  // 3) Update passwordChangedA property for the user

  // 4) Log the user in and send the JWT

  // const token = signToken(user._id); //jwt is sent
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });

  createSendToken(user, 200, res);
});

//////////////////////------------------------------------UPDATE PASSWORD---------------------------------------//////////////////////////

const updatepassword = asyncWrapper(async (req, res, next) => {
  //1) Get user from the collection

  const user = await User.findById(req.user.id).select('+password'); //same as req.user._id

  // 2) Check if the posted Current Password is correct

  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current Password is wrong', 401));
  }

  // 3) If so, update the password

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4) Log user in, send JWT

  createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatepassword,
  isloggedIn,
  logout,
};
