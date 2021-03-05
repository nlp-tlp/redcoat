import getCookie from 'functions/getCookie';
import API_URL from 'globals/api_url';

const csrfToken = getCookie('csrf-token');
var FileDownload = require('js-file-download');



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
  "POST": {
    method: 'POST',
    headers: {
      'csrf-token': csrfToken,
      //'Content-Type': 'application/json',
      'Accept': 'application/json',
      //'Content-Type': 'multipart/form-data',
    },
    dataType: "json",
    body: null,
  }
}




async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// A function to make fetching a little bit easier and avoid a lot of repeated code.
// This one returns data only when there wasn't an error.
// Returns 500 error if anything unexpected happens.
// Todo: fix the args... but to do that I'd have to change all calls of this :()
async function _fetch(url, method, setErrorCode, postBody=null, fileUpload=false, delay=0, fileDownload=false, fileDownloadName=null) {

  

  var fetchConf = {... fetchConfig[method] };
  if(method === "POST") {
    if(!postBody) throw new Error("Cannot POST without post body");
    if(fileUpload) {
      fetchConf.body = postBody;
      delete fetchConf.headers;
      fetchConf.headers = {'csrf-token' : csrfToken};
    } else {

      fetchConf.body = JSON.stringify(postBody);
      fetchConf.headers['Content-Type'] = 'application/json';      
    }    
  }

  
  var response = await fetch(API_URL + url, fetchConf) // TODO: move localhost out
  if(response.status !== 200) {
    var errorCode = parseInt(response.status)
    setErrorCode(errorCode);
    return Promise.resolve(new Error(errorCode));
  }  
  var data = await response.text();

  if(fileDownload) {
    FileDownload(data, fileDownloadName);
    return Promise.resolve();
  }

  console.log(data)
  try {
    var d = JSON.parse(data);
    //await wait(delay);
    return Promise.resolve(d); 
  } catch(err) {
    console.log(err);
    setErrorCode(500);
    return Promise.reject(new Error(500));
  }
}

export default _fetch;
