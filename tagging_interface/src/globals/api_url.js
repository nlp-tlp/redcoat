var envi = process.env.NODE_ENV || 'production';

const API_URL = "https://nlp-tlp.org/redcoat/api/";
if(envi === "development") {
	const API_URL = "http://localhost:3000/api/";
}

export default API_URL;
