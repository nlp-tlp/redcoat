var envi = process.env.NODE_ENV || 'production';

const API_URL = envi === "development" ? "http://localhost:3000/api/" : "https://nlp-tlp.org/redcoat/api/";

export default API_URL;
