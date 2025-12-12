module.exports = function (app) {
  require("./../Routes/UserRoutes")(app);
  require("./../Routes/GPTModelRoutes")(app);
  require("./../Routes/ChatsRoutes")(app);
  require("./../Routes/AssistantRoutes")(app);
  require("./../Routes/FavoritesRoutes")(app);
  require("./../Routes/TokenHistoryRoutes")(app);
  require("./../Routes/AssignRoutes")(app);
  require("./../Routes/DepartmentRoutes")(app);
};
