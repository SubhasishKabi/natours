import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  console.log(email, password);
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    console.log(res);
    console.log(data);
    if (res.data.status === 'success') {
      //this is the status we got in post man
      showAlert('success', 'Logged in successfully'); //we have created a div with class success in front-end
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      // status we have written in the backend
      showAlert('success', 'Logged out successfully');
      location.reload(true);
    }
  } catch (error) {
    showAlert('error', 'Error logging out. Try again ');
  }
};
