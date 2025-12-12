const log = require("../Startup/Logs");

function logger(app) {
  app.use((req, res, next) => {
    const startTime = new Date();

    // Log the request method and path
    log.info(`API Request: ${req.method} ${req.path}`);

    // Log the query parameters (if any)
    if (Object.keys(req.query).length > 0) {
      log.info(`Query Parameters: ${JSON.stringify(req.query)}`);
    }

    res.on("finish", () => {
      // Log the response time
      const endTime = new Date();
      const elapsedTime = endTime - startTime;
      log.info(`Response Time: ${elapsedTime}ms`);
    });

    next();
  });
}

module.exports = logger;
