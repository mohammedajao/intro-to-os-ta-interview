import {useState, useEffect} from 'react';
import './MediaView.css'

function MediaView(props) {
  console.log('Media Items are:', props.files)
  const [mediaElements, setMediaElements] = useState([]);
  const deleteMedia = (targetID) => {
    props.deleteMedia?.(targetID);
  };
  useEffect(() => {
    if(props.files && props.files instanceof Array) {
      const mediaItems = props.files?.map((mediaFile, index) => {
        if(mediaFile.contentType === 'video/mp4') {
          return (
            <video onClick={() => deleteMedia(mediaFile._id)} key={mediaFile._id} id={mediaFile._id} controls>
              <source src={`http://localhost:8000/media/${mediaFile.filename}`} type={mediaFile.contentType}></source>
            </video>
          );
        } else if (mediaFile.contentType === 'image/jpeg' || mediaFile.contentType === 'image/png') {
          return (
            <img onClick={() => deleteMedia(mediaFile._id)} key={mediaFile._id} id={mediaFile._id} alt={mediaFile.filename} src={`http://localhost:8000/media/${mediaFile.filename}`}></img>
          )
        }
        return null;
      });
      setMediaElements(mediaItems);
    }
  }, [props.files])
  return (
    <div className="media-element__container">
      {mediaElements}
    </div>
  );
}

export default MediaView;