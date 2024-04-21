const axios = require('axios');

const data = {
  key: 'value'
};
//https://calendarp-production.up.railway.app/update_xlsx
axios.post('localhost:3001/update_xlsx_new')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });
