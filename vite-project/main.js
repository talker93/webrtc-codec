import './style.css'

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





// media query
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
    // use this when video/debug is needed.
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
    audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    video: false
  };
  return(constraints)
}

var constraints1 = mediaConstructor();
audioInputSelect.addEventListener("change", function() {constraints1 = mediaConstructor();});
audioOutputSelect.onchange = changeAudioDestination;







// setup media sources
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

  webcamVideo.srcObject = localStream;
  remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
}

// mute the local monitor signal
const isMuteMonitor = document.getElementById('muteMonitor');
isMuteMonitor.addEventListener("change", function() {
  if(isMuteMonitor.checked == true) {
    webcamVideo.autoplay = true;
    webcamVideo.muted = true;
    console.log("monitor muted");
  } else {
    webcamVideo.muted = false;
    console.log("monitor unmuted");
  }
});

// mute local input
// function works only when devices started
const isMueteMe = document.getElementById('muteMe');
isMueteMe.checked = false;
isMueteMe.addEventListener("change", function() {
  if(isMueteMe.checked == true) {
    localStream.getTracks()[0].enabled = false;
    console.log("muted me");
  } else {
    localStream.getTracks()[0].enabled = true;
    console.log("unmuted me");
  }
});


// create an offer

// write
const db = getFirestore();
// const docRef = doc(collection(db, "objects"));
// await setDoc(docRef, {nothing: "acutally nothing."});
// const updateTimestamp = await updateDoc(docRef, {
//   Timestamp: serverTimestamp()
// });

const callDoc = doc(collection(db, "calls1"));
const offerCandidates = callDoc.collection(db, "offerCandidates");
const answerCandidates = callDoc.collection(db, "answerCandidates");
await setDoc(callDoc, {
  answer: {
    sdp: "v=0o=- 1996785498149694969 2 IN IP4 127.0.0.1s=-t=0 0a=group:BUNDLE 0a=extmap-allow-mixeda=msid-semantic: WMS tPmtU2cGFqwfGn8NqAQ5KmK0iZJ3yk7ZbaXem=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126c=IN IP4 0.0.0.0a=rtcp:9 IN IP4 0.0.0.0a=ice-ufrag:yOBka=ice-pwd:uDHV+22Wxz/njg9gPkYZdRgGa=ice-options:tricklea=fingerprint:sha-256 AD:E2:1D:C0:4C:9F:AF:57:71:67:86:EE:E1:22:7F:58:D4:D5:34:60:D5:EF:08:FE:7B:88:AD:FA:E6:2D:02:E8a=setup:activea=mid:0a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-levela=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-timea=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mida=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-ida=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-ida=sendrecva=msid:tPmtU2cGFqwfGn8NqAQ5KmK0iZJ3yk7ZbaXe 01caea68-be7b-474a-bf58-3dde3009c49ba=rtcp-muxa=rtpmap:111 opus/48000/2a=rtcp-fb:111 transport-cca=fmtp:111 minptime=10;useinbandfec=1a=rtpmap:103 ISAC/16000a=rtpmap:104 ISAC/32000a=rtpmap:9 G722/8000a=rtpmap:0 PCMU/8000a=rtpmap:8 PCMA/8000a=rtpmap:106 CN/32000a=rtpmap:105 CN/16000a=rtpmap:13 CN/8000a=rtpmap:110 telephone-event/48000a=rtpmap:112 telephone-event/32000a=rtpmap:113 telephone-event/16000a=rtpmap:126 telephone-event/8000a=ssrc:3728018646 cname:gfXrZdVTmS1XNrvD",
    type: "answer"
  },
  offer: {
    sdp: "v=0o=- 6175464053237841724 2 IN IP4 127.0.0.1s=-t=0 0a=group:BUNDLE 0a=extmap-allow-mixeda=msid-semantic: WMS YwOxP4bEuEZjJlkmNwpeDoGIUZBF0yg3h57sm=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 112 113 126c=IN IP4 0.0.0.0a=rtcp:9 IN IP4 0.0.0.0a=ice-ufrag:0VvSa=ice-pwd:nq+6bYoV6+DWBFjtuI65eAnma=ice-options:tricklea=fingerprint:sha-256 EB:97:A9:EC:1D:BF:D9:A9:36:5F:9B:E6:11:3F:1F:75:A4:F6:37:BB:6F:E6:E5:B7:96:68:C9:AC:C6:86:D6:A4a=setup:actpassa=mid:0a=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-levela=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-timea=extmap:3 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01a=extmap:4 urn:ietf:params:rtp-hdrext:sdes:mida=extmap:5 urn:ietf:params:rtp-hdrext:sdes:rtp-stream-ida=extmap:6 urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-ida=sendrecva=msid:YwOxP4bEuEZjJlkmNwpeDoGIUZBF0yg3h57s dfe42563-3a15-456c-a694-2d4b27d3780ea=rtcp-muxa=rtpmap:111 opus/48000/2a=rtcp-fb:111 transport-cca=fmtp:111 minptime=10;useinbandfec=1a=rtpmap:103 ISAC/16000a=rtpmap:104 ISAC/32000a=rtpmap:9 G722/8000a=rtpmap:0 PCMU/8000a=rtpmap:8 PCMA/8000a=rtpmap:106 CN/32000a=rtpmap:105 CN/16000a=rtpmap:13 CN/8000a=rtpmap:110 telephone-event/48000a=rtpmap:112 telephone-event/32000a=rtpmap:113 telephone-event/16000a=rtpmap:126 telephone-event/8000a=ssrc:134472989 cname:lWe/6jT1dJU+7NfLa=ssrc:134472989 msid:YwOxP4bEuEZjJlkmNwpeDoGIUZBF0yg3h57s dfe42563-3a15-456c-a694-2d4b27d3780ea=ssrc:134472989 mslabel:YwOxP4bEuEZjJlkmNwpeDoGIUZBF0yg3h57sa=ssrc:134472989 label:dfe42563-3a15-456c-a694-2d4b27d3780e",
    type: "offer"
  }
});


// read
const citiesRef = collection(db, "cities");

await setDoc(doc(citiesRef, "SF"), {
    name: "San Francisco", state: "CA", country: "USA",
    capital: false, population: 860000,
    regions: ["west_coast", "norcal"] });
await setDoc(doc(citiesRef, "LA"), {
    name: "Los Angeles", state: "CA", country: "USA",
    capital: false, population: 3900000,
    regions: ["west_coast", "socal"] });
await setDoc(doc(citiesRef, "DC"), {
    name: "Washington, D.C.", state: null, country: "USA",
    capital: true, population: 680000,
    regions: ["east_coast"] });
await setDoc(doc(citiesRef, "TOK"), {
    name: "Tokyo", state: null, country: "Japan",
    capital: true, population: 9000000,
    regions: ["kanto", "honshu"] });
await setDoc(doc(citiesRef, "BJ"), {
    name: "Beijing", state: null, country: "China",
    capital: true, population: 21500000,
    regions: ["jingjinji", "hebei"] });

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
const q = query(collection(db, "cities"), where("state", "==", "CA"));
const unsubscribe = onSnapshot(q, (querySnapshot) => {
  const cities = [];
  querySnapshot.forEach((doc) => {
    cities.push(doc.data().name);
  });
  console.log("Current cities in CA: ", cities.join(", "));
});



// answer the call

