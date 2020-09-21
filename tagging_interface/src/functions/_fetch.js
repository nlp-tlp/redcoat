// Config for all API fetch requests
const fetchConfig = {
  "GET": {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
  },
}


async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// A function to make fetching a little bit easier and avoid a lot of repeated code.
// This one returns data only when there wasn't an error.
// Returns 500 error if anything unexpected happens.
async function _fetch(url, method, setErrorCode, delay=0) {

  console.log(url);
  var response = await fetch(url, fetchConfig[method]) // TODO: move localhost out
  
  if(response.status !== 200) {
    var errorCode = parseInt(response.status)
    setErrorCode(errorCode);
    return Promise.resolve(new Error(errorCode));
  }  
  var data = await response.text();
  try {
    var d = JSON.parse(data);
    await wait(delay);
    return Promise.resolve(d); 
  } catch(err) {
    console.log(err);
    setErrorCode(500);
    return Promise.reject(new Error(500));
  }
}

export default _fetch;
