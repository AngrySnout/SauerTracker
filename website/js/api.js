var $ = window.$;

window.runAPI = function(self) {
	let $parent = $(self).parent().parent();
	let path = $parent.find('input').val();
	let $area = $parent.parent().find('textarea');

	$.get(path, result => {
		$area.val(JSON.stringify(result, null, '\t'));
	});
};
