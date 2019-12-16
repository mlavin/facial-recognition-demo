import React, { useEffect, useRef, useState } from 'react';
import './App.css';

function App() {
  const [videoStatus, setVideoStatus] = useState('off');
  const [imageCapture, setImageCapture] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [searching, setSearchStatus] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const constraints = {
      video: true
    };
    if (video.srcObject) {
      if (videoStatus !== 'on') {
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(function(track) {
            track.stop();
          });
        }
        video.srcObject = null;
      }
    } else {
      if (videoStatus === 'loading') {
        setImageData(null);
        setMatches([]);
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
          video.srcObject = stream;
          setVideoStatus('on');
        });
      }
    }
  }, [videoStatus]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (imageCapture) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      setImageData(canvas.toDataURL());
      setImageCapture(false);
      setVideoStatus('off');
    }
  }, [imageCapture]);

  useEffect(() => {
    const fetchImages = async () => {
      const [_type, data] = imageData.split(',');
      setSearchStatus(true);
      const response = await fetch(
        'https://np2w8wadn3.execute-api.us-east-1.amazonaws.com/api/', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: data,
        }),
      });
      const results = await response.json();
      setMatches(results.matches.length ?  results.matches : null);
      setSearchStatus(false);
    };

    if (imageData !== null) {
      fetchImages();
    }
  }, [imageData]);

  const videoOn = videoStatus === 'on';

  return (
    <div className="App">
        <div className="video-wrapper">
          {
            (videoStatus !== 'off') &&
            <div className="loader">Loading...</div>
          }
          <video className={videoStatus} ref={videoRef} autoPlay={videoOn}></video>
          {
            imageData &&
            <img src={imageData} alt="Reference Face Screenshot" />
          }
        </div>
        <div className="actions">
          {
            videoOn ? (
              <React.Fragment>
                <button onClick={() => setVideoStatus('off')}>Stop Video</button>
                <button onClick={() => setImageCapture(true)}>Find My Photos</button>
              </React.Fragment>
            ) : (
              <button onClick={() => setVideoStatus('loading')}>
                {
                  (searching || (matches && matches.length)) ?
                  'Start Over' :
                  'Start Video'
                }
              </button>
            )
          }
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        <div className="results">
          {
            searching &&
            <div className="loader">Loading...</div>
          }
          {
            matches !== null ? (
              matches.map((match, index) => <img key={`result-${index}`} src={match} alt="" />)
            ) : (
              <span>No Results Found :(</span>
            )
          }
        </div>
    </div>
  );
}

export default App;
