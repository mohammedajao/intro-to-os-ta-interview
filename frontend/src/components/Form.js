import {useState} from 'react';
import { Line } from 'rc-progress';
import './Form.css';

function Form(props) {
  const [currentFilename, setCurrentFilename] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentFile, setCurrentFile] = useState({});
  const [singleProgressBarPercent, setSingleProgressBarPercent] = useState(0);
  const onFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.items) {
      [...e.dataTransfer.items].forEach((item, i) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          setCurrentFile(file);
          setCurrentFilename(file.name);
          console.log(`… file[${i}].name = ${file.name}`);
        }
      });
    }
  };

  const uploadFileXHR = (file, onProgress) => {
    setSingleProgressBarPercent(0);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', e => onProgress(e));
      xhr.addEventListener('load', () => resolve({ status: xhr.status, body: xhr.responseText }));
      xhr.addEventListener('error', () => reject(new Error('File upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('File upload aborted')));
      xhr.open('POST', 'http://localhost:8000/upload', true);
      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  }

  const singleFileOptions = {
    onUploadProgress: (e) => {
      const {loaded, total} = e;
      const percentage = Math.floor((loaded/1000)*100)/(total/1000);
      setSingleProgressBarPercent(percentage);
    },
  };

  const uploadFile = (file) => {
    const request = uploadFileXHR(file, singleFileOptions.onUploadProgress)
      .then((res) => {
        console.log('The result is:', res);
        if(res && res.status < 400) {
          setErrorMessage('');
          setSuccessMessage('File uploaded successfully!');
          props.refetchDataCallback();
        } else {
          throw new Error('File not accepted');
        }
      }).catch((err) => {
        console.log('Error occurred uploading:', err);
        setErrorMessage(err.message);
        setSuccessMessage('');
      });
    // Currently, fetch is incompatible with readable streams
    // const url = 'http://localhost:8000/upload';
    // const formData = new FormData();
    // formData.append('file', file);
    // fetch(url, {
    //   method: 'POST',
    //   body: formData,
    // }).then((res) => {
    //   console.log('The result is:', res);
    //   if(res && res.ok) {
    //     setErrorMessage('');
    //     setSuccessMessage('File uploaded successfully!');
    //     props.refetchDataCallback();
    //   } else {
    //     throw new Error('File not accepted');
    //   }
    // }).catch((err) => {
    //   console.log('Error occurred uploading:', err);
    //   setErrorMessage(err.message);
    //   setSuccessMessage('');
    // });
  };

  const onDragOver = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const onDragEnter = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if(currentFile) {
      uploadFile(currentFile);
    }
  };

  return (
    <>
      <p>{successMessage ? successMessage : errorMessage}</p>
      <p>{currentFilename ? `Current File: ${currentFilename}` : ''}</p>
      <Line percent={singleProgressBarPercent} strokeWidth={4} strokeColor="#D3D3D3" />
      <form>
        <label htmlFor="file">Please upload a file:</label>
        <div 
          id="dropZone"
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDrop={onFileDrop}
        >
          <p>Drag a file here to upload it!</p>
        </div>
        <button onClick={onSubmit}>Submit</button>
      </form>
    </>
  );
}

export default Form;
