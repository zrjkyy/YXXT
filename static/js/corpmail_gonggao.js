function initNotice() {
	// 公告内容
	var noticeJianti = "<div class='x'><a href='#' onclick='document.getElementById(\"gonggao\").style.display=\"none\"'>x</a></div><strong>尊敬的企业邮箱用户，您好！</strong><br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 为提供更优质的服务，我们将于2020年5月12日凌晨0:00～3:00对企业邮机房设备及网络进行维护，期间邮件系统个别IP会有几秒钟的短暂中断，不便之处，恳请给予理解。<br/><div style='text-align:right'>中国电信21CN企业邮箱运营中心<br/>2020年5月11日</div>";
	
	var notice = noticeJianti;
	// var notice = 'strong';

	// 自动隐藏时间格式：yyyy/mm/dd hh:MM:ss
	var hTimeStr = "2020/05/12 06:00:00";

	// 展示公告，并在规定时间后自动隐藏
	if (document.getElementById('langId2').value == "1") {
		notice = noticeFanti;
	}
	showNotice(notice, hTimeStr);
}
function showNotice(notice, hTimeStr) {
	var hideTime = new Date(hTimeStr).getTime();
	var currTime = (new Date()).getTime();
	if (hideTime > currTime) {
		document.getElementById("gonggao").innerHTML = notice;

		var interval = 150 * 1000;
		document.getElementById("gonggao").style.display = "block";
		setTimeout(hideNotice, interval);
	} else {
		hideNotice();
	}
}
function hideNotice() {
	document.getElementById("gonggao").innerHTML = "";
	document.getElementById("gonggao").style.display = "none";
}