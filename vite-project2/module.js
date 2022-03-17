let localConnection;
let remoteConnection;
let sendChannel;
let receiveChannel;
const dataChannelSend = document.querySelector('textarea#dataChannelSend');
const dataChannelReceived = document.querySelector('textarea#dataChannelReceive');
const startButton = document.querySelector('button#startButton');
const sendButton = document.querySelector('button#sendButton');
const closeButton = document.querySelector('button#closeButton');

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;


function enableStartButton() {
  startButton.disabled = false;
}

function disableSendButton() {
  sendButton.disabled = true;
}

function createConnection() {
  dataChannelSend.placeholder = '';
  const servers = null;
  window.localConnection = localConnection = new RTCPeerConnection(servers);
  console.log('Created local peer connection object localConnection');

  sendChannel = localConnection.createDataChannel('sendDataChannel');
  console.log('Created send data channel');

  localConnection.onicecandidate = e => {
    onIceCandidate(localConnection, e);
  };
  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;

  window.remoteConnection = remoteConnection = new RTCPeerConnection(servers);
  console.log('Created remote peer connection object remoteConnection');

  remoteConnection.onicecandidate = e => {
    onIceCandidate(remoteConnection, e);
  };
  remoteConnection.ondatachannel = receiveChannelCallback;

  localConnection.createOffer().then(
      gotDescription1,
      onCreateSessionDescriptionError
  );
  startButton.disabled = true;
  closeButton.disabled = false;
}

function onCreateSessionDescriptionError(error) {
  console.log('Failed to create session description: ' + error.toString());
}

function sendData() {
  const data = dataChannelSend.value;
  sendChannel.send(data);
  console.log('Sent Data: ' + data);
}

function closeDataChannels() {
  console.log('Closing data channels');
  sendChannel.close();
  console.log('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  console.log('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  console.log('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  disableSendButton();
  enableStartButton();
}

function gotDescription1(desc) {
  localConnection.setLocalDescription(desc);
  console.log(`Offer from localConnection\n${desc.sdp}`);
  remoteConnection.setRemoteDescription(desc);
  remoteConnection.createAnswer().then(
      gotDescription2,
      onCreateSessionDescriptionError
  );
}

function gotDescription2(desc) {
  remoteConnection.setLocalDescription(desc);
  console.log(`Answer from remoteConnection\n${desc.sdp}`);
  localConnection.setRemoteDescription(desc);
}

function getOtherPc(pc) {
  return (pc === localConnection) ? remoteConnection : localConnection;
}

function getName(pc) {
  return (pc === localConnection) ? 'localPeerConnection' : 'remotePeerConnection';
}

function onIceCandidate(pc, event) {
  getOtherPc(pc)
      .addIceCandidate(event.candidate)
      .then(
          onAddIceCandidateSuccess,
          onAddIceCandidateError
      );
  console.log(`${getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log(`Failed to add Ice Candidate: ${error.toString()}`);
}

function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  console.log('Received Message');
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
}


const cityRef = doc(db, 'cities', 'BJ');
setDoc(cityRef, { capital: false}, { merge: false});

const q_comp = query(doc(db, 'fxValues', comp));
onSnapshot(q_comp, (snapshot) => {
  const data = snapshot.data();
  console.log("comp value is: ");
  console.log(data);
});

const q_comp = query(doc(db, 'fxValues', 'comp'));
onSnapshot(q_comp, (snapshot) => {
  const data = snapshot.data();
  if(typeof data.comp_threshold != "undefined") {comp_threshold.value = data.comp_threshold;}
  if(typeof data.comp_release != "undefined") {comp_release.value = data.comp_release;}
  if(typeof data.comp_attack != "undefined") {comp_attack.value = data.comp_attack;}
  if(typeof data.comp_knee != "undefined") {comp_knee.value = data.comp_knee;}
  if(typeof data.comp_ratio != "undefined") {comp_ratio.value = data.comp_ratio;}
  if(typeof data.comp_bypass != "undefined") {
    comp_bypass.state = data.comp_bypass;
  }
});

const q_eq = query(doc(db, 'fxValues', 'eq'));
onSnapshot(q_eq, (snapshot) => {
  const data = snapshot.data();
  if(typeof data.eq_type != "undefined") {eq_type.value = data.eq_type;}
  if(typeof data.eq_freq != "undefined") {eq_freq.value = data.eq_freq;}
  if(typeof data.eq1 != "undefined") {eq1.value = data.eq1;}
  if(typeof data.eq_bypass != "undefined") {
    eq_bypass.state = data.eq_bypass;
  }
});

const q_other = query(doc(db, 'fxValues', 'other'));
onSnapshot(q_other, (snapshot) => {
  const data = snapshot.data();
  if(typeof data.pan != "undefined") {pan.value = data.pan;}
  if(typeof data.gain != "undefined") {gain.value = data.gain;}
  if(typeof data.eq_bypass != "undefined") {
    gain_bypass.state = data.gain_bypass;
  }
  if(typeof data.eq_bypass != "undefined") {
    pan_bypass.state = data.pan_bypass;
  }
});