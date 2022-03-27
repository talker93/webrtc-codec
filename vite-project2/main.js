import './style.css'

// Step 1. Initialization
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, Firestore, doc, setDoc, Timestamp, updateDoc, serverTimestamp, getDoc, where, query, onSnapshot } from "firebase/firestore";
// import { enableStartButton, disableSendButton, createConnection, onCreateSessionDescriptionError, sendData, closeDataChannels, gotDescription1, gotDescription2, getOtherPc, getName, onIceCandidate, onAddIceCandidateSuccess, onAddIceCandidateError, receiveChannelCallback, onReceiveMessageCallback, onSendChannelStateChange, onReceiveChannelStateChange } from './module.js';

const firebaseConfig = {
  apiKey: "AIzaSyBLAS9TSpc8v-273koNVal1Tt1jes7lAQQ",
  authDomain: "webcodec-64053.firebaseapp.com",
  projectId: "webcodec-64053",
  storageBucket: "webcodec-64053.appspot.com",
  messagingSenderId: "499852745372",
  appId: "1:499852745372:web:c5d05223a82e7e26c86b59",
  measurementId: "G-TY670YZV22"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;
let sender = null;

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');
const callMessage = document.getElementById('callMessage');
let sendChannel;
let receiveChannel;
let receiveHandle = false;



// UI Layer for FX Components
Nexus.colors.accent = "#2596be";
Nexus.colors.fill = "#333";
var muteMonitorToggle = new Nexus.Toggle('#muteMo',{'state':true});
muteMonitorToggle.on('change', function(v) {
  document.getElementById('muteMonitor').click();
})
var muteSelfToggle = new Nexus.Toggle('#muteMy');
muteSelfToggle.on('change', function(v) {
  document.getElementById('muteMe').click();
});
var audioSourceSelect = new Nexus.Select('audioSourceSelect',{
  'size': [200, 20],
  'options': ['Default - MacBook Pro Microphone', 'iPhone']
});
audioSourceSelect.colorize("fill", "#eee");
var audioOutSelect = new Nexus.Select('audioOutputSelect',{
  'size': [200, 20],
  'options': ['Defalut - MacBook Pro Speakers (Built-in)']
})
audioOutSelect.colorize("fill", "#eee");
var startDevices = new Nexus.TextButton('#startDevices',{
  'size': [150, 50],
  'state': false,
  'text': 'Init',
  'alternateText': 'Activated'
});
startDevices.colorize("fill", "#eee");
startDevices.on('change', function(v) {
  webcamButton.click();
});
// var compressor = new Nexus.Envelope('#compressor');
var comp_threshold = new Nexus.Dial('#comp_threshold', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': -100,
  'max': 0,
  'step': 1,
  'value': -24
});
var comp_knee = new Nexus.Dial('#comp_knee', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': 0,
  'max': 40,
  'step': 1,
  'value': 30
});
var comp_ratio = new Nexus.Dial('#comp_ratio', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': 1,
  'max': 20,
  'step': 1,
  'value': 12
});
var comp_attack = new Nexus.Dial('#comp_attack', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': 0,
  'max': 1,
  'step': 0.01,
  'value': 0.003
});
var comp_release = new Nexus.Dial('#comp_release', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': 0,
  'max': 1,
  'step': 0.05,
  'value': 0.25
});
var comp_bypass = new Nexus.Toggle('#comp_bypass');
var reverb = new Nexus.Dial('#reverb', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': 0,
  'max': 20,
  'step': 1,
  'value': 10
});
var rev_bypass = new Nexus.Toggle('#rev_bypass');
var eq_bypass = new Nexus.Toggle('#eq_bypass');
var eq_type = new Nexus.Select('eq_type', {
  'size': [200, 20],
  'options': ['lowshelf', 'highshelf']
});
var eq_freq = new Nexus.Slider('eq_freq', {
  'size': [120, 20],
  'mode': 'relative',
  'min': 20,
  'max': 20000,
  'step': 100,
  'value': 1000
});
var eq1 = new Nexus.Dial('#eq1', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': -20,
  'max': 40,
  'step': 0,
  'value': 10
});
var eq2 = new Nexus.Dial('#eq2', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': -20,
  'max': 40,
  'step': 0,
  'value': 10
});
var eq3 = new Nexus.Dial('#eq3', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': -20,
  'max': 40,
  'step': 0,
  'value': 10
});
var gain_bypass = new Nexus.Toggle('#gain_bypass');
var gain = new Nexus.Dial('#gain', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': 0,
  'max': 20,
  'step': 1,
  'value': 2
});
var pan_bypass = new Nexus.Toggle('#pan_bypass');
var pan = new Nexus.Dial('#pan', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': -1,
  'max': 1,
  'step': 0.1,
  'value': 0
});

// for datachannel
var fxValues = {
  comp: {
    attack: comp_attack.value,
    bypass: comp_bypass.state,
    knee: comp_knee.value,
    ratio: comp_ratio.value,
    release: comp_release.value,
    threshold: comp_threshold.value
  },
  eq: {
    low: eq1.value,
    mid: eq2.value,
    high: eq3.value,
    bypass: eq_bypass.state,
    freq: eq_freq.value,
    type: eq_type.value
  },
  pan: {
    bypass: pan_bypass.state,
    pan: pan.value
  },
  gain: {
    bypass: gain_bypass.state,
    gain: gain.value 
  },
  whatChanged: "none"
};


// Step 2. media query
const remoteVideoElement = document.getElementById('remoteVideo');
const audioInputSelect = document.getElementById('audioSource');
const audioOutputSelect = document.getElementById('audioOutput');
const selectors = [audioInputSelect, audioOutputSelect];

function gotDevices(deviceInfos) {
  const values = selectors.map(select => select.value);
  selectors.forEach(select => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } 
    // use this when video/debug is needed, to get info of the video devices.
    // else {
    //   console.log('Some other kind of source/device: ', deviceInfo);
    // }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(console.log('media query success'));

function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  remoteVideoElement.setSinkId(audioDestination).then(console.log('success'));
}

function mediaConstructor() {
  const audioSource = audioInputSelect.value;
  const constraints = {
    audio: {
      deviceId: audioSource,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      latency: 0,
      sampleRate: 48000,
      sampleSize: 16,
      volume: 1.0
    },
    video: false
  };
  return(constraints)
}

var constraints1 = mediaConstructor();
audioInputSelect.addEventListener("change", function() {constraints1 = mediaConstructor();});
audioOutputSelect.onchange = changeAudioDestination;







// Step 3. setup media sources
webcamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia(constraints1);
  remoteStream = new MediaStream();

  // push tracks from local stream to peer connections
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;
  webcamVideo.play();
  remoteVideo.play();

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
  fxFunctions();
}

// mute the local monitor signal
const isMuteMonitor = document.getElementById('muteMonitor');

if(isMuteMonitor.checked == true) {
  webcamVideo.muted = true;
} else {
  webcamVideo.muted = false;
}

isMuteMonitor.addEventListener("change", function() {
  if(isMuteMonitor.checked == true) {
    webcamVideo.muted = true;
    console.log("monitor muted");
  } else {
    webcamVideo.muted = false;
    console.log("monitor unmuted");
  }
});

// mute local input
// function works only when devices started
const isMuteMe = document.getElementById('muteMe');
isMuteMe.checked = false;
isMuteMe.addEventListener("change", function() {
  if(isMuteMe.checked == true) {
    localStream.getTracks()[0].enabled = false;
    console.log("muted me");
  } else {
    localStream.getTracks()[0].enabled = true;
    console.log("unmuted me");
  }
});




// Step 4. create an offer
const db = getFirestore();

callButton.onclick = async () => {
  
  sendChannel = pc.createDataChannel("sendDataChannel");
  sendChannel.onopen = e => {
    console.log("send channel opened");
  }
  sendChannel.onclose = e => {
    console.log("send channel closed");
  }

  pc.ondatachannel = (event) => {
    receiveChannel = event.channel;
    receiveChannel.onmessage = async e => {
      receiveHandle = true;
      fxValues = JSON.parse(e.data);
      switch (fxValues.whatChanged) {
        case 'comp.threshold':
          await (comp_threshold.value = fxValues.comp.threshold);
          receiveHandle = false;
          break;

        case 'comp.release':
          await (comp_release.value = fxValues.comp.release);
          receiveHandle = false;
          break;
        
        case 'comp.attack':
          await (comp_attack.value = fxValues.comp.attack);
          break;

        case 'comp.knee':
          await (comp_knee.value = fxValues.comp.knee);
          break;

        case 'comp.ratio':
          await (comp_ratio.value = fxValues.comp.ratio);
          break;

        case 'comp.reduction':
          await (comp_recduction.value = fxValues.comp.reduction);
          break;

        case 'eq.type':
          await (eq_type.value = fxValues.eq.type);
          break;

        case 'eq.freq':
          await (eq_freq.value = fxValues.eq.freq);
          break;

        case 'eq.low':
          await (eq1.value = fxValues.eq.low);
          break;

        case 'eq.mid':
          await (eq2.value = fxValues.eq.mid);
          break;

        case 'eq.high':
          await (eq3.value = fxValues.eq.high);
          break;

        case 'pan.pan':
          await (pan.value = fxValues.pan.pan);
          break;
        
        case 'gain.gain':
          await (gain.value = fxValues.gain.gain);
          break;

        case 'comp.bypass':
          await (comp_bypass.state = fxValues.comp.bypass);
          break;

        case 'eq.bypass':
          await (eq_bypass.state = fxValues.eq.bypass);
          break;

        case 'gain.bypass':
          await (gain_bypass.state = fxValues.gain.bypass);
          break;

        case 'pan.bypass':
          await (pan_bypass.state = fxValues.pan.bypass);
          break;
      
        default:
          console.log("invalid exchanged value");
          break;
      }
    }
    receiveChannel.onopen = e => {
      console.log("receive channel opened");
    }
    receiveChannel.onclose = e => {
      console.log("receive channel closed");
    }
  }


  let callMsg = document.createTextNode("You created a call.");
  callMessage.appendChild(callMsg);
  callButton.disabled = true;
  answerButton.disabled = true;
  const callDoc = collection(db, 'calls1');
  const callRef = await addDoc(callDoc, {});
  callInput.value = callRef.id;
  const offerCandidates = collection(db, "calls1", callRef.id, "offerCandidates");
  const answerCandidates = collection(db, "calls1", callRef.id, "answerCandidates");

  pc.onicecandidate = (event) => {
    if(event.candidate) {
      addDoc(offerCandidates, event.candidate.toJSON());
    }
    console.log("PA updated candidates in database");
  };

  const offerDescription = await pc.createOffer().then(console.log("PA created offer"));
  offerDescription.sdp = offerDescription.sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
  await pc.setLocalDescription(offerDescription).then(console.log("PA set local desc"));

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(doc(db, 'calls1', callRef.id), {offer}).then(console.log("PA updated offer in database"));

  // Listen for remote answer
  const q1 = query(doc(db, 'calls1', callRef.id));
  onSnapshot(q1, (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
      console.log("PA set remote desc");
    }
  });

  // When answered, add candidate to peer connection
  const q2 = query(answerCandidates);
  onSnapshot(q2, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
        // console.log("a, connection: added candidate in local connection");
      }
    });
  });

  hangupButton.disabled = false;


};







// Step 5. Answer the call with the unique ID
answerButton.onclick = async () => {
  
  sendChannel = pc.createDataChannel("sendDataChannel2");
  sendChannel.onopen = e => {
    console.log("send channel opened");
  }
  sendChannel.onclose = e => {
    console.log("send channel closed");
  }

  pc.ondatachannel = (event) => {
    receiveChannel = event.channel;
    receiveChannel.onmessage = async e => {
      receiveHandle = true;
      fxValues = JSON.parse(e.data);
      switch (fxValues.whatChanged) {
        case 'comp.threshold':
          await (comp_threshold.value = fxValues.comp.threshold);
          receiveHandle = false;
          break;

        case 'comp.release':
          await (comp_release.value = fxValues.comp.release);
          receiveHandle = false;
          break;
        
        case 'comp.attack':
          await (comp_attack.value = fxValues.comp.attack);
          break;

        case 'comp.knee':
          await (comp_knee.value = fxValues.comp.knee);
          break;

        case 'comp.ratio':
          await (comp_ratio.value = fxValues.comp.ratio);
          break;

        case 'comp.reduction':
          await (comp_recduction.value = fxValues.comp.reduction);
          break;

        case 'eq.type':
          await (eq_type.value = fxValues.eq.type);
          break;

        case 'eq.freq':
          await (eq_freq.value = fxValues.eq.freq);
          break;

        case 'eq.low':
          await (eq1.value = fxValues.eq.low);
          break;

        case 'eq.mid':
          await (eq2.value = fxValues.eq.mid);
          break;

        case 'eq.high':
          await (eq3.value = fxValues.eq.high);
          break;

        case 'pan.pan':
          await (pan.value = fxValues.pan.pan);
          break;
        
        case 'gain.gain':
          await (gain.value = fxValues.gain.gain);
          break;

        case 'comp.bypass':
          await (comp_bypass.state = fxValues.comp.bypass);
          break;

        case 'eq.bypass':
          await (eq_bypass.state = fxValues.eq.bypass);
          break;

        case 'gain.bypass':
          await (gain_bypass.state = fxValues.gain.bypass);
          break;

        case 'pan.bypass':
          await (pan_bypass.state = fxValues.pan.bypass);
          break;
      
        default:
          console.log("invalid exchanged value");
          break;
      }
    }
    receiveChannel.onopen = e => {
      console.log("receive channel opened");
    }
    receiveChannel.onclose = e => {
      console.log("receive channel closed");
    }
  }

  let callMsg = document.createTextNode("You answered a call!");
  callMessage.appendChild(callMsg);
  callButton.disabled = true;
  answerButton.disabled = true;
  const callId = callInput.value;
  const callDoc = collection(db, "calls1");
  const answerCandidates = collection(db, 'calls1', callId, 'answerCandidates');
  const offerCandidates = collection(db, 'calls1', callId, 'offerCandidates');

  pc.onicecandidate = (event) => {
    event.candidate && addDoc(answerCandidates, event.candidate.toJSON());
    console.log("PB updated candidate in database");
  };

  const callData = (await getDoc(doc(callDoc, callId))).data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));
  console.log("PB set remote desc");

  const answerDescription = await pc.createAnswer();
  answerDescription.sdp = answerDescription.sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
  await pc.setLocalDescription(answerDescription);
  console.log("PB set local desc");

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await updateDoc(doc(db, 'calls1', callId), { answer });
  console.log("PB updated answer in database");

  const q3 = query(offerCandidates);
  onSnapshot(q3, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

};



// Step 6. Codec changes
async function fxFunctions () {
  console.log('button has been pushed');


  // Step 7. Apply FX
  // Init FXs
  var audioCtx = new AudioContext();
  var source = audioCtx.createMediaStreamSource(localStream);

  var Filter = audioCtx.createBiquadFilter();
  Filter.type = eq_type.value;
  Filter.frequency.value = eq_freq.value;
  Filter.gain.value = gain.value;

  var Panner = audioCtx.createStereoPanner();
  Panner.pan.value = pan.value;

  var Gainner = audioCtx.createGain();
  Gainner.gain.value = gain.value;

  var Compressor = audioCtx.createDynamicsCompressor();
  Compressor.release.value = comp_release.value;

  source.connect(Compressor);
  Compressor.connect(Filter);
  Filter.connect(Gainner);
  Gainner.connect(Panner);
  Panner.connect(audioCtx.destination);


  // param listener

  comp_threshold.on('change', function(v) {
    Compressor.threshold.value = comp_threshold.value;
    fxValues.comp.threshold = comp_threshold.value;
    fxValues.whatChanged = 'comp.threshold';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
      console.log("threshold: ", fxValues.comp.threshold);
    }
  });

  comp_release.on('change', function(v) {
    Compressor.release.value = comp_release.value;
    fxValues.comp.release = comp_release.value;
    fxValues.whatChanged = 'comp.release';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  comp_attack.on('change', function(v) {
    Compressor.attack.value = comp_attack.value;
    fxValues.comp.attack = comp_attack.value;
    fxValues.whatChanged = 'comp.attack';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  comp_knee.on('change', function(v) {
    Compressor.knee.value = comp_knee.value;
    fxValues.comp.knee = comp_knee.value;
    fxValues.whatChanged = 'comp.knee';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  comp_ratio.on('change', function(v) {
    Compressor.ratio.value = comp_ratio.value;
    fxValues.comp.ratio = comp_ratio.value;
    fxValues.whatChanged = 'comp.ratio';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  eq_type.on('change', function(v) {
    Filter.type = eq_type.value;
    fxValues.eq.type = eq_type.value;
    fxValues.whatChanged = 'eq.type';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  eq_freq.on('change', function(v) {
    Filter.frequency.value = eq_freq.value;
    fxValues.eq.freq = eq_freq.value;
    fxValues.whatChanged = 'eq.freq';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  eq1.on('change', function(v) {
    Filter.gain.value = eq1.value;
    fxValues.eq.low = eq1.value;
    fxValues.whatChanged = 'eq.low';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  eq2.on('change', function(v) {
    Filter.gain.value = eq2.value;
    fxValues.eq.mid = eq2.value;
    fxValues.whatChanged = 'eq.mid';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  eq3.on('change', function(v) {
    Filter.gain.value = eq3.value;
    fxValues.eq.high = eq3.value;
    fxValues.whatChanged = 'eq.high';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  pan.on('change', function(v) {
    Panner.pan.value = pan.value;
    fxValues.pan.pan = pan.value;
    fxValues.whatChanged = 'pan.pan';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  gain.on('change', function(v) {
    Gainner.gain.value = gain.value;
    fxValues.gain.gain = gain.value;
    fxValues.whatChanged = 'gain.gain';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });


  // Bypass function
  comp_bypass.on('change', function(v) {
    if(comp_bypass.state == true) {
      Compressor.disconnect();
      source.connect(Filter);
    } else {
      source.disconnect(Filter);
      source.connect(Compressor);
      Compressor.connect(Filter);
    }
    fxValues.comp.bypass = comp_bypass.state;
    fxValues.whatChanged = 'comp.bypass';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  eq_bypass.on('change', function(v) {
    if(eq_bypass.state == true) {
      Filter.disconnect();
      Compressor.connect(Gainner);
    } else {
      Compressor.disconnect(Gainner);
      Compressor.connect(Filter);
      Filter.connect(Gainner);
    }
    fxValues.eq.bypass = eq_bypass.state;
    fxValues.whatChanged = 'eq.bypass';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  gain_bypass.on('change', function(v) {
    if(gain_bypass.state == true) {
      Gainner.disconnect();
      Filter.connect(Panner);
    } else {
      Filter.disconnect(Panner);
      Filter.connect(Gainner);
      Gainner.connect(Panner);
    }
    fxValues.gain.bypass = gain_bypass.state;
    fxValues.whatChanged = 'gain.bypass';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });

  pan_bypass.on('change', function(v) {
    if(pan_bypass.state == true) {
      Panner.disconnect();
      Gainner.connect(audioCtx.destination);
    } else {
      Gainner.disconnect(audioCtx.destination);
      Gainner.connect(Panner);
      Panner.connect(audioCtx.destination);
    }
    fxValues.pan.bypass = pan_bypass.state;
    fxValues.whatChanged = 'pan.bypass';
    if(!receiveHandle) {
      const buffer = JSON.stringify(fxValues);
      sendChannel.send(buffer);
    }
  });


  var oscilloscope = new Nexus.Oscilloscope('#oScope');
  oscilloscope.connect(source);

  var spectrogram = new Nexus.Spectrogram('#spec');
  spectrogram.connect(source);



  // console.log(webcamVideo.srcObject);
  // console.log(localStream.getTracks());
  // console.log(remoteStream.getTracks());

  // let codecList = null;
  // if (pc.iceGatheringState === "complete") {
  //   const senders = pc.getSenders();

  //   senders.forEach((sender) => {
  //     if (sender.track.kind === "audio") {
  //       codecList = sender.getParameters().codecs;
  //       console.log(codecList);``
  //       return;
  //     }
  //   });
  // }
  // codecList = null;

  // const transceivers = pc.getTransceivers();
  // transceivers.forEach(transceiver => {
  //   const kind = transceiver.sender.track.kind;
  //   let sendCodecs = RTCRtpSender.getCapabilities(kind).codecs;
  //   if (kind === "audio") {
  //     sendCodecs = preferCodec(sendCodecs, "audio/PCMA");
  //     transceiver.setCodecPreferences(sendCodecs);
  //     console.log(sendCodecs);
  //   }
  // });

};

// function preferCodec(codecs, mimeType) {
//   let otherCodecs = [];
//   let sortedCodecs = [];
//   let count = codecs.length;
//   codecs.forEach(codec => {
//     if (codec.mimeType === mimeType) {
//       sortedCodecs.push(codec);
//     } else {
//       otherCodecs.push(codec);
//     }
//   });
//   return sortedCodecs.concat(otherCodecs);
// }
