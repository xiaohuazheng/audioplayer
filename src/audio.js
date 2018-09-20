/*
 * $(selector).initAudioPlayer();
 * 不支持自动播放-想了下，用播放器样式的一般都不自动播放，影响用户体验。一般要自动播放的都不需要进度条之类的，需要一个切换按钮即可。
 * 不支持audio的浏览器直接return
 */

;(function($, window, document, undefined) {
	// 播放器样式 - 替换到css更改样式即可
	if (!$('#ppq-audio-player-style').length) {
		var style = '<style id="ppq-audio-player-style" type="text/css">\
			html{font-size:14px}\
			body{margin:0;padding:0;border:0;word-wrap:break-word;word-break:break-all;-webkit-text-size-adjust:100%;-moz-text-size-adjust:100%;-ms-text-size-adjust:100%;text-size-adjust:100%;}\
			a, button, input, select, textarea{-webkit-tap-highlight-color:transparent}\
			ol, ul {list-style:none;}\
			.audio-hidden{width:0;height:0;visibility:hidden}\
			.ppq-audio-player .play-pause-btn .play-pause-icon:after{position:absolute;top:50%;left:50%;-webkit-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%)}\
			.ppq-audio-player .play-pause-btn .play-pause-icon:after,.ppq-audio-player.player-playing .play-pause-icon:after{background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAASCAMAAADrP+ckAAABNVBMVEUAAAAAmIcAmYgAm4sAnIsAnIwAnI0AnY0AnY4Ano4Ano8An5AAoJEAoZEAoZIAopMBn5ABoJABoJEBoZEBoZIBoZMBopMCoZICopMCopQCo5QDoJEDoZEDo5QDo5UFopMGo5QKpJYLpJYMpZcMppgNpZcNppgNp5gOppcOppgOp5gOp5kQqJoSp5kSqJoTqZsbrJ4drJ8irZ8mrqEnsKMrsqUtsqYytKg0tak5t6tHvLJJvbNLvbNqycBrysFsycFwy8Jwy8N3zsZ+0MiA0cqD0suH1M2L1c6P1tCk3tmm39mv4t285+PE6ebH6ufN7erS7+zV7+3W8O3X8O7a8u/k9fPs+Pft+Pfx+fjx+fnx+vny+vr1+/v2+/v5/fz7/f38/f38/v38/v79/v7+/v7+//////+ALAV1AAAAAXRSTlMAQObYZgAAATxJREFUKM+F0tlWwjAQBuAgQgHTRFFrqaK4IALiiuKugPsKrqUo0DbO+z+CDYHIFZ279nznP3P+DHLh4+L8HWybAQM+qDdlUgGXMRcqpIwYnIwoG7ct6LjAfgdUKlZoAmPQLMRSCBrLZH4idPAEbqcb11eamm1w1ciqGgJrFVPNiMydfkLH8X5LhXMWV1YOc7WCKSGGHty6A9Z2ZRbFGaEymApFKaHJceXoFRxnmPKcZoQXL79huPLijKng/ouP4nFJZcdXUWJML/gpLyo6du2zPTUmQ3uPw7cnWiK8dPUDzn+rUvVaFXUdv4Fjy+51nBcqj3XxQl71o9v33eqlipO0yZWZJnEE5pqqJZTZsy/xjHKvYqBk82+7FCgiaO1GZqKHz/2TkKpWrYv7qldryIGH9c2bFrR75yXV4PwBrZh1OjRqx9oAAAAASUVORK5CYII=);background-size:37px 18px}\
			.ppq-audio-player{line-height:111px;position:relative;overflow:hidden;height:111px;margin:0 auto;background:#f4f4f4}\
			.ppq-audio-player audio{position:absolute;vertical-align:baseline}\
			.ppq-audio-player .play-pause-btn{float:left;margin:29px 0 0 12px}\
			.ppq-audio-player .play-pause-btn .play-pause-icon{position:relative;display:block;width:47px;height:47px;border:3px solid #00a293;border-radius:100%;background-color:#fff}\
			.ppq-audio-player .play-pause-btn .play-pause-icon:after{display:block;content:"";background-position:0 0;width:17px;height:18px}\
			.ppq-audio-player.player-playing .play-pause-icon:after{background-position:-25px 0;width:12px;height:17px}\
			.ppq-audio-player .player-time{float:left;width:51px;margin-right:8px;text-align:right}\
			.ppq-audio-player .player-time-duration{float:right;margin:0 0 0 8px;text-align:left}\
			.ppq-audio-player .player-bar{position:relative;overflow:hidden;height:5px;margin-top:53px;background-color:#fff}\
			.ppq-audio-player .player-bar .player-bar-loaded{position:absolute;top:0;left:0;width:100%;height:100%;border-radius:3px;background:#ddd}\
			.ppq-audio-player .player-bar .player-bar-played{position:absolute;top:0;left:0;width:0;height:100%;border-radius:3px;background:#00a293}\
			</style>';
		$('body').prepend(style);
	}

	var onMobile = 'ontouchstart' in window,
		eStart = onMobile ? 'touchstart' : 'mousedown',
		eMove = onMobile ? 'touchmove' : 'mousemove',
		eCancel = onMobile ? 'touchcancel' : 'mouseup',
		hackPrefixes = ['webkit', 'moz', 'ms', 'o'],
		hackHiddenProperty = getHackHidden();

	$.fn.initAudioPlayer = function() {
		// 遍历处理audio
		this.each(function() {
			if ($(this).prop('tagName').toLowerCase() !== 'audio') {
				return;
			}

			var $this = $(this),
				file = $this.attr('src'),
				isSupport = false;

			if (canFilePlay(file)) {
				isSupport = true;
			} else {
				$this.find('source').each(function() {
					if (canFilePlay($(this).attr('src'))) {
						isSupport = true;
						return false;
					}
				});
			}

			if (!isSupport) {
				return;
			}

			// 添加播放器盒子
			var $player = $('<div class="ppq-audio-player">' + $('<div>').append($this.eq(0).clone()).html() + '<div class="play-pause-btn"><a href="javascript: void(0);" class="play-pause-icon"></a></div></div>'),
				audioEle = $player.find('audio')[0];

			$player.find('audio').addClass('audio-hidden');
			$player.append('<div class="player-time player-time-current"></div>\
				<div class="player-time player-time-duration"></div>\
				<div class="player-bar">\
					<div class="player-bar-loaded"></div>\
					<div class="player-bar-played"></div>\
				</div>');

			var $bar = $player.find('.player-bar'),
				$played = $player.find('.player-bar-played'),
				$loaded = $player.find('.player-bar-loaded'),
				$current = $player.find('.player-time-current'),
				$duration = $player.find('.player-time-duration');

			$current.html('00:00');
			$duration.html('&hellip;');

			initAudioEvents();
			bindPageEvents();
			$this.replaceWith($player);

			function initAudioEvents() {
				// 监听loadeddata，渲染进度条和时间
				audioEle.addEventListener('loadeddata', function() {
					var loadTimer = setInterval(function() {
						if (audioEle.buffered.length < 1) {
							return true;
						}
						$loaded.width((audioEle.buffered.end(0) / audioEle.duration) * 100 + '%');
						if (Math.floor(audioEle.buffered.end(0)) >= Math.floor(audioEle.duration)) {
							clearInterval(loadTimer);
						}
					}, 100);
					$duration.html($.isNumeric(audioEle.duration) ? convertTimeStr(audioEle.duration) : '&hellip;');
				});

				// 监听timeupdate，更新时间和进度条
				audioEle.addEventListener('timeupdate', function() {
					$current.html(convertTimeStr(audioEle.currentTime));
					$played.width((audioEle.currentTime / audioEle.duration) * 100 + '%');
				});

				// 监听ended，播放完恢复暂停状态
				audioEle.addEventListener('ended', function() {
					$player.removeClass('player-playing').addClass('player-paused');
				});
			}

			function bindPageEvents() {
				// 监听进度条touch，更新进度条和播放进度
				$bar.on(eStart, function(e) {
					audioEle.currentTime = getCurrentTime(e);
					$bar.on(eMove, function(e) {
						audioEle.currentTime = getCurrentTime(e);
					});
				}).on(eCancel, function() {
					$bar.unbind(eMove);
				});

				// 监听播放暂停按钮click
				$player.find('.play-pause-btn').on('click', function() {
					if ($player.hasClass('player-playing')) {
						$player.removeClass('player-playing').addClass('player-paused');
						audioEle.pause();
					} else {
						$player.addClass('player-playing').removeClass('player-paused');
						audioEle.play();
					}
					return false;
				});
			}

			function getCurrentTime(e) {
				var et = onMobile ? e.originalEvent.touches[0] : e;
				return Math.round((audioEle.duration * (et.pageX - $bar.offset().left)) / $bar.width());
			}

			if (hackHiddenProperty) {
			    var evtname = hackHiddenProperty.replace(/[H|h]idden/, '') + 'visibilitychange';
			    document.addEventListener(evtname, function() {
			        if (isHidden() || getHackVisibilityState() === 'hidden') {
			        	$player.removeClass('player-playing').addClass('player-paused');
			        	audioEle.pause();
			        }
			    }, false);
			}

			window.addEventListener('beforeunload', function() {
			    $player.removeClass('player-playing').addClass('player-paused');
			    audioEle.pause();
			}, false);
		});
		return this;
	}

	// 秒转为时间字符串
	function convertTimeStr(secs) {
		var m = Math.floor(secs / 60),
            s = Math.floor(secs - m * 60);
        return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
	}

	// 判断文件能不能播放
	function canFilePlay(file) {
		if (!file) {
			return false;
		}
		var media = document.createElement('audio');
		if (typeof media.canPlayType !== 'function') {
			return false;
		}

		var res = media.canPlayType('audio/' + file.split('.').pop().toLowerCase());
		return res === 'probably' || res === 'maybe';
	}

	function getHackHidden() {
	    if ('hidden' in document) {
	    	return 'hidden';
	    }
	    for (var i = 0; i < hackPrefixes.length; i++) {
	        if ((hackPrefixes[i] + 'Hidden') in document) {
	            return hackPrefixes[i] + 'Hidden';
	        }
	    }
	    return null;
	}
	
	function getHackVisibilityState() {
	    if ('visibilityState' in document) {
	    	return 'visibilityState';
	    }
	    for (var i = 0; i < hackPrefixes.length; i++) {
	        if ((hackPrefixes[i] + 'VisibilityState') in document) {
	            return hackPrefixes[i] + 'VisibilityState';
	        }
	    }
	    return null;
	}
	
	function isHidden() {
	    var hide = getHackHidden();
	    if (!hide) {
	    	return false;
	    }
	
	    return document[hide];
	}
})(jQuery, window, document);