var web = require('../util/web');
import {apiPaths} from "./paths";

web.app.get("/faq", function(req, res) {
    res.render("faq");
});

web.app.get("/api", function(req, res) {
    res.render("api", { paths: apiPaths });
});
