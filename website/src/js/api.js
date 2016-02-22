var $ = window.$;
var _ = window._;
var foundation = window.Foundation;
var url = window.url;
var NProgress = window.NProgress;

window.runAPI = function(self) {
    let $parent = $(self).parent().parent();
    let path = $parent.find("input").val();
    let $area = $parent.parent().find("textarea");

    $.get(path, result => {
        $area.val(JSON.stringify(result, null, "\t"));
    });
};
