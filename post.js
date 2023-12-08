const axios = require('axios');

const data = {
  key: 'value'
};

axios.post('https://calendarp-production.up.railway.app/update_xlsx')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
