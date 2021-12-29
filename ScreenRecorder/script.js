let shouldStop = false;
let stopped = false;
const videoElement = document.getElementsByTagName("video")[0];
const downloadLink = document.getElementById('download');
const stopButton = document.getElementById('stop');

function startRecord() {
    $('.btn-info').prop('disabled', true);
    $('#stop').prop('disabled', false);
    $('#download').css('display', 'none')
    if(shouldStop == false){
        stopButton.style.backgroundColor='red';
        stopButton.style.cursor = 'pointer';
    }
}
function stopRecord() {
    $('.btn-info').prop('disabled', false);
    $('#stop').prop('disabled', true);
    $('#download').css('display', 'block')
}
const audioRecordConstraints = {
    echoCancellation: true
}

stopButton.addEventListener('click', function () {
    shouldStop = true;
    if(shouldStop){
        stopButton.style.backgroundColor='rgba(255, 0, 0, 0.603)';
        stopButton.style.cursor = 'default';
    }
});

const handleRecord = function ({stream, mimeType}) {
    startRecord()
    let recordedChunks = [];
    stopped = false;
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function (e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }

        if (shouldStop === true && stopped === false) {
            mediaRecorder.stop();
            stopped = true;
        }
    };

    mediaRecorder.onstop = function () {
        const blob = new Blob(recordedChunks, {
            type: mimeType
        });
        recordedChunks = []
        const filename = window.prompt('Enter file name');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${filename || 'recording'}.webm`;
        stopRecord();
        videoElement.srcObject = null;
    };

    mediaRecorder.start(200);
};

async function recordAudio() {
    const mimeType = 'audio/webm';
    shouldStop = false;
    const stream = await navigator.mediaDevices.getUserMedia({audio: audioRecordConstraints});
    handleRecord({stream, mimeType})
}


async function recordScreen() {
    const mimeType = 'video/webm;codecs=vp9';
    shouldStop = false;
    const constraints = {
        video: {
            cursor: 'motion'
        }
    };
    if(!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
        return window.alert('Screen Record not supported!')
    }
    let stream = null;
    const displayStream = await navigator.mediaDevices.getDisplayMedia({video: {cursor: "motion"}, audio: {'echoCancellation': true}});
    if(window.confirm("Record audio with screen?")){
        const audioContext = new AudioContext();

        const voiceStream = await navigator.mediaDevices.getUserMedia({ audio: {'echoCancellation': true}, video: false });
        const userAudio = audioContext.createMediaStreamSource(voiceStream);
        
        const audioDestination = audioContext.createMediaStreamDestination();
        userAudio.connect(audioDestination);

        if(displayStream.getAudioTracks().length > 0) {
            const displayAudio = audioContext.createMediaStreamSource(displayStream);
            displayAudio.connect(audioDestination);
        }

        const tracks = [...displayStream.getVideoTracks(), ...audioDestination.stream.getTracks()]
        stream = new MediaStream(tracks);
        handleRecord({stream, mimeType})
    } else {
        stream = displayStream;
        handleRecord({stream, mimeType});
    };
    videoElement.srcObject = stream;
}