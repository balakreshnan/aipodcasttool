const controls = document.querySelectorAll('.control');
const startRecordingButton = document.querySelector('#startRecording');
const stopRecordingButton = document.querySelector('#stopRecording');
const downloadRecordingButton = document.querySelector('#downloadRecording');
const heroStartRecordingButton = document.querySelector('#heroStartRecording');
const livePreview = document.querySelector('#livePreview');
const recordingStatus = document.querySelector('#recordingStatus');
const recordingBadge = document.querySelector('#recordingBadge');
const muteButton = document.querySelector('#muteButton');
const shareButton = document.querySelector('#shareButton');
const connectYoutubeButton = document.querySelector('#connectYoutube');
const youtubeStatus = document.querySelector('#youtubeStatus');

let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isMuted = false;

const updateStatus = (message) => {
  if (recordingStatus) {
    recordingStatus.textContent = message;
  }
};

const updateBadge = (message, isLive = false) => {
  if (!recordingBadge) {
    return;
  }

  recordingBadge.textContent = message;
  recordingBadge.classList.toggle('live', isLive);
};

const setButtonState = (isRecording) => {
  if (startRecordingButton) {
    startRecordingButton.disabled = isRecording;
  }
  if (stopRecordingButton) {
    stopRecordingButton.disabled = !isRecording;
  }
};

const syncHeroButton = (isRecording) => {
  if (!heroStartRecordingButton) {
    return;
  }
  heroStartRecordingButton.textContent = isRecording
    ? 'Recording in progress'
    : 'Start a recording';
  heroStartRecordingButton.disabled = isRecording;
};

const stopMediaTracks = () => {
  if (!mediaStream) {
    return;
  }
  mediaStream.getTracks().forEach((track) => track.stop());
  mediaStream = null;
};

const startRecording = async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      updateStatus('Recording is not supported in this browser.');
      return;
    }
    if (!window.MediaRecorder) {
      updateStatus('MediaRecorder is not supported in this browser.');
      return;
    }
    recordedChunks = [];
    updateStatus('Requesting camera and microphone access...');

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: true,
    });

    if (livePreview) {
      livePreview.srcObject = mediaStream;
    }

    const preferredMimeType = 'video/webm;codecs=vp9,opus';
    const recorderOptions = MediaRecorder.isTypeSupported(preferredMimeType)
      ? { mimeType: preferredMimeType }
      : undefined;
    mediaRecorder = new MediaRecorder(mediaStream, recorderOptions);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      updateStatus('Recording complete. Download your file below.');
      downloadRecordingButton.disabled = recordedChunks.length === 0;
    };

    mediaRecorder.start(1000);
    setButtonState(true);
    syncHeroButton(true);
    updateBadge('Recording', true);
    updateStatus('Recording video + audio locally in your browser.');
    if (downloadRecordingButton) {
      downloadRecordingButton.disabled = true;
    }
  } catch (error) {
    updateStatus(
      'Unable to start recording. Please allow camera and microphone access.'
    );
    updateBadge('Idle', false);
    setButtonState(false);
    syncHeroButton(false);
  }
};

const stopRecording = () => {
  if (!mediaRecorder) {
    return;
  }
  mediaRecorder.stop();
  stopMediaTracks();
  setButtonState(false);
  syncHeroButton(false);
  updateBadge('Idle', false);
};

const downloadRecording = () => {
  if (recordedChunks.length === 0) {
    return;
  }
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `podcast-recording-${Date.now()}.webm`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const toggleMute = () => {
  if (!mediaStream) {
    updateStatus('Start a recording before toggling mute.');
    return;
  }
  isMuted = !isMuted;
  mediaStream.getAudioTracks().forEach((track) => {
    track.enabled = !isMuted;
  });
  muteButton.textContent = isMuted ? 'Unmute' : 'Mute';
  updateStatus(isMuted ? 'Microphone muted.' : 'Microphone unmuted.');
};

const shareSession = async () => {
  const shareUrl = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'PodCast Studio Session',
        text: 'Join my recording room',
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      updateStatus('Share link copied to clipboard.');
    }
  } catch (error) {
    updateStatus('Unable to share right now.');
  }
};

if (startRecordingButton) {
  startRecordingButton.addEventListener('click', startRecording);
}
if (heroStartRecordingButton) {
  heroStartRecordingButton.addEventListener('click', startRecording);
}
if (stopRecordingButton) {
  stopRecordingButton.addEventListener('click', stopRecording);
}
if (downloadRecordingButton) {
  downloadRecordingButton.addEventListener('click', downloadRecording);
}
if (muteButton) {
  muteButton.addEventListener('click', toggleMute);
}
if (shareButton) {
  shareButton.addEventListener('click', shareSession);
}

controls.forEach((control) => {
  control.addEventListener('click', () => {
    controls.forEach((item) => item.classList.remove('active'));
    control.classList.add('active');
  });
});

const navLinks = document.querySelectorAll('.nav-links a');

navLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

if (connectYoutubeButton) {
  connectYoutubeButton.addEventListener('click', () => {
    if (youtubeStatus) {
      youtubeStatus.textContent =
        'YouTube OAuth requires server-side credentials. Opening setup guide...';
    }
    window.open(
      'https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps',
      '_blank'
    );
  });
}
