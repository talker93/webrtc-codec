import './style.css'

// Step 1. Initialization
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, Firestore, doc, setDoc, Timestamp, updateDoc, serverTimestamp, getDoc, where, query, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB7Jkv647eebeqifG6mAHv40fUyfdDRB8k",
  authDomain: "fireship-demos-ce28a.firebaseapp.com",
  databaseURL: "https://fireship-demos-ce28a-default-rtdb.firebaseio.com",
  projectId: "fireship-demos-ce28a",
  storageBucket: "fireship-demos-ce28a.appspot.com",
  messagingSenderId: "710932691797",
  appId: "1:710932691797:web:5838b9fd459ba264af4ddc",
  measurementId: "G-FNWH5RC87G"
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
const testButton = document.getElementById('testButton');
const callMessage = document.getElementById('callMessage');

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
var comp_reduction = new Nexus.Dial('#comp_reduction', {
  'size': [50, 50],
  'interaction': 'radial',
  'mode': 'relative',
  'min': -20,
  'max': 0,
  'step': 1,
  'value': 0
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
    console.log('case2');
    event.streams[0].getTracks().forEach((track) => {
      console.log(track);
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
    event.candidate && addDoc(offerCandidates, event.candidate.toJSON());
  };

  const offerDescription = await pc.createOffer();
  offerDescription.sdp = offerDescription.sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
  await pc.setLocalDescription(offerDescription);
  console.log("offerdescription from pa", offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(doc(db, 'calls1', callRef.id), {offer});
  console.log("offer from pa", offer);

  // Listen for remote answer
  const q1 = query(doc(db, 'calls1', callRef.id));
  onSnapshot(q1, (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
      console.log("answerdescription from pa", answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  const q2 = query(answerCandidates);
  onSnapshot(q2, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
        console.log("candidate from pa", candidate);
      }
    });
  });

  hangupButton.disabled = false;
};







// Step 5. Answer the call with the unique ID
answerButton.onclick = async () => {
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
  };

  const callData = (await getDoc(doc(callDoc, callId))).data();
  console.log(callData);

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  answerDescription.sdp = answerDescription.sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
  await pc.setLocalDescription(answerDescription);
  console.log("answerDescription from pb", answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await updateDoc(doc(db, 'calls1', callId), { answer });
  console.log("answer from pb", answer);

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
testButton.onclick = async () => {
  console.log('button has been pushed');

  // Step 7. Apply FX
  var audioCtx = new AudioContext();
  var source = audioCtx.createMediaStreamSource(localStream);

  var biquadFilter = audioCtx.createBiquadFilter();
  biquadFilter.type = eq_type.value;
  biquadFilter.frequency.value = eq_freq.value;
  biquadFilter.gain.value = gain.value;

  var Panner = audioCtx.createStereoPanner();
  Panner.pan.value = pan.value;

  var Gainner = audioCtx.createGain();
  Gainner.gain.value = gain.value;

  var Compressor = audioCtx.createDynamicsCompressor();
  Compressor.release.value = comp_release.value;

  source.connect(Compressor);
  Compressor.connect(biquadFilter);
  biquadFilter.connect(Gainner);
  Gainner.connect(Panner);
  Panner.connect(audioCtx.destination);


  // param function
  comp_threshold.on('change', function(v) {
    Compressor.release.value = comp_release.value;
    console.log(comp_release);
  });

  comp_attack.on('change', function(v) {
    Compressor.attack.value = comp_attack.value;
  });

  comp_knee.on('change', function(v) {
    Compressor.knee.value = comp_knee.value;
  });

  comp_ratio.on('change', function(v) {
    Compressor.ratio.value = comp_ratio.value;
  });


  eq_type.on('change', function(v) {
    biquadFilter.type = eq_type.value;
    console.log(eq_type.value);
  });

  eq_freq.on('change', function(v) {
    biquadFilter.frequency.value = eq_freq.value;
    console.log(eq_freq);
  });

  eq1.on('change', function(v) {
    biquadFilter.gain.value = eq1.value;
    console.log(eq1.value);
  });

  pan.on('change', function(v) {
    Panner.pan.value = pan.value;
    console.log(pan.value);
  });

  gain.on('change', function(v) {
    Gainner.gain.value = gain.value;
    console.log(gain.value);
  });


  // Bypass function
  comp_bypass.on('change', function(v) {
    if(comp_bypass.state == true) {
      Compressor.disconnect();
      source.connect(biquadFilter);
      biquadFilter.connect(Gainner);
      Gainner.connect(Panner);
      Panner.connect(audioCtx.destination);
    } else {
      source.connect(Compressor);
      Compressor.connect(biquadFilter);
      biquadFilter.connect(Gainner);
      Gainner.connect(Panner);
      Panner.connect(audioCtx.destination);
    }
  });

  eq_bypass.on('change', function(v) {
    if(eq_bypass.state == true) {
      biquadFilter.disconnect();
      source.connect(Compressor);
      Compressor.connect(Gainner);
      Gainner.connect(Panner);
      Panner.connect(audioCtx.destination);
    } else {
      source.connect(Compressor);
      Compressor.connect(biquadFilter);
      biquadFilter.connect(Gainner);
      Gainner.connect(Panner);
      Panner.connect(audioCtx.destination);
    }
  });

  gain_bypass.on('change', function(v) {
    if(gain_bypass.state == true) {
      Gainner.disconnect();
      source.connect(Compressor);
      Compressor.connect(biquadFilter);
      biquadFilter.connect(Panner);
      Panner.connect(audioCtx.destination);
    } else {
      source.connect(Compressor);
      Compressor.connect(biquadFilter);
      biquadFilter.connect(Gainner);
      Gainner.connect(Panner);
      Panner.connect(audioCtx.destination);
    }
  });

  pan_bypass.on('change', function(v) {
    if(pan_bypass.state == true) {
      Panner.disconnect();
      source.connect(Compressor);
      Compressor.connect(biquadFilter);
      biquadFilter.connect(Gainner);
      Gainner.connect(audioCtx.destination);
    } else {
      source.connect(Compressor);
      Compressor.connect(biquadFilter);
      biquadFilter.connect(Gainner);
      Gainner.connect(Panner);
      Panner.connect(audioCtx.destination);
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

function preferCodec(codecs, mimeType) {
  let otherCodecs = [];
  let sortedCodecs = [];
  let count = codecs.length;
  codecs.forEach(codec => {
    if (codec.mimeType === mimeType) {
      sortedCodecs.push(codec);
    } else {
      otherCodecs.push(codec);
    }
  });
  return sortedCodecs.concat(otherCodecs);
}





// Some other examples
// read
// const citiesRef = collection(db, "cities");

// await setDoc(doc(citiesRef, "SF"), {
//     name: "San Francisco", state: "CA", country: "USA",
//     capital: false, population: 860000,
//     regions: ["west_coast", "norcal"] });
// await setDoc(doc(citiesRef, "LA"), {
//     name: "Los Angeles", state: "CA", country: "USA",
//     capital: false, population: 3900000,
//     regions: ["west_coast", "socal"] });
// await setDoc(doc(citiesRef, "DC"), {
//     name: "Washington, D.C.", state: null, country: "USA",
//     capital: true, population: 680000,
//     regions: ["east_coast"] });
// await setDoc(doc(citiesRef, "TOK"), {
//     name: "Tokyo", state: null, country: "Japan",
//     capital: true, population: 9000000,
//     regions: ["kanto", "honshu"] });
// await setDoc(doc(citiesRef, "BJ"), {
//     name: "Beijing", state: null, country: "China",
//     capital: true, population: 21500000,
//     regions: ["jingjinji", "hebei"] });

// query 1
// const docRef = doc(db, "cities", "SF");
// const docSnap = await getDoc(docRef);

// if (docSnap.exists()) {
//   console.log("Document data: ", docSnap.data());
// } else {
//   console.log("No such document!");
// }

// query 2, remove 'where' to get all documents
// const q = query(collection(db, "cities"), where("capital", "==", true));
// const querySnapshot = await getDocs(q);
// querySnapshot.forEach((doc) => {
//   console.log(doc.id, " => ", doc.data());
// });

// query 3, listen to the change
// const unsub = onSnapshot(doc(db, "cities", "SF"), (doc) => {
//   console.log("Current data: ", doc.data());
// });

// query 4, listen to the change of whole document
// const q = query(collection(db, "cities"), where("state", "==", "CA"));
// const unsubscribe = onSnapshot(q, (querySnapshot) => {
//   const cities = [];
//   querySnapshot.forEach((doc) => {
//     cities.push(doc.data().name);
//   });
//   console.log("Current cities in CA: ", cities.join(", "));
// });
