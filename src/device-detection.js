var video = document.getElementById('video')
var wavesurfer
$(function() {
  getUserMedia(
    {
      video: {
        width: { min: 240, ideal: 480, max: 1920 },
        height: { min: 160, ideal: 320, max: 1080 }
      }
    },
    function(stream) {
      if ('srcObject' in video) {
        video.srcObject = stream
      } else {
        var URL = window.URL || window.webkitURL
        video.src = URL.createObjectURL(stream)
      }
      video.onloadedmetadata = function(e) {
        video.play()
      }
    }
  )

  var $viewersBar = $('#viewersBar')
  $('#stepsBar').on('click', '.detection-step-item', function() {
    var index = $(this).index('.detection-step-item')
    $viewersBar.css('transform', 'translateX(-' + index + '00%)')

    if (!wavesurfer) {
      initMicrophoneWave()
    }
    // wavesurfer.microphone.play()
    // wavesurfer.microphone.pause()
  })

  $viewersBar.on('click', '.detect-speaker-button', function() {
    $(this).toggleClass('playing')
  })
  function changeSpeed() {
		var value = $('#range_speed').val();
		var valStr = value + "% 100%";
		$('#value1').html((value / 10).toFixed(1));
		$('#range_speed').css({
		  "background-size": valStr
		})
		$("input[name='animat_speed']").val((value / 10).toFixed(1));
	};
})

// 访问用户媒体设备
function getUserMedia(constrains, success) {
  // 在旧的浏览器中使用新的API
  !navigator.mediaDevices && (navigator.mediaDevices = {})
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      var getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia
      if (!getUserMedia) {
        return Promise.reject(
          new Error('getUserMedia is not implemented in this browser')
        )
      }
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  }

  navigator.mediaDevices
    .getUserMedia(constrains)
    .then(success)
    .catch(checkDevicesError)
}

// 初始化麦克风波纹显示效果
function initMicrophoneWave() {
  var context, processor
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  if (isSafari) {
    var AudioContext = window.AudioContext || window.webkitAudioContext
    context = new AudioContext()
    processor = context.createScriptProcessor(1024, 1, 1)
  }
  wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#3ed4ef',
    interact: false,
    cursorWidth: 0,
    maxCanvasWidth: 480 * 2,
    height: 150,
    barWidth: 1,
    barHeight: 2,
    audioContext: context || null,
    audioScriptProcessor: processor || null,
    plugins: [WaveSurfer.microphone.create()]
  })
  wavesurfer.microphone.start()
  wavesurfer.microphone.on('deviceReady', function(stream) {
    console.log('Device ready!', stream)
    $('#waveform')
      .next('.detect-mic-tips')
      .addClass('success')
      .text('已经成功检测到麦克风！')
  })
  wavesurfer.microphone.on('deviceError', checkDevicesError)
  wavesurfer.microphone.on('play', function() {
    console.log('play')
    $('#waveform').removeClass('paused')
  })
  wavesurfer.microphone.on('pause', function() {
    console.log('pause')
    $('#waveform').addClass('paused')
  })
}

function checkDevicesError(err) {
  console.error(err, err.name, err.message)
  switch (err.name) {
    case 'NotAllowedError':
      alert('访问媒体设备被拒，请先允许浏览器使用您的设备！')
      break
    case 'NotFoundError':
      alert('未发现媒体设备，请先检查您的设备链接是否正常！')
      break
    case 'NotReadableError':
      alert('无法访问媒体设备！')
      break
    default:
      alert('未发现媒体设备，请先检查您的设备链接是否正常！')
      break
  }
}

// 音频输出到耳麦或音响
function outputAudio(stream) {
  var AudioContext = window.AudioContext || window.webkitAudioContext
  if (AudioContext) {
    var audioCtx = new AudioContext()
    var source = audioCtx.createMediaStreamSource(stream)
    var biquadFilter = audioCtx.createBiquadFilter()
    biquadFilter.type = 'lowshelf'
    biquadFilter.frequency.value = 1000
    biquadFilter.gain.value = 25
    biquadFilter.connect(audioCtx.destination)
    source.connect(biquadFilter)
  } else {
    console.warn('Your browser does not support AudioContext!')
    alert('你的浏览器版本过低，建议升级到最新的！')
  }
}
