const si = require('systeminformation');

si.users()
    .then(data => {
        console.log('Users data:', JSON.stringify(data, null, 2));
    })
    .catch(error => console.error(error));
