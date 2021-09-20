$(document).ready(function() {
	function logoutUser() {
		sessionStorage.clear();
	}
	$('#nav-user-logout').on('click', logoutUser);
});
