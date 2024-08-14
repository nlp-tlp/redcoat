var envi = process.env.NODE_ENV || "production";

const API_URL =
  envi === "development"
    ? "http://localhost:3000/api/"
    : "http://localhost:5000/api/";

export default API_URL;
