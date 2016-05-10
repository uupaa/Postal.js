// Postal test

require("../../lib/WebModule.js");

WebModule.VERIFY  = true;
WebModule.VERBOSE = true;
WebModule.PUBLISH = true;

require("../../node_modules/uupaa.task.js/lib/Task.js");
require("../../node_modules/uupaa.task.js/lib/TaskMap.js");
require("../wmtools.js");
require("../../lib/Postal.js");
require("../../release/Postal.n.min.js");
require("../testcase.js");

