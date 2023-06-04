//START SERVER

const mongoose = require('mongoose');

const dotenv = require('dotenv');

process.on('uncaughtException', err=>{
  //console.log(err)
  console.log(err.name, err.message)
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down")
    process.exit(1)
}) 


dotenv.config({ path: './config.env' });

const app = require('./app.js');

const connectionString = process.env.DATABASE_URI.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    //useCreateIndex: true,
    // useFindAndModify: true,
    useUnifiedTopology: true,
    //findOneAndUpdate: true
  })
  .then(console.log('Connection Successful....'));
//console.log(process.env) //everything inside config.env will be shown.  A big result will be shown and all these will be present inside it



 

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`server is listening on port ${port}`);
});

process.on('unhandledRejection', err=>{
  console.log(err.name, err.message)
  console.log("UNHANDLED REJECTION!! 💥 Shutting down")
  server.close(()=>{
    process.exit(1)
  })
}) 




//console.log(x)



