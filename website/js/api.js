const { $ } = window;

window.runAPI = function (self) {
	const $parent = $(self).parent().parent();
	const path = $parent.find('input').val();
	const $area = $parent.parent().find('textarea');

	$.get(path, (result) => {
		$area.val(JSON.stringify(result, null, '\t'));
	});
};
