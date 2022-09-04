import Form from './components/Form.js';
import MediaView from './components/MediaView';
import {useState, useEffect} from 'react';

function App() {
  const [currentMediaItems, setMediaItems] = useState([]);
  const fetchData = () => {
    console.log('Refetch called')
    fetch('http://localhost:8000/files', {
      headers: {
        range: 'bytes=3744-\\',
      }
    }).then(res => {
      return res.json();
    }).then(data => {
      if(data) {
        setMediaItems(data);
      }
    }).catch(err => {
      console.log(err);
    });
  };

  const deleteData = (mediaID) => {
    const filteredMediaItems = currentMediaItems.filter(mediaItem => {
      return mediaItem._id !== mediaID;
    });

    setMediaItems(filteredMediaItems);
    fetch(`http://localhost:8000/media/delete/${mediaID}`, {
      method: 'POST',
      headers: {
        "Content-Type":"application/json"
       },
    }).then(res => {
      return res.json();
    }).then(data => {
      console.log(data);
      setMediaItems(filteredMediaItems);
    }).catch(err => {
      console.log(err);
    });
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="App">
      <h1>Intro to OS TA Interview</h1>
      <h3>Notes</h3>
      <ul>
        <li>Clicking on files deletes them</li>
        <li>Only basic media files are accepted like images and mp4 videos. Others are rejected. PDFs too.</li>
        <li>Decided to use media over arbitrary file types to showcase it easily. I can add arbitrary types too but I wouldn't have time to test so many different ones.</li>
        <li>Current largest file tested: 115.6MB</li>
      </ul>
      <header className="App-header">
        <Form
          refetchDataCallback={() => {
            console.log('Refetch callback called!');
            fetchData();
          }}
        />
        <MediaView
          deleteMedia={(targetID) => deleteData(targetID)}
          files={currentMediaItems || []}
        />
      </header>
    </div>
  );
}

export default App;
