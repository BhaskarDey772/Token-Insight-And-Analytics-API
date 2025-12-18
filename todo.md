1. Check import 'module-alias/register and _moduleAliases'; remove it. it is unnecessary
2. Remove mongodb from the  entire project(form docs as well as)
4. type validation inside controller, rather than middleware
5. remove unnecessary exports : export { app, startServer }; export default app; consider the test files. it is used there

6. Add name and version by importing package.json in server.ts (optional)
7. Remove all comments
8. Have to write the types of each api calls (extermly optional)