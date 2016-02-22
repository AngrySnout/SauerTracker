require("./about");
require("./servers");
require("./server");
require("./metrics");
require("./games");
require("./game");
require("./players");
require("./player");
require("./clans");
require("./clan");
require("./profile");
require("./help");
require("./stats");
try {
    // compat.js provides backwards compatibily for certain routes, and is not necessary for the Tracker
    require("./compat");
} catch (e) {}
