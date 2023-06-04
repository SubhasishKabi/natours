class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    this.isOperational = true

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;

//When an error is thrown, the stack trace contains information about the sequence of function calls that led to the error.
//By default, this stack trace starts at the point where the error is thrown.

// However, by calling Error.captureStackTrace(), you can manipulate the stack trace to start at a specific point in your code, 
//rather than including the Error.captureStackTrace() call itself. This can be useful when you want to hide internal implementation details 
//or provide a more accurate representation of the error's origin.

// In the given code snippet, this refers to the current object instance, and this.constructor refers to the constructor function of that object. 
//By calling Error.captureStackTrace(this, this.constructor), you're capturing the stack trace for the current object, 
//starting from the point where the constructor function is invoked.
