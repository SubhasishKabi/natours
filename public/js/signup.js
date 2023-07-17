import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (name, email, password, passwordConfirm,) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });
    console.log(res);
    //console.log(data);
    if (res.data.status === 'success') {
      //this is the status we got in post man
      showAlert('success', 'Account created in successfully'); //we have created a div with class success in front-end
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    // console.log(err.config.data);
    // console.log(err.response.data.message);
    showAlert('error', err.response.data.message);
  }
};
