const config = {
  baseUrl:
    process.env.NODE_ENV === "production" ? "unknown" : "http://localhost:8000",
};

export default config;
