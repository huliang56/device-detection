var cameraVideo = document.getElementById('cameraVideo')
var $stepsBar = $('#stepsBar')
var $viewersBar = $('#viewersBar')
var wavesurfer

var audioPlayer = new Audio()
audioPlayer.volume = 0.5
audioPlayer.src = 'src/audio.mp3'
audioPlayer.addEventListener('ended', function() {
  $viewersBar.find('.detect-speaker-button').removeClass('playing')
})

layer.config({
  title: false,
  shade: [0.05, '#000'],
  closeBtn: 0,
  btnAlign: 'c',
  shadeClose: true
})
$(function() {
  var deviceStatus = {
    camera: {
      status: false,
      isChecked: false
    },
    speaker: {
      status: false,
      isPlayed: false,
      isChecked: false
    },
    microphone: {
      status: false,
      isChecked: false
    }
  }

  getUserMedia(
    {
      video: {
        width: { min: 240, ideal: 480, max: 1920 },
        height: { min: 160, ideal: 320, max: 1080 }
      }
    },
    function(stream) {
      if ('srcObject' in cameraVideo) {
        cameraVideo.srcObject = stream
      } else {
        var URL = window.URL || window.webkitURL
        cameraVideo.src = URL.createObjectURL(stream)
      }
      cameraVideo.onloadedmetadata = function(e) {
        cameraVideo.play()
      }
    }
  )

  // 切换检测项目
  $stepsBar.on('click', '.detection-step-item', function() {
    var index = $(this).index('.detection-step-item')
    changeStepByIndex(index)
  })

  $viewersBar
    .on('click', '.detect-speaker-button', function() {
      var $this = $(this)
      if ($this.hasClass('playing')) {
        audioPlayer.pause()
        $this.removeClass('playing')
      } else {
        audioPlayer.play()
        $this.addClass('playing')
        deviceStatus.speaker.isPlayed = true
      }
    })
    .find('input[type="range"]')
    .on('input', function() {
      var value = $(this).val()
      $(this).css('background-size', value + '% 100%')
      audioPlayer.volume = value / 100
    })
    .end()
    .on('click', '.detection-confirm-button', function() {
      var $viewer = $(this).closest('.detection-viewer-item')
      var status = $(this).hasClass('yes')
      var nextIndex
      if ($viewer.hasClass('detect-camera-viewer')) {
        deviceStatus.camera.status = status
        deviceStatus.camera.isChecked = true
        nextIndex = 1
      } else if ($viewer.hasClass('detect-speaker-viewer')) {
        // 扬声器检测需要先播放音频
        if (!deviceStatus.speaker.isPlayed) {
          layer.open({
            skin: 'layer-speaker-tips',
            content: '请先点击播放音频按钮，进行试听',
            yes: function(index) {
              $viewersBar.find('.detect-speaker-button').trigger('click')
              layer.close(index)
            }
          })
          return false
        }
        deviceStatus.speaker.status = status
        deviceStatus.speaker.isChecked = true
        nextIndex = 2
      } else if ($viewer.hasClass('detect-mic-viewer')) {
        deviceStatus.microphone.status = status
        deviceStatus.microphone.isChecked = true
      }
      updateStepsBar()

      // 三项都完成检测后显示结果，未完成继续下一步
      isAllChecked() ? showDetectResult() : changeStepByIndex(nextIndex)
    })

  // 显示检测结果
  function showDetectResult() {
    var $result = $('#detectResult')
    var msg = '您不用着急，课前会有专业人员帮助调试'
    if (
      deviceStatus.camera.status &&
      deviceStatus.speaker.status &&
      deviceStatus.microphone.status
    ) {
      msg = '设备没有问题，宝贝可以正常上课'
    }
    $result.find('.detect-result-msg').text(msg)

    $result.find('.detect-result-item').removeClass('has-error')
    !deviceStatus.camera.status &&
      $result.find('.detect-camera').addClass('has-error')
    !deviceStatus.speaker.status &&
      $result.find('.detect-speaker').addClass('has-error')
    !deviceStatus.microphone.status &&
      $result.find('.detect-microphone').addClass('has-error')

    layer.open({
      type: 1,
      skin: 'layer-detect-result',
      area: '500px',
      content: $result,
      btn: ['好的'],
      yes: function(index) {
        layer.close(index)
      }
    })
  }

  // 是否所有设备项已检测完成
  function isAllChecked() {
    return (
      deviceStatus.camera.isChecked &&
      deviceStatus.speaker.isChecked &&
      deviceStatus.microphone.isChecked
    )
  }

  // 更新页面检测状态的显示
  function updateStepsBar() {
    $stepsBar.find('.detection-step-item').removeClass('success has-error')
    if (deviceStatus.camera.isChecked) {
      var status = deviceStatus.camera.status ? 'success' : 'has-error'
      $stepsBar.find('.detect-camera').addClass(status)
    }
    if (deviceStatus.speaker.isChecked) {
      var status = deviceStatus.speaker.status ? 'success' : 'has-error'
      $stepsBar.find('.detect-speaker').addClass(status)
    }
    if (deviceStatus.microphone.isChecked) {
      var status = deviceStatus.microphone.status ? 'success' : 'has-error'
      $stepsBar.find('.detect-microphone').addClass(status)
    }
  }

  // 改变测试模块
  function changeStepByIndex(index) {
    if (index === undefined) {
      if (!deviceStatus.camera.isChecked) {
        changeStepByIndex(0)
      } else if (!deviceStatus.speaker.isChecked) {
        changeStepByIndex(1)
      }
      return
    }

    if (
      $stepsBar
        .find('.detection-step-item.active')
        .index('.detection-step-item') === index
    ) {
      return
    }

    $viewersBar.css('transform', 'translateX(-' + index + '00%)')
    $stepsBar
      .find('.detection-step-item')
      .removeClass('active')
      .eq(index)
      .addClass('active')

    $stepsBar
      .find('.detection-step-connection')
      .removeClass('active')
      .end()
      .find('.detection-step-item')
      .eq(index)
      .prevAll('.detection-step-connection')
      .addClass('active')

    if (index === 0) {
      cameraVideo.play()
    } else {
      cameraVideo.pause()
    }

    if (index !== 1) {
      audioPlayer.pause()
      $viewersBar.find('.detect-speaker-button').removeClass('playing')
    }

    if (index === 2) {
      wavesurfer ? wavesurfer.microphone.play() : initMicrophoneWave()
    } else {
      wavesurfer && wavesurfer.microphone.pause()
    }
  }
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
